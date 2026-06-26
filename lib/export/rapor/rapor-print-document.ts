/**
 * Utilitas bersama: dokumen rapor terisolasi (cetak & capture PDF).
 * Satu sumber CSS — tanpa Tailwind/oklch.
 */
import { RAPOR_MAN_PRINT_DOCUMENT_CSS } from "@/lib/export/rapor/rapor-man-capture-css";
import { fitAllRaporPrintUnits } from "@/lib/export/rapor/rapor-content-scale";

export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;

const MM_TO_PX = 96 / 25.4;
/** Lebar area tabel dalam halaman MAN (210mm − padding 14mm×2). */
const MAN_TABLE_FALLBACK_WIDTH_PX = Math.round((210 - 28) * MM_TO_PX);

export const RAPOR_PRINT_HEAD_META = `<meta charset="utf-8"><meta name="viewport" content="width=${A4_WIDTH_PX}, initial-scale=1">`;

/** Persentase lebar kolom — total harus 100% */
export const COL_WIDTH_RATIO: Record<string, number> = {
  "col-no": 0.08,
  "col-mapel": 0.46,
  "col-nilai": 0.12,
  "col-predikat": 0.1,
  "col-third": 1 / 3,
  "col-kegiatan": 0.28,
  "col-predikat-sm": 0.14,
  "col-ket": 0.5,
  "col-legend": 0.2,
};

export async function waitForImages(root: HTMLElement | Document): Promise<void> {
  const container = root instanceof Document ? root.body : root;
  const imgs = Array.from(container.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
        }),
    ),
  );
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}

export function cloneRaporRoot(
  rootEl: HTMLElement,
  options: { stripInlineStyles?: boolean; removeWatermark?: boolean } = {},
): HTMLElement {
  const { stripInlineStyles = true, removeWatermark = false } = options;
  const clone = rootEl.cloneNode(true) as HTMLElement;

  if (stripInlineStyles) {
    clone.querySelectorAll("style").forEach((node) => node.remove());
  }
  if (removeWatermark) {
    clone.querySelectorAll(".rapor-watermark-layer").forEach((node) => node.remove());
  }

  clone.querySelectorAll<HTMLElement>(".rapor-a4, .rapor-print-page").forEach((el) => {
    el.style.border = "none";
    el.style.boxShadow = "none";
    el.style.borderRadius = "0";
  });

  return clone;
}

function pinDualHeaderWidths(table: HTMLTableElement, colWidths: number[]): void {
  if (colWidths.length < 6) return;

  const row1 = table.querySelector("thead tr:first-child");
  const row2 = table.querySelector("thead tr:nth-child(2)");
  if (!row1) return;

  const cells1 = row1.querySelectorAll("th");
  if (cells1.length >= 4) {
    const setHeader = (el: Element, w: number, align: "left" | "center") => {
      const h = el as HTMLElement;
      h.style.width = `${w}px`;
      h.style.textAlign = align;
      h.style.verticalAlign = "middle";
    };
    setHeader(cells1[0]!, colWidths[0]!, "center");
    setHeader(cells1[1]!, colWidths[1]!, "left");
    setHeader(cells1[2]!, colWidths[2]! + colWidths[3]!, "center");
    setHeader(cells1[3]!, colWidths[4]! + colWidths[5]!, "center");
  }

  if (row2) {
    const cells2 = row2.querySelectorAll("th");
    cells2.forEach((th, i) => {
      const w = colWidths[i + 2];
      if (w) {
        const el = th as HTMLElement;
        el.style.width = `${w}px`;
        el.style.textAlign = "center";
        el.style.verticalAlign = "middle";
      }
    });
  }
}

function pinBodyCellWidths(table: HTMLTableElement, colWidths: number[]): void {
  table.querySelectorAll("tbody tr").forEach((tr) => {
    let colIndex = 0;
    tr.querySelectorAll("td").forEach((td) => {
      const el = td as HTMLElement;
      const colspan = parseInt(td.getAttribute("colspan") || "1", 10);

      if (colspan >= colWidths.length) {
        el.style.width = "100%";
        return;
      }

      const width = colWidths
        .slice(colIndex, colIndex + colspan)
        .reduce((sum, w) => sum + w, 0);
      el.style.width = `${width}px`;
      if (el.classList.contains("text-center")) {
        el.style.textAlign = "center";
        el.style.verticalAlign = "middle";
      } else if (el.classList.contains("text-left")) {
        el.style.textAlign = "left";
        el.style.verticalAlign = "middle";
      }
      colIndex += colspan;
    });
  });
}

