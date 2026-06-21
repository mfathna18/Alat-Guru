"use client";

import type { ERaporExportOptions } from "@/lib/export/e-rapor-pdf";
import { captureRaporDomToPdf } from "@/lib/export/rapor/html-capture-pdf";
import { sanitizeRaporFilename } from "@/lib/export/rapor/pdf-types";
import { renderManRaporToDom } from "@/lib/export/rapor/render-man-rapor-dom";
import type { ERaporPreviewData } from "@/lib/services/e-rapor";

/** Render rapor di viewport (opacity 0) lalu capture via iframe terisolasi. */
export async function buildManPdfBlobFromHtml(
  data: ERaporPreviewData,
  options: ERaporExportOptions = {},
): Promise<{ blob: Blob; filename: string }> {
  const filename = sanitizeRaporFilename(
    data.siswa.nama_siswa,
    data.semester,
    data.tahunAjaran,
  );

  const { root, cleanup } = await renderManRaporToDom(data, options);

  try {
    return await captureRaporDomToPdf(root, filename);
  } finally {
    cleanup();
  }
}
