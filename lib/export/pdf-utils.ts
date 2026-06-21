import type { jsPDF } from "jspdf";

export function jsPdfToBlob(doc: jsPDF): Blob {
  return doc.output("blob");
}

export function downloadPdfBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function printPdfBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const win = window.open(url);
  if (win) {
    win.addEventListener("load", () => win.print());
  } else {
    URL.revokeObjectURL(url);
    throw new Error("Popup diblokir. Izinkan popup untuk mencetak.");
  }
}

export type PdfBlobResult = { blob: Blob; filename: string };
