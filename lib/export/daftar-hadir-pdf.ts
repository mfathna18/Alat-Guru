import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import {
  drawSchoolPdfHeader,
  drawWaliKelasFooter,
  sanitizePdfFilename,
} from "@/lib/export/pdf-header";
import { RAPOR_PDF_TABLE_BASE } from "@/lib/export/rapor/pdf-table-styles";
import {
  downloadPdfBlob,
  jsPdfToBlob,
  type PdfBlobResult,
} from "@/lib/export/pdf-utils";
import type { Guru, PengaturanSekolah, Siswa } from "@/lib/types/database";

export interface DaftarHadirPdfInput {
  pengaturan: PengaturanSekolah | null;
  guru: Guru;
  kelasNama: string;
  tanggal: string;
  mataPelajaran?: string;
  siswa: Siswa[];
}

function formatTanggalId(iso: string) {
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export async function buildDaftarHadirPdf(
  input: DaftarHadirPdfInput,
): Promise<{ doc: jsPDF; filename: string }> {
  const { pengaturan, guru, kelasNama, tanggal, siswa } = input;
  const mapel = input.mataPelajaran ?? guru.mata_pelajaran;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  let y = await drawSchoolPdfHeader(doc, {
    pengaturan,
    title: "Daftar Hadir Siswa",
    subtitleLines: [
      `Kelas: ${kelasNama}  ·  Mapel: ${mapel}`,
      `Hari/Tanggal: ${formatTanggalId(tanggal)}`,
      `Guru: ${guru.nama_guru}${guru.nip_guru ? ` (NIP ${guru.nip_guru})` : ""}`,
    ],
  });

  if (siswa.length === 0) {
    doc.setFontSize(10);
    doc.text(
      "Belum ada siswa aktif di kelas ini.",
      doc.internal.pageSize.getWidth() / 2,
      y + 10,
      { align: "center" },
    );
  } else {
    const tableMargin = 14;
    const pageWidth = doc.internal.pageSize.getWidth();

    autoTable(doc, {
      startY: y,
      head: [["No", "NISN", "Nama Siswa", "Hadir", "Tanda Tangan"]],
      body: siswa.map((s, idx) => [
        String(idx + 1),
        s.nisn ?? "—",
        s.nama_siswa,
        "",
        "",
      ]),
      tableWidth: pageWidth - tableMargin * 2,
      ...RAPOR_PDF_TABLE_BASE,
      styles: {
        ...RAPOR_PDF_TABLE_BASE.styles,
        fontSize: 9,
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 10 },
        1: { halign: "center", cellWidth: 28 },
        2: { halign: "left" },
        3: { halign: "center", cellWidth: 18 },
        4: { cellWidth: 40 },
      },
      margin: { left: tableMargin, right: tableMargin },
      rowPageBreak: "avoid",
    });

    y =
      (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY ?? y + 20;
  }

  await drawWaliKelasFooter(doc, pengaturan, y + 10, {
    tanggal: formatTanggalId(tanggal),
    namaFallback: guru.nama_guru,
    nipFallback: guru.nip_guru ?? undefined,
  });

  const tgl = tanggal.replace(/-/g, "");
  const filename = `Daftar_Hadir_${sanitizePdfFilename(kelasNama)}_${tgl}.pdf`;
  return { doc, filename };
}

export async function daftarHadirPdfBlob(
  input: DaftarHadirPdfInput,
): Promise<PdfBlobResult> {
  const { doc, filename } = await buildDaftarHadirPdf(input);
  return { blob: jsPdfToBlob(doc), filename };
}

export async function generateDaftarHadirPdf(
  input: DaftarHadirPdfInput,
): Promise<void> {
  const { blob, filename } = await daftarHadirPdfBlob(input);
  downloadPdfBlob(blob, filename);
}
