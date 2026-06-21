import {
  downloadPdfBlob,
  jsPdfToBlob,
  type PdfBlobResult,
} from "@/lib/export/pdf-utils";
import { buildRaporPdfByTemplate } from "@/lib/export/rapor/pdf-registry";
import { sanitizeRaporFilename } from "@/lib/export/rapor/pdf-types";
import type { RaporTemplateId } from "@/lib/rapor/types";
import type { ERaporPreviewData } from "@/lib/services/e-rapor";

export interface ERaporExportOptions {
  /** Logo sekolah sebagai watermark transparan di latar halaman */
  watermarkLogo?: boolean;
  templateId?: RaporTemplateId;
  /**
   * Skala isi konten (0.5–1.5). 1 = 100%.
   * Dipakai saat Preview/Unduh PDF dari dialog pratinjau.
   */
  contentScale?: number;
  domRoot?: HTMLElement;
}

export async function buildERaporPdf(
  data: ERaporPreviewData,
  options: ERaporExportOptions = {},
) {
  return buildRaporPdfByTemplate(data, options);
}

export async function eRaporPdfBlob(
  data: ERaporPreviewData,
  options: ERaporExportOptions = {},
): Promise<PdfBlobResult> {
  if (options.domRoot) {
    const { captureRaporDomToPdf } = await import(
      "@/lib/export/rapor/html-capture-pdf"
    );
    const filename = sanitizeRaporFilename(
      data.siswa.nama_siswa,
      data.semester,
      data.tahunAjaran,
    );
    return captureRaporDomToPdf(options.domRoot, filename, {
      contentScale: options.contentScale,
    });
  }

  const result = await buildRaporPdfByTemplate(data, options);
  if (result.blob) {
    return { blob: result.blob, filename: result.filename };
  }
  if (!result.doc) {
    throw new Error("Gagal membuat PDF rapor.");
  }
  return { blob: jsPdfToBlob(result.doc), filename: result.filename };
}

export async function generateERaporPdf(
  data: ERaporPreviewData,
  options?: ERaporExportOptions,
): Promise<void> {
  const { blob, filename } = await eRaporPdfBlob(data, options);
  downloadPdfBlob(blob, filename);
}
