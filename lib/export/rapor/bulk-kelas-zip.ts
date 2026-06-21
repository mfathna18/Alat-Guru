import JSZip from "jszip";

import { buildRaporPdfByTemplate } from "@/lib/export/rapor/pdf-registry";
import { jsPdfToBlob } from "@/lib/export/pdf-utils";
import type { ERaporExportOptions } from "@/lib/export/e-rapor-pdf";
import { fetchERaporPreview } from "@/lib/services/e-rapor";
import { sanitizeRaporFilename } from "@/lib/export/rapor/pdf-types";
import type { Siswa } from "@/lib/types/database";

export interface BulkKelasZipProgress {
  done: number;
  total: number;
  currentName?: string;
}

export async function buildKelasRaporZipBlob(
  siswaList: Siswa[],
  kelasId: number,
  semester: 1 | 2,
  tahunAjaran: string,
  options: ERaporExportOptions = {},
  onProgress?: (progress: BulkKelasZipProgress) => void,
): Promise<{ blob: Blob; filename: string }> {
  const zip = new JSZip();

  for (let i = 0; i < siswaList.length; i += 1) {
    const siswa = siswaList[i]!;
    onProgress?.({
      done: i,
      total: siswaList.length,
      currentName: siswa.nama_siswa,
    });

    const data = await fetchERaporPreview(
      siswa.id,
      kelasId,
      semester,
      tahunAjaran,
    );
    const result = await buildRaporPdfByTemplate(data, options);
    const pdfBlob =
      result.blob ?? (result.doc ? jsPdfToBlob(result.doc) : null);
    if (!pdfBlob) {
      throw new Error(`Gagal membuat PDF untuk ${siswa.nama_siswa}.`);
    }
    const buffer = await pdfBlob.arrayBuffer();
    zip.file(result.filename, buffer);
  }

  onProgress?.({
    done: siswaList.length,
    total: siswaList.length,
  });

  const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  const sampleName = siswaList[0]
    ? sanitizeRaporFilename(siswaList[0].nama_siswa, semester, tahunAjaran).replace(
        /\.pdf$/i,
        "",
      )
    : "rapor";
  const zipFilename = `Rapor-Kelas-S${semester}-${tahunAjaran.replace("/", "-")}-${sampleName}-dll.zip`;

  return { blob: zipBlob, filename: zipFilename };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
