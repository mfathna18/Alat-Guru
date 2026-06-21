/** Utilitas tabel rapor Kurikulum Merdeka */
import { KM_PRINT_COL_PERCENT } from "@/lib/export/rapor/rapor-km-capture-css";

export const KM_COL_WIDTH_RATIO: Record<string, number> = {
  "col-no": 0.08,
  "col-mapel": 0.22,
  "col-nilai": 0.15,
  "col-capaian": 0.55,
};

function isKmCompactRoot(root: HTMLElement): boolean {
  return (
    root.classList.contains("rapor-km-compact") ||
    root.closest(".rapor-km-compact") !== null
  );
}

function applyCompactTableLayout(table: HTMLTableElement): void {
  table.style.tableLayout = "fixed";
  table.style.width = "100%";
  table.style.maxWidth = "100%";
  table.style.borderCollapse = "collapse";
  table.style.boxSizing = "border-box";

  const wrap = table.closest(".rapor-km-table-wrap") as HTMLElement | null;
  if (wrap) {
    wrap.style.width = "100%";
    wrap.style.maxWidth = "100%";
    wrap.style.boxSizing = "border-box";
    wrap.style.overflow = "hidden";
  }

  table.querySelectorAll("colgroup col").forEach((col) => {
    const cls = Array.from(col.classList).find((c) => KM_PRINT_COL_PERCENT[c]);
    const width = cls ? KM_PRINT_COL_PERCENT[cls]! : "25%";
    col.setAttribute("style", `width:${width}`);
  });

  table.querySelectorAll("th, td").forEach((cell) => {
    const el = cell as HTMLElement;
    el.style.width = "";
    el.style.maxWidth = "";
    el.style.minWidth = "0";
    el.style.padding = "2px 4px";
    el.style.whiteSpace = "normal";
    el.style.wordWrap = "break-word";
    el.style.overflowWrap = "break-word";
    el.style.boxSizing = "border-box";
  });
}

export function finalizeKmRaporTables(root: HTMLElement): void {
  const compact = isKmCompactRoot(root);
  const cellPadding = compact ? "2px 4px" : "8px 10px";

  root.querySelectorAll<HTMLTableElement>(".rapor-km-table").forEach((table) => {
    if (compact) {
      applyCompactTableLayout(table);
      return;
    }

    table.style.tableLayout = "fixed";
    table.style.width = "100%";
    table.style.maxWidth = "100%";
    table.style.borderCollapse = "collapse";

    const wrap = table.closest(".rapor-km-table-wrap") as HTMLElement | null;
    if (wrap) {
      wrap.style.width = "100%";
      wrap.style.maxWidth = "100%";
    }

    const tableWidth = table.getBoundingClientRect().width;
    if (tableWidth <= 0) return;

    const cols = Array.from(table.querySelectorAll("colgroup col"));
    if (cols.length === 0) return;

    const ratios = cols.map((col) => {
      const cls = Array.from(col.classList).find((c) => KM_COL_WIDTH_RATIO[c]);
      return cls ? KM_COL_WIDTH_RATIO[cls]! : 0;
    });

    const ratioSum = ratios.reduce((a, b) => a + b, 0);
    const normalized =
      ratioSum > 0
        ? ratios.map((r) => r / ratioSum)
        : ratios.map(() => 1 / cols.length);

    const colWidths: number[] = [];
    let assigned = 0;

    cols.forEach((col, i) => {
      const isLast = i === cols.length - 1;
      const px = isLast
        ? Math.round(tableWidth - assigned)
        : Math.round(tableWidth * normalized[i]!);
      assigned += px;
      colWidths.push(px);
      col.setAttribute("style", `width:${px}px`);
    });

    table.querySelectorAll("thead th").forEach((th, i) => {
      const el = th as HTMLElement;
      const w = colWidths[i];
      if (w) el.style.width = `${w}px`;
      el.style.padding = cellPadding;
      el.style.whiteSpace = "normal";
    });

    table.querySelectorAll("tbody tr").forEach((tr) => {
      let colIndex = 0;
      tr.querySelectorAll("td").forEach((td) => {
        const el = td as HTMLElement;
        const colspan = parseInt(td.getAttribute("colspan") || "1", 10);
        if (colspan >= colWidths.length) return;

        const width = colWidths
          .slice(colIndex, colIndex + colspan)
          .reduce((sum, w) => sum + w, 0);
        el.style.width = `${width}px`;
        el.style.padding = cellPadding;
        el.style.whiteSpace = "normal";
        el.style.wordWrap = "break-word";
        el.style.overflowWrap = "break-word";

        if (el.classList.contains("text-center")) {
          el.style.textAlign = "center";
          el.style.verticalAlign = "middle";
        } else if (el.classList.contains("capaian-cell")) {
          el.style.textAlign = "left";
          el.style.verticalAlign = "top";
        } else if (el.classList.contains("text-left")) {
          el.style.textAlign = "left";
          el.style.verticalAlign = "middle";
        }
        colIndex += colspan;
      });
    });
  });
}
