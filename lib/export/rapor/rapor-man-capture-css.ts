/**
 * CSS mandiri rapor MAN — rgb/hex only (aman html2canvas, tanpa oklch).
 */
import {
  RAPOR_CONTENT_SCALE_CSS,
  RAPOR_PRINT_CONTENT_SCALE_CSS,
  RAPOR_PRINT_UNIT_CSS,
} from "@/lib/export/rapor/rapor-content-scale";

export const RAPOR_MAN_LAYOUT_CSS = `
.rapor-print-root {
  width: 210mm;
  max-width: 210mm;
  margin: 0 auto;
  background: #ffffff;
  color: #000000;
  position: relative;
}

.rapor-print-root > .rapor-pages {
  position: relative;
  z-index: 1;
}

.rapor-a4 {
  width: 210mm;
  max-width: 210mm;
  box-sizing: border-box;
  background: #ffffff;
  color: #000000;
  position: relative;
  overflow: visible;
}

.rapor-print-page {
  width: 210mm;
  max-width: 210mm;
  box-sizing: border-box;
  background: #ffffff;
  page-break-after: always;
  break-after: page;
}

.rapor-print-page:last-child {
  page-break-after: auto;
  break-after: auto;
}

.rapor-watermark-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  overflow: hidden;
}

.rapor-watermark-layer img {
  max-width: 70%;
  max-height: 70%;
  object-fit: contain;
  opacity: 0.07;
}

.rapor-man-page {
  width: 210mm;
  max-width: 210mm;
  box-sizing: border-box;
  padding: 12mm 14mm;
  font-family: "Times New Roman", Times, serif;
  font-size: 10pt;
  line-height: 1.4;
  color: #000000;
  background: #ffffff;
  position: relative;
  z-index: 1;
  overflow: visible;
}

.rapor-man-page-body {
  width: 100%;
  max-width: 100%;
  text-align: left;
}

.rapor-man-header {
  text-align: center;
  border-bottom: 2px solid #000000;
  padding-bottom: 8px;
  margin-bottom: 12px;
}

.rapor-man-header-logo {
  display: block;
  height: 52px;
  width: 52px;
  object-fit: contain;
  margin: 0 auto 6px;
}

.rapor-man-header-line {
  font-size: 11pt;
  font-weight: 700;
  text-transform: uppercase;
  line-height: 1.3;
  letter-spacing: 0.02em;
  margin: 0;
}

.rapor-man-biodata {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 20px;
  row-gap: 2px;
  margin-bottom: 14px;
  font-size: 10pt;
  line-height: 1.45;
  width: 100%;
  max-width: 100%;
  text-align: left;
}

.rapor-man-biodata > div {
  text-align: left;
}

.rapor-man-biodata-row {
  margin: 0;
  text-align: left;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.rapor-man-biodata-label {
  font-weight: 600;
}

.rapor-man-section {
  margin-bottom: 12px;
  width: 100%;
  max-width: 100%;
  text-align: left;
  page-break-inside: avoid;
  break-inside: avoid;
}

.rapor-man-section-title {
  font-size: 10pt;
  font-weight: 700;
  text-transform: uppercase;
  margin: 0 0 4px;
  text-align: left;
}

.rapor-man-section-heading {
  font-size: 10pt;
  font-weight: 700;
  margin: 0 0 4px;
  text-align: left;
}

.rapor-man-section-meta {
  margin: 0;
  color: #333333;
  font-size: 10pt;
  text-align: left;
}

.rapor-man-paragraph {
  margin: 0;
  line-height: 1.5;
  text-align: justify;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.rapor-man-table-wrap {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.rapor-man-table {
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 9pt;
  line-height: 1.35;
}

.rapor-man-table col.col-no { width: 8%; }
.rapor-man-table col.col-mapel { width: 46%; }
.rapor-man-table col.col-nilai { width: 12%; }
.rapor-man-table col.col-predikat { width: 10%; }
.rapor-man-table col.col-third { width: 33.34%; }
.rapor-man-table col.col-kegiatan { width: 28%; }
.rapor-man-table col.col-predikat-sm { width: 14%; }
.rapor-man-table col.col-ket { width: 50%; }
.rapor-man-table col.col-legend { width: 20%; }

.rapor-man-table th,
.rapor-man-table td {
  border: 1px solid #000000;
  padding: 8px 10px;
  vertical-align: middle;
  text-align: center;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  white-space: normal;
}

.rapor-man-table thead {
  display: table-header-group;
}

.rapor-man-table tbody {
  display: table-row-group;
}

.rapor-man-table tr {
  page-break-inside: avoid;
  break-inside: avoid;
}

.rapor-man-table th {
  background-color: #f0f0f0;
  font-weight: 600;
  text-align: center;
  vertical-align: middle;
}

.rapor-man-table th.text-left {
  text-align: left;
}

.rapor-man-table td.text-center,
.rapor-man-table th.text-center {
  text-align: center;
  vertical-align: middle;
}

.rapor-man-table td.text-left {
  text-align: left;
  vertical-align: middle;
}

.rapor-man-table .section-row td {
  background-color: #f5f5f5;
  font-weight: 700;
  text-transform: uppercase;
  text-align: left;
  vertical-align: middle;
}

.rapor-man-table .italic-row td {
  font-style: italic;
  font-weight: 600;
  text-align: left;
  vertical-align: middle;
}

.rapor-man-table .total-row td {
  font-weight: 700;
  vertical-align: middle;
}

.rapor-man-table .total-row td.text-center {
  text-align: center;
}

.rapor-man-table .empty-row td {
  text-align: center;
  color: #666666;
  padding: 12px 5px;
  vertical-align: middle;
}

.rapor-man-signatures {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  margin-top: 24px;
  text-align: center;
  font-size: 10pt;
  line-height: 1.35;
  page-break-inside: avoid;
  break-inside: avoid;
}

.rapor-man-signatures p {
  margin: 0;
}

.rapor-man-signature-gap {
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

.rapor-man-muted {
  color: #555555;
}

.rapor-man-date {
  margin: 16px 0 8px;
  text-align: right;
  font-size: 9pt;
  color: #555555;
}

.rapor-man-footer {
  margin-top: 16px;
  padding-top: 6px;
  border-top: 1px solid #cccccc;
  font-size: 8pt;
  line-height: 1.3;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  page-break-inside: avoid;
  break-inside: avoid;
}

.rapor-man-footer-id {
  flex: 1;
  text-transform: uppercase;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.rapor-man-footer-page {
  flex-shrink: 0;
  white-space: nowrap;
}

.rapor-man-legend {
  margin-top: 12px;
  page-break-inside: avoid;
  break-inside: avoid;
}

.rapor-man-legend-title {
  font-size: 10pt;
  font-weight: 600;
  margin: 0 0 4px;
}

.rapor-man-legend-table {
  width: 100%;
  max-width: 360px;
  table-layout: fixed;
}

.rapor-a4,
.rapor-print-page {
  border: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
}

.rapor-pages > .rapor-print-page + .rapor-print-page {
  margin-top: 0;
}

.rapor-bulk-student {
  page-break-after: always;
  break-after: page;
}

.rapor-bulk-student:last-child {
  page-break-after: auto;
  break-after: auto;
}
`;

