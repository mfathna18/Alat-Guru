import type { ERaporExportOptions } from "@/lib/export/e-rapor-pdf";
import { sanitizeRaporFilename } from "@/lib/export/rapor/pdf-types";
import { cloneRaporRoot } from "@/lib/export/rapor/rapor-print-document";
import { renderManRaporToDom } from "@/lib/export/rapor/render-man-rapor-dom";
import {
  inlineImagesInRoot,
  raporRootToWordBlob,
} from "@/lib/export/rapor/rapor-word-export";
import { prepareCloneForWord } from "@/lib/export/rapor/rapor-word-compat";
import type { ERaporPreviewData } from "@/lib/services/e-rapor";

export async function buildSemesterGanjilManWord(
  data: ERaporPreviewData,
  options: ERaporExportOptions = {},
): Promise<{ blob: Blob; filename: string }> {
  if (typeof window === "undefined") {
    throw new Error("Word rapor MAN hanya dapat dibuat di browser.");
  }

  const { root, cleanup } = await renderManRaporToDom(data, options);

  try {
    const clone = cloneRaporRoot(root, {
      stripInlineStyles: true,
      removeWatermark: false,
    });
    prepareCloneForWord(clone);
    await inlineImagesInRoot(clone);

    const filename = sanitizeRaporFilename(
      data.siswa.nama_siswa,
      data.semester,
      data.tahunAjaran,
      "Rapor",
      "doc",
    );
    const title = `Rapor ${data.siswa.nama_siswa}`;
    const blob = raporRootToWordBlob(clone, filename, title);
    return { blob, filename };
  } finally {
    cleanup();
  }
}
