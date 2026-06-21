import type { ERaporExportOptions } from "@/lib/export/e-rapor-pdf";
import type { RaporPdfBuildResult } from "@/lib/export/rapor/pdf-types";
import type { ERaporPreviewData } from "@/lib/services/e-rapor";

/**
 * PDF MAN IPS — di browser dihasilkan dari capture HTML (WYSIWYG).
 * Tidak memakai jsPDF programmatic agar identik dengan pratinjau.
 */
export async function buildSemesterGanjilManPdf(
  data: ERaporPreviewData,
  options: ERaporExportOptions = {},
): Promise<RaporPdfBuildResult> {
  if (typeof window === "undefined") {
    throw new Error("PDF rapor MAN hanya dapat dibuat di browser.");
  }

  const { buildManPdfBlobFromHtml } = await import(
    "@/lib/export/rapor/semester-ganjil-man-html-pdf"
  );
  const { blob, filename } = await buildManPdfBlobFromHtml(data, options);
  return { blob, filename };
}