export const RAPOR_MAN_PRINT_MEDIA_CSS = `
@media print {
  @page {
    size: A4 portrait;
    margin: 0;
  }

  html, body {
    width: 210mm;
    margin: 0;
    padding: 0;
    background: #ffffff !important;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .rapor-print-root,
  .rapor-a4,
  .rapor-print-page,
  .rapor-man-page {
    width: 210mm !important;
    max-width: 210mm !important;
    box-shadow: none !important;
    border: none !important;
  }

  .rapor-print-page {
    page-break-after: always;
    break-after: page;
  }

  .rapor-print-page:last-child {
    page-break-after: auto;
    break-after: auto;
  }

  .rapor-man-table-wrap {
    width: 100% !important;
    max-width: 100% !important;
    overflow: visible !important;
  }

  .rapor-man-table {
    width: 100% !important;
    max-width: 100% !important;
    table-layout: fixed !important;
    page-break-inside: auto;
  }

  .rapor-man-table thead {
    display: table-header-group !important;
  }

  .rapor-man-table tr {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .rapor-man-table th,
  .rapor-man-table td {
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
  }

  .rapor-man-section,
  .rapor-man-signatures,
  .rapor-man-footer,
  .rapor-man-legend {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .rapor-content-scale-outer,
  .rapor-content-inner,
  .rapor-man-page,
  .rapor-man-page-body {
    text-align: left !important;
  }

  .rapor-man-header {
    text-align: center !important;
  }

  .rapor-man-biodata,
  .rapor-man-biodata > div,
  .rapor-man-biodata-row,
  .rapor-man-section,
  .rapor-man-section-title,
  .rapor-man-section-heading,
  .rapor-man-section-meta,
  .rapor-man-legend,
  .rapor-man-legend-title {
    text-align: left !important;
  }

  .rapor-man-paragraph {
    text-align: justify !important;
  }

  .rapor-man-date {
    text-align: right !important;
  }

  .rapor-man-signatures {
    text-align: center !important;
  }
}
`;

export const RAPOR_MAN_PRINT_DOCUMENT_CSS = `
@page {
  size: A4 portrait;
  margin: 0;
}

*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  background: #ffffff;
  color: #000000;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

body {
  display: block;
  margin: 0 auto;
}

#rapor-print-root {
  width: 210mm;
  max-width: 100%;
  margin: 0 auto;
}

${RAPOR_MAN_LAYOUT_CSS}

${RAPOR_PRINT_CONTENT_SCALE_CSS}

${RAPOR_PRINT_UNIT_CSS}

${RAPOR_MAN_PRINT_MEDIA_CSS}
`;

export const RAPOR_MAN_CAPTURE_CSS = RAPOR_MAN_LAYOUT_CSS;
