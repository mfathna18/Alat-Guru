/**
 * Normalisasi DOM rapor agar Word (.doc HTML) identik & tidak berantakan.
 * Word tidak mendukung CSS Grid/Flex dengan baik — dikonversi ke tabel HTML.
 */
export const RAPOR_MAN_WORD_CSS = `
body {
  font-family: "Times New Roman", Times, serif;
  margin: 0;
  padding: 0;
}

.rapor-print-root,
.rapor-a4,
.rapor-print-page,
.rapor-man-page {
  width: 210mm;
  max-width: 210mm;
}

.rapor-man-page {
  padding: 12mm 14mm;
  mso-page-orientation: portrait;
}

.rapor-print-page {
  page-break-after: always;
  mso-page-break-after: always;
}

.rapor-print-page:last-child {
  page-break-after: auto;
  mso-page-break-after: auto;
}

.rapor-man-biodata-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 14px;
  font-size: 10pt;
  line-height: 1.45;
}

.rapor-man-biodata-table td {
  width: 50%;
  vertical-align: top;
  padding: 0 10px 0 0;
  border: none;
}

.rapor-man-signatures-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 24px;
  font-size: 10pt;
  line-height: 1.35;
}

.rapor-man-signatures-table td {
  width: 33.33%;
  text-align: center;
  vertical-align: top;
  border: none;
  padding: 0 4px;
}

.rapor-man-footer-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
  border-top: 1px solid #cccccc;
  font-size: 8pt;
  line-height: 1.3;
}

.rapor-man-footer-table td {
  border: none;
  vertical-align: bottom;
  padding-top: 6px;
}

.rapor-man-footer-table td.footer-id {
  text-align: left;
  text-transform: uppercase;
  width: 80%;
}

.rapor-man-footer-table td.footer-page {
  text-align: right;
  white-space: nowrap;
  width: 20%;
}

.rapor-man-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  mso-table-lspace: 0pt;
  mso-table-rspace: 0pt;
  mso-table-anchor-vertical: paragraph;
  mso-table-anchor-horizontal: margin;
}

.rapor-man-table th,
.rapor-man-table td {
  border: 1px solid #000000;
  padding: 4px 5px;
  vertical-align: middle;
  text-align: center;
  mso-vertical-align-alt: middle;
  word-wrap: break-word;
}

.rapor-man-table th.text-left,
.rapor-man-table td.text-left,
.rapor-man-table .section-row td,
.rapor-man-table .italic-row td {
  text-align: left;
}

.rapor-man-table td.text-center,
.rapor-man-table th.text-center {
  text-align: center;
  vertical-align: middle;
}

.rapor-man-table th {
  background-color: #f0f0f0;
  font-weight: 600;
}

.rapor-man-table .section-row td {
  background-color: #f5f5f5;
  font-weight: 700;
  text-transform: uppercase;
}

.rapor-man-table .total-row td {
  font-weight: 700;
}
`;

function replaceWithTable(
  section: HTMLElement,
  tableClass: string,
  columnWidths: string[],
  mapCell?: (td: HTMLTableCellElement, index: number) => void,
): void {
  const cols = Array.from(section.children).filter(
    (el) => el.tagName === "DIV" || el.tagName === "P",
  );
  if (cols.length === 0) return;

  const table = document.createElement("table");
  table.className = tableClass;
  table.setAttribute("width", "100%");
  table.setAttribute("border", "0");
  table.setAttribute("cellpadding", "0");
  table.setAttribute("cellspacing", "0");

  const tr = document.createElement("tr");
  cols.forEach((col, i) => {
    const td = document.createElement("td");
    td.style.width = columnWidths[i] ?? `${100 / cols.length}%`;
    td.innerHTML = col.innerHTML;
    mapCell?.(td, i);
    tr.appendChild(td);
  });

  table.appendChild(tr);
  section.replaceWith(table);
}

function convertFooterToTable(footer: HTMLElement): void {
  const idEl = footer.querySelector(".rapor-man-footer-id");
  const pageEl = footer.querySelector(".rapor-man-footer-page");
  if (!idEl || !pageEl) return;

  const table = document.createElement("table");
  table.className = "rapor-man-footer-table";
  table.setAttribute("width", "100%");
  table.setAttribute("border", "0");
  table.setAttribute("cellpadding", "0");
  table.setAttribute("cellspacing", "0");

  const tr = document.createElement("tr");
  const tdId = document.createElement("td");
  tdId.className = "footer-id";
  tdId.innerHTML = idEl.innerHTML;

  const tdPage = document.createElement("td");
  tdPage.className = "footer-page";
  tdPage.innerHTML = pageEl.innerHTML;

  tr.appendChild(tdId);
  tr.appendChild(tdPage);
  table.appendChild(tr);
  footer.replaceWith(table);
}

function applyWordTableAttributes(root: HTMLElement): void {
  root.querySelectorAll<HTMLTableElement>(".rapor-man-table").forEach((table) => {
    table.setAttribute("border", "1");
    table.setAttribute("cellpadding", "4");
    table.setAttribute("cellspacing", "0");
    table.setAttribute("width", "100%");
    table.style.borderCollapse = "collapse";
    table.style.tableLayout = "fixed";
  });
}

/** Konversi layout modern → tabel HTML untuk kompatibilitas Word. */
export function prepareCloneForWord(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>(".rapor-man-biodata").forEach((section) => {
    replaceWithTable(section, "rapor-man-biodata-table", ["50%", "50%"]);
  });

  root.querySelectorAll<HTMLElement>(".rapor-man-signatures").forEach((section) => {
    replaceWithTable(section, "rapor-man-signatures-table", ["33.33%", "33.33%", "33.34%"]);
  });

  root.querySelectorAll<HTMLElement>(".rapor-man-footer").forEach(convertFooterToTable);

  applyWordTableAttributes(root);

  root.querySelectorAll<HTMLElement>(".rapor-a4, .rapor-print-page").forEach((el) => {
    el.style.border = "none";
    el.style.boxShadow = "none";
    el.style.borderRadius = "0";
  });
}