function resolveManTableWidthPx(table: HTMLTableElement): number {
  const measured = table.getBoundingClientRect().width;
  if (measured >= 200) return measured;

  const page = table.closest(".rapor-man-page") as HTMLElement | null;
  if (page) {
    const pageW = page.getBoundingClientRect().width;
    if (pageW >= 200) {
      const view = page.ownerDocument?.defaultView;
      const style = view?.getComputedStyle(page);
      const pl = parseFloat(style?.paddingLeft ?? "0") || 0;
      const pr = parseFloat(style?.paddingRight ?? "0") || 0;
      return Math.max(pageW - pl - pr, 1);
    }
  }

  return MAN_TABLE_FALLBACK_WIDTH_PX;
}

export function finalizeRaporTables(root: HTMLElement): void {
  root.querySelectorAll<HTMLTableElement>(".rapor-man-table").forEach((table) => {
    table.style.tableLayout = "fixed";
    table.style.width = "100%";
    table.style.maxWidth = "100%";
    table.style.borderCollapse = "collapse";

    const wrap = table.closest(".rapor-man-table-wrap") as HTMLElement | null;
    if (wrap) {
      wrap.style.width = "100%";
      wrap.style.maxWidth = "100%";
      wrap.style.overflow = "hidden";
    }

    const tableWidth = resolveManTableWidthPx(table);
    if (tableWidth <= 0) return;

    const cols = Array.from(table.querySelectorAll("colgroup col"));
    if (cols.length === 0) return;

    const ratios = cols.map((col) => {
      const cls = Array.from(col.classList).find((c) => COL_WIDTH_RATIO[c]);
      return cls ? COL_WIDTH_RATIO[cls]! : 0;
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

    pinDualHeaderWidths(table, colWidths);
    pinBodyCellWidths(table, colWidths);
  });
}

export function writePrintDocumentShell(doc: Document): void {
  doc.open();
  doc.write(
    `<!DOCTYPE html><html lang="id"><head>${RAPOR_PRINT_HEAD_META}<title>Rapor</title><style>${RAPOR_MAN_PRINT_DOCUMENT_CSS}</style></head><body></body></html>`,
  );
  doc.close();
  doc.body.style.margin = "0";
  doc.body.style.padding = "0";
  doc.body.style.background = "#ffffff";
  doc.body.style.display = "block";
  doc.body.style.height = "auto";
}

/** Kunci lebar dokumen cetak ke A4 — penting di mobile (iframe sempit memecah halaman). */
export function pinRaporPrintDocumentWidth(doc: Document, root: HTMLElement): void {
  const widthMm = "210mm";
  const widthPx = `${A4_WIDTH_PX}px`;

  doc.documentElement.style.width = widthPx;
  doc.documentElement.style.minWidth = widthPx;
  doc.documentElement.style.maxWidth = widthPx;
  doc.body.style.width = widthPx;
  doc.body.style.minWidth = widthPx;
  doc.body.style.maxWidth = widthPx;
  doc.body.style.margin = "0";
  doc.body.style.padding = "0";

  root.style.width = widthMm;
  root.style.minWidth = widthMm;
  root.style.maxWidth = widthMm;
  root.style.margin = "0 auto";

  root
    .querySelectorAll<HTMLElement>(
      ".rapor-print-unit, .rapor-a4, .rapor-print-page, .rapor-man-page, .rapor-km-body",
    )
    .forEach((el) => {
      el.style.width = widthMm;
      el.style.minWidth = widthMm;
      el.style.maxWidth = widthMm;
    });

  root
    .querySelectorAll<HTMLElement>(".rapor-content-inner, .rapor-content-scale-outer")
    .forEach((el) => {
      el.style.transform = "none";
      el.style.zoom = "1";
      el.style.setProperty("--rapor-content-scale", "1");
      el.style.width = "100%";
      el.style.maxWidth = widthMm;
    });
}

export async function mountRaporPrintBody(
  rootEl: HTMLElement,
  doc: Document,
  options: { removeWatermark?: boolean; contentScale?: number } = {},
): Promise<HTMLElement> {
  writePrintDocumentShell(doc);

  const clone = cloneRaporRoot(rootEl, {
    stripInlineStyles: true,
    removeWatermark: options.removeWatermark ?? false,
  });

  doc.body.appendChild(clone);
  pinRaporPrintDocumentWidth(doc, clone);
  await waitForImages(doc);
  await new Promise((r) => setTimeout(r, 150));
  void clone.offsetHeight;
  finalizeRaporTables(clone);

  fitAllRaporPrintUnits(clone, options.contentScale ?? 1);

  await new Promise((r) => requestAnimationFrame(r));

  return clone;
}
