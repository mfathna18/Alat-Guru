/**
 * CSS rapor Kurikulum Merdeka — rgb/hex only (aman html2canvas & Word).
 */
import { RAPOR_PRINT_CONTENT_SCALE_CSS, RAPOR_PRINT_UNIT_CSS } from "@/lib/export/rapor/rapor-content-scale";

/** Persentase kolom tabel KM — dipakai @media print & capture PDF. */
export const KM_PRINT_COL_PERCENT: Record<string, string> = {
  "col-no": "5%",
  "col-mapel": "22%",
  "col-nilai": "10%",
  "col-capaian": "63%",
};

/** Aliran cetak KM — cegah loncat halaman & flex/grid yang memecah layout. */
export function kmPrintFlowRules(root: string): string {
  const flowContainers = [
    `${root} .rapor-km-header`,
    `${root} .rapor-km-biodata`,
    `${root} .rapor-km-section`,
    `${root} .rapor-km-table-wrap`,
    `${root} .rapor-km-table`,
    `${root} .rapor-km-table tbody`,
    `${root} .rapor-km-table thead`,
    `${root} .rapor-km-footer`,
    `${root} .rapor-km-signatures`,
    `${root} .rapor-km-date`,
  ].join(",\n");

  return `
${flowContainers} {
  display: block !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  page-break-before: auto !important;
  break-before: auto !important;
  page-break-after: auto !important;
  break-after: auto !important;
  page-break-inside: auto !important;
  break-inside: auto !important;
}

${root} .rapor-km-biodata-row {
  display: block !important;
}

${root} .rapor-km-signatures {
  display: block !important;
  text-align: center !important;
  font-size: 0 !important;
}

${root} .rapor-km-signature-col {
  display: inline-block !important;
  width: 33.33% !important;
  vertical-align: top !important;
  font-size: 8pt !important;
  page-break-inside: avoid !important;
  break-inside: avoid !important;
}

${root} .rapor-km-table tr {
  page-break-inside: avoid !important;
  break-inside: avoid !important;
}
`;
}

/**
 * Aturan cetak rapat — dipakai @media print & .rapor-km-compact (iframe PDF).
 * html2canvas tidak menerapkan @media print, jadi class compact wajib untuk export PDF.
 */
function kmPrintRules(root: string): string {
  return `
${root},
${root} .rapor-a4,
${root} .rapor-km-body,
${root} .rapor-km-table-wrap,
${root} .rapor-km-table {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

${root} {
  font-size: 10pt !important;
  line-height: 1.15 !important;
  margin: 0 !important;
  padding: 0 !important;
}

${root} .rapor-km-header {
  padding-bottom: 2px !important;
  margin-bottom: 3px !important;
}

${root} .rapor-km-header-logo {
  height: 28px !important;
  width: 28px !important;
  margin: 0 auto 1px !important;
}

${root} .rapor-km-header-sub {
  font-size: 7pt !important;
  margin: 0 !important;
}

${root} .rapor-km-header-school {
  font-size: 9pt !important;
  margin: 1px 0 0 !important;
}

${root} .rapor-km-header-address {
  font-size: 7pt !important;
  margin: 0 !important;
}

${root} .rapor-km-header-title {
  font-size: 8pt !important;
  margin: 3px 0 0 !important;
}

${root} .rapor-km-header-meta {
  font-size: 7pt !important;
  margin: 0 !important;
}

${root} .rapor-km-biodata {
  font-size: 10pt !important;
  line-height: 1.15 !important;
  row-gap: 0 !important;
  column-gap: 8px !important;
  margin-bottom: 3px !important;
}

${root} .rapor-km-biodata-row {
  margin: 0 !important;
}

${root} .rapor-km-biodata-label {
  width: 88px !important;
}

${root} .rapor-km-section {
  margin-bottom: 3px !important;
}

${root} .rapor-km-section-title {
  font-size: 8pt !important;
  line-height: 1.15 !important;
  margin: 0 0 2px !important;
}

${root} .rapor-km-table-wrap {
  overflow: hidden !important;
}

${root} .rapor-km-table {
  font-size: 8pt !important;
  line-height: 1.15 !important;
  table-layout: fixed !important;
  border-collapse: collapse !important;
}

${root} .rapor-km-table col.col-no { width: ${KM_PRINT_COL_PERCENT["col-no"]} !important; }
${root} .rapor-km-table col.col-mapel { width: ${KM_PRINT_COL_PERCENT["col-mapel"]} !important; }
${root} .rapor-km-table col.col-nilai { width: ${KM_PRINT_COL_PERCENT["col-nilai"]} !important; }
${root} .rapor-km-table col.col-capaian { width: ${KM_PRINT_COL_PERCENT["col-capaian"]} !important; }

${root} .rapor-km-table th,
${root} .rapor-km-table td {
  padding: 2px 4px !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  word-break: break-word !important;
  white-space: normal !important;
  box-sizing: border-box !important;
}

${root} .rapor-km-table td.capaian-cell {
  line-height: 1.15 !important;
}

${root} .rapor-km-table .nilai-sub {
  font-size: 7pt !important;
  margin-top: 0 !important;
}

${root} .rapor-km-table .empty-row td {
  padding: 2px 4px !important;
}

${root} .rapor-km-text-block {
  font-size: 8pt !important;
  line-height: 1.15 !important;
  margin: 0 !important;
}

${root} .rapor-km-footer {
  margin-top: 5px !important;
  font-size: 8pt !important;
  line-height: 1.15 !important;
}

${root} .rapor-km-date {
  margin: 0 0 4px !important;
  font-size: 8pt !important;
  text-align: right !important;
}

${root} .rapor-km-signatures {
  text-align: center !important;
}

${root} .rapor-km-signature-col p {
  margin: 0 !important;
}

${root} .rapor-km-signature-gap {
  display: block !important;
  min-height: 3rem !important;
  margin: 0 !important;
}

${root} .rapor-signature-img {
  display: block !important;
  max-height: 3rem !important;
  width: auto !important;
  max-width: 100% !important;
  margin: 0 auto !important;
  object-fit: contain !important;
}

${root} .rapor-km-muted {
  font-size: 7pt !important;
}
`;
}

