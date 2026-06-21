import type { UserOptions } from "jspdf-autotable";

/** Gaya tabel selaras pratinjau/cetak E-Rapor (border hitam, header abu-abu). */
export const RAPOR_PDF_TABLE_BASE: Pick<
  UserOptions,
  "styles" | "headStyles"
> = {
  styles: {
    font: "times",
    fontSize: 8,
    cellPadding: 2.8,
    valign: "middle",
    overflow: "linebreak",
    lineColor: [0, 0, 0],
    lineWidth: 0.15,
    textColor: [0, 0, 0],
  },
  headStyles: {
    fillColor: [240, 240, 240],
    textColor: [0, 0, 0],
    fontStyle: "bold",
    halign: "center",
    valign: "middle",
  },
};
