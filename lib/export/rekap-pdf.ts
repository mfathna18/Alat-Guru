import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { formatNilaiCell, jenisAsesmenLabel } from "@/lib/export/format-nilai";
import { drawWaliKelasFooter } from "@/lib/export/pdf-header";
import { RAPOR_PDF_TABLE_BASE } from "@/lib/export/rapor/pdf-table-styles";
import type { PenilaianWorkspace } from "@/lib/services/penilaian";
import { nilaiKey } from "@/lib/services/penilaian";
import type {
  Guru,
  JenisAsesmen,
  PengaturanSekolah,
} from "@/lib/types/database";
import {
  downloadPdfBlob,
  jsPdfToBlob,
  type PdfBlobResult,
} from "@/lib/export/pdf-utils";
import { getKopInstansiText } from "@/lib/rapor/kop-instansi";

export interface RekapPdfInput {
  pengaturan: PengaturanSekolah | null;
  guru: Guru;
  kelasNama: string;
  semester: 1 | 2;
  jenisAsesmen: JenisAsesmen;
  mapelNama: string;
  workspace: Omit<PenilaianWorkspace, "kelas">;
}

async function fetchImageBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function sanitizeFilename(name: string) {
  return name.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
}

export async function buildRekapPdf(
  input: RekapPdfInput,
): Promise<{ doc: jsPDF; filename: string }> {
  const { pengaturan, guru, kelasNama, semester, jenisAsesmen, mapelNama, workspace } =
    input;
  const { siswa, indikator, nilaiMap } = workspace;

  const landscape = indikator.length > 4;
  const doc = new jsPDF({
    orientation: landscape ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 14;

  if (pengaturan?.logo_url) {
    const logo = await fetchImageBase64(pengaturan.logo_url);
    if (logo) {
      doc.addImage(logo, "PNG", 14, y, 18, 18);
    }
  }

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(getKopInstansiText(pengaturan), pageWidth / 2, y + 4, {
    align: "center",
  });

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  const namaSekolah = pengaturan?.nama_sekolah ?? "Nama Sekolah";
  doc.text(namaSekolah.toUpperCase(), pageWidth / 2, y + 10, {
    align: "center",
  });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const ta = pengaturan?.tahun_ajaran ?? "—/—";
  doc.text(`Tahun Ajaran ${ta}`, pageWidth / 2, y + 15, { align: "center" });

  y += 26;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(
    `REKAP PENILAIAN ${jenisAsesmenLabel(jenisAsesmen).toUpperCase()}`,
    pageWidth / 2,
    y,
    { align: "center" },
  );
  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Kelas: ${kelasNama}  ·  Semester: ${semester}  ·  Mapel: ${mapelNama}`,
    pageWidth / 2,
    y,
    { align: "center" },
  );
  y += 5;
  doc.text(`Guru: ${guru.nama_guru}${guru.nip_guru ? ` (NIP ${guru.nip_guru})` : ""}`, pageWidth / 2, y, {
    align: "center",
  });
  y += 8;

  if (siswa.length === 0 || indikator.length === 0) {
    doc.setFontSize(10);
    doc.text(
      "Belum ada data siswa atau indikator untuk diekspor.",
      pageWidth / 2,
      y + 10,
      { align: "center" },
    );
  } else {
    const head = [
      "#",
      "Nama Siswa",
      "NISN",
      ...indikator.map((i) => i.kode_indikator),
    ];

    const body = siswa.map((s, idx) => [
      String(idx + 1),
      s.nama_siswa,
      s.nisn ?? "—",
      ...indikator.map((ind) =>
        formatNilaiCell(
          nilaiMap[nilaiKey(s.id, ind.id)],
          ind.skala_penilaian,
        ),
      ),
    ]);

    const tableMargin = 14;
    const fontSize = indikator.length > 8 ? 7 : 8;

    const columnStyles: Record<
      number,
      { halign?: "left" | "center"; cellWidth?: number }
    > = {
      0: { halign: "center", cellWidth: 10 },
      1: { halign: "left", cellWidth: landscape ? 48 : 42 },
      2: { halign: "center", cellWidth: 24 },
    };
    for (let i = 3; i < head.length; i += 1) {
      columnStyles[i] = { halign: "center" };
    }

    autoTable(doc, {
      startY: y,
      head: [head],
      body,
      tableWidth: pageWidth - tableMargin * 2,
      ...RAPOR_PDF_TABLE_BASE,
      styles: {
        ...RAPOR_PDF_TABLE_BASE.styles,
        fontSize,
      },
      columnStyles,
      margin: { left: tableMargin, right: tableMargin },
      rowPageBreak: "avoid",
    });

    y =
      (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY ?? y + 20;
  }

  const footerY = Math.min(
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? y,
    doc.internal.pageSize.getHeight() - 35,
  );

  await drawWaliKelasFooter(doc, pengaturan, footerY, {
    namaFallback: guru.nama_guru,
    nipFallback: guru.nip_guru ?? undefined,
  });

  const filename = `Rekap_${jenisAsesmen}_${sanitizeFilename(kelasNama)}_${sanitizeFilename(mapelNama)}_S${semester}.pdf`;
  return { doc, filename };
}

export async function rekapPdfBlob(input: RekapPdfInput): Promise<PdfBlobResult> {
  const { doc, filename } = await buildRekapPdf(input);
  return { blob: jsPdfToBlob(doc), filename };
}

export async function generateRekapPdf(input: RekapPdfInput): Promise<void> {
  const { blob, filename } = await rekapPdfBlob(input);
  downloadPdfBlob(blob, filename);
}