export const RAPOR_KM_LAYOUT_CSS = `
.rapor-km-doc {
  width: 210mm;
  max-width: 210mm;
  margin: 0 auto;
  background: #ffffff;
  color: #000000;
  font-family: "Times New Roman", Times, serif;
  font-size: 10pt;
  line-height: 1.4;
  box-sizing: border-box;
}

.rapor-km-body {
  text-align: left;
}

.rapor-km-header {
  text-align: center;
  border-bottom: 1px solid #cccccc;
  padding-bottom: 10px;
  margin-bottom: 12px;
}

.rapor-km-header-logo {
  display: block;
  height: 52px;
  width: 52px;
  object-fit: contain;
  margin: 0 auto 6px;
}

.rapor-km-header-sub {
  font-size: 9pt;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #444444;
  margin: 0;
}

.rapor-km-header-school {
  font-size: 12pt;
  font-weight: 700;
  text-transform: uppercase;
  margin: 4px 0 0;
}

.rapor-km-header-address {
  font-size: 9pt;
  color: #555555;
  margin: 2px 0 0;
}

.rapor-km-header-title {
  font-size: 11pt;
  font-weight: 700;
  text-transform: uppercase;
  margin: 10px 0 2px;
}

.rapor-km-header-meta {
  font-size: 9pt;
  margin: 0;
  color: #333333;
}

.rapor-km-biodata {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 16px;
  row-gap: 3px;
  font-size: 9pt;
  margin-bottom: 14px;
}

.rapor-km-biodata-row {
  margin: 0;
}

.rapor-km-biodata-label {
  display: inline-block;
  width: 108px;
  color: #555555;
}

.rapor-km-biodata-full {
  grid-column: 1 / -1;
}

.rapor-km-section {
  margin-bottom: 12px;
}

.rapor-km-section-title {
  font-size: 9pt;
  font-weight: 700;
  text-transform: uppercase;
  margin: 0 0 6px;
}

.rapor-km-table-wrap {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.rapor-km-table {
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 9pt;
  line-height: 1.35;
}

.rapor-km-table col.col-no { width: 8%; }
.rapor-km-table col.col-mapel { width: 22%; }
.rapor-km-table col.col-nilai { width: 15%; }
.rapor-km-table col.col-capaian { width: 55%; }

.rapor-km-table th,
.rapor-km-table td {
  border: 1px solid #000000;
  padding: 8px 10px;
  vertical-align: middle;
  text-align: center;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  white-space: normal;
  box-sizing: border-box;
}

.rapor-km-table thead th {
  background-color: #f0f0f0;
  font-weight: 600;
}

.rapor-km-table th.text-left,
.rapor-km-table td.text-left {
  text-align: left;
  vertical-align: middle;
}

.rapor-km-table td.text-center {
  text-align: center;
  vertical-align: middle;
}

.rapor-km-table td.capaian-cell {
  text-align: left;
  vertical-align: top;
  line-height: 1.45;
}

.rapor-km-table .nilai-sub {
  display: block;
  font-size: 8pt;
  color: #555555;
  margin-top: 2px;
}

.rapor-km-table .empty-row td {
  text-align: center;
  color: #666666;
  padding: 12px 10px;
}

.rapor-km-text-block {
  font-size: 9pt;
  line-height: 1.45;
  margin: 0;
}

.rapor-km-footer {
  margin-top: 24px;
  font-size: 9pt;
}

.rapor-km-date {
  margin: 0 0 12px;
  text-align: right;
  font-size: 9pt;
  color: #333333;
}

.rapor-km-signatures {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  text-align: center;
}

.rapor-km-signature-col p {
  margin: 0;
}

.rapor-km-signature-role {
  font-weight: 600;
}

.rapor-km-signature-gap {
  display: block;
  min-height: 4rem;
  margin: 0;
}

.rapor-signature-img {
  display: block;
  max-height: 4rem;
  width: auto;
  max-width: 100%;
  margin: 0 auto;
  object-fit: contain;
}

.rapor-km-muted {
  color: #555555;
  font-size: 8pt;
}
`;

