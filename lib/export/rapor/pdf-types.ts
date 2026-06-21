import type { ERaporPreviewData } from "@/lib/services/e-rapor";
import type { ERaporExportOptions } from "@/lib/export/e-rapor-pdf";

export interface RaporPdfBuildResult {
  filename: string;
  doc?: import("jspdf").jsPDF;
  blob?: Blob;
}

export type RaporPdfBuilder = (
  data: ERaporPreviewData,
  options: ERaporExportOptions,
) => Promise<RaporPdfBuildResult>;

export function sanitizeRaporFilename(
  siswaNama: string,
  semester: 1 | 2,
  tahunAjaran: string,
  suffix = "Rapor",
  ext = "pdf",
): string {
  const base = `${suffix}_${siswaNama}_S${semester}_${tahunAjaran}`
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_");
  return `${base}.${ext}`;
}
