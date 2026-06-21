import { downloadWordBlob } from "@/lib/export/rapor/rapor-word-export";
import { buildRaporWordByTemplate } from "@/lib/export/rapor/word-registry";
import type { ERaporExportOptions } from "@/lib/export/e-rapor-pdf";
import type { RaporTemplateId } from "@/lib/rapor/types";
import type { ERaporPreviewData } from "@/lib/services/e-rapor";

export type WordBlobResult = { blob: Blob; filename: string };

export async function eRaporWordBlob(
  data: ERaporPreviewData,
  options: ERaporExportOptions = {},
): Promise<WordBlobResult> {
  if (options.domRoot) {
    const { buildRaporWordFromDom } = await import(
      "@/lib/export/rapor/rapor-word-export"
    );
    const { sanitizeRaporFilename } = await import(
      "@/lib/export/rapor/pdf-types"
    );
    const filename = sanitizeRaporFilename(
      data.siswa.nama_siswa,
      data.semester,
      data.tahunAjaran,
      "Rapor",
      "doc",
    );
    return buildRaporWordFromDom(
      options.domRoot,
      filename,
      `Rapor ${data.siswa.nama_siswa}`,
    );
  }

  return buildRaporWordByTemplate(data, options);
}

export async function generateERaporWord(
  data: ERaporPreviewData,
  options?: ERaporExportOptions & { templateId?: RaporTemplateId },
): Promise<void> {
  const { blob, filename } = await eRaporWordBlob(data, options);
  downloadWordBlob(blob, filename);
}