/** Mode cetak rapat + aliran — iframe PDF (html2canvas tidak menerapkan @media print). */
export const RAPOR_KM_COMPACT_CSS = `
${kmPrintRules(".rapor-km-compact.rapor-km-doc")}
${kmPrintFlowRules(".rapor-km-compact.rapor-km-doc")}
`;

export const RAPOR_KM_PRINT_MEDIA_CSS = `
@media print {
  @page {
    size: A4 portrait;
    margin: 5mm;
  }

  html, body {
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    margin: 0 auto !important;
    padding: 0 !important;
    box-sizing: border-box !important;
    background: #ffffff !important;
    display: block !important;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .rapor-km-doc,
  .rapor-km-doc .rapor-a4 {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    margin: 0 auto !important;
    box-shadow: none !important;
    border: none !important;
  }

  .rapor-km-table-wrap {
    width: 100% !important;
    max-width: 100% !important;
    overflow: hidden !important;
  }

  .rapor-km-table {
    width: 100% !important;
    max-width: 100% !important;
    table-layout: fixed !important;
    border-collapse: collapse !important;
  }

  ${kmPrintRules(".rapor-km-doc")}
  ${kmPrintFlowRules(".rapor-km-doc")}
  ${RAPOR_PRINT_UNIT_CSS}

  .rapor-content-scale-outer,
  .rapor-content-inner,
  .rapor-km-body {
    text-align: left !important;
  }

  .rapor-km-header {
    text-align: center !important;
  }

  .rapor-km-section,
  .rapor-km-section-title,
  .rapor-km-biodata-row,
  .rapor-km-text-block {
    text-align: left !important;
  }
}
`;

export const RAPOR_KM_PRINT_DOCUMENT_CSS = `
@page {
  size: A4 portrait;
  margin: 5mm;
}

*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  width: 210mm;
  min-width: 210mm;
  max-width: 210mm;
  height: auto;
  min-height: 0;
  background: #ffffff;
  color: #000000;
}

body {
  display: block;
  margin: 0 auto;
}

#rapor-print-root {
  width: 210mm;
  min-width: 210mm;
  max-width: 210mm;
  margin: 0 auto;
}

.rapor-print-unit {
  width: 210mm !important;
  min-width: 210mm !important;
  max-width: 210mm !important;
}

${RAPOR_KM_LAYOUT_CSS}

${RAPOR_PRINT_CONTENT_SCALE_CSS}

${RAPOR_PRINT_UNIT_CSS}

${RAPOR_KM_COMPACT_CSS}

${kmPrintFlowRules(".rapor-km-doc")}
`;
