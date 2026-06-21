import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { formatNilaiRapor, predikatLabel } from "@/lib/e-rapor/predikat";
import type { ERaporExportOptions } from "@/lib/export/e-rapor-pdf";
import {
  applyRaporWatermark,
  drawKmBiodataGrid,
  drawKmSignatureBlock,
  loadSchoolLogoDataUrl,
} from "@/lib/export/rapor/pdf-shared";
import { RAPOR_PDF_TABLE_BASE } from "@/lib/export/rapor/pdf-table-styles";
import {
  sanitizeRaporFilename,
  type RaporPdfBuildResult,
} from "@/lib/export/rapor/pdf-types";
import { getKopInstansiText } from "@/lib/rapor/kop-instansi";
import type { ERaporPreviewData } from "@/lib/services/e-rapor";
import type { RaporMapel } from "@/lib/types/database";

/** Margin halaman PDF KM — selaras @page 5mm */
const KM_PAGE_MARGIN = 5;

function buildKmMapelPdfRows(data: ERaporPreviewData) {
  const { raporMapel, mapelList } = data;
  const tampilkanAngka = data.pengaturan?.rapor_tampilkan_angka ?? true;
  const tampilkanPredikat = data.pengaturan?.rapor_tampilkan_predikat ?? true;

  const raporByMapelId = new Map<number, RaporMapel>();
  for (const row of raporMapel) {
    raporByMapelId.set(row.id_mata_pelajaran, row);
  }

  const scorable = (mapelList ?? []).filter((m) => !m.is_group_header);
  const ordered: RaporMapel[] =
    scorable.length > 0
      ? scorable
          .map((m) => raporByMapelId.get(m.id))
          .filter((r): r is RaporMapel => r != null)
      : raporMapel;

  return ordered.map((row, i) => {
    const joined = row as RaporMapel & {
      mata_pelajaran?: { nama_mapel: string } | null;
    };
    const nilai = formatNilaiRapor(
      row.nilai_akhir,
      row.predikat_kualitatif,
      tampilkanAngka,
      tampilkanPredikat,
    );
    const pred =
      row.predikat_kualitatif && tampilkanPredikat
        ? predikatLabel(row.predikat_kualitatif)
        : "";
    return [
      String(i + 1),
      joined.mata_pelajaran?.nama_mapel ??
        scorable.find((m) => m.id === row.id_mata_pelajaran)?.nama_mapel ??
        "Mata Pelajaran",
      pred ? `${nilai}\n(${pred})` : nilai,
      row.deskripsi_capaian ?? "—",
    ];
  });
}

export async function buildKmDefaultPdf(
  data: ERaporPreviewData,
  options: ERaporExportOptions = {},
): Promise<RaporPdfBuildResult> {
  const {
    pengaturan,
    siswa,
    semester,
    tahunAjaran,
    kehadiran,
    ekstrakurikuler,
    eRapor,
  } = data;

  const useWatermark =
    options.watermarkLogo ?? pengaturan?.rapor_watermark_logo ?? false;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const M = KM_PAGE_MARGIN;
  let y = M;

  const logoDataUrl = await loadSchoolLogoDataUrl(pengaturan);
  if (logoDataUrl) doc.addImage(logoDataUrl, "PNG", pageWidth / 2 - 8, y, 16, 16);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(getKopInstansiText(pengaturan), pageWidth / 2, y + 18, {
    align: "center",
  });

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(
    (pengaturan?.nama_sekolah ?? "Nama Sekolah").toUpperCase(),
    pageWidth / 2,
    y + 24,
    { align: "center" },
  );

  if (pengaturan?.alamat_sekolah) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(pengaturan.alamat_sekolah, pageWidth / 2, y + 29, {
      align: "center",
      maxWidth: pageWidth - M * 2,
    });
  }

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("LAPORAN HASIL BELAJAR", pageWidth / 2, y + 35, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Kurikulum Merdeka · Semester ${semester} · TA ${tahunAjaran}`,
    pageWidth / 2,
    y + 40,
    { align: "center" },
  );

  y += 46;
  y = drawKmBiodataGrid(doc, data, y);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("A. Sikap dan Capaian Pembelajaran", M, y);
  y += 5;

  const mapelBody = buildKmMapelPdfRows(data);
  if (mapelBody.length === 0) {
    mapelBody.push([
      "—",
      "Belum ada data",
      "—",
      "Simpan rekap mapel terlebih dahulu",
    ]);
  }

  autoTable(doc, {
    startY: y,
    head: [["No", "Mata Pelajaran", "Nilai Akhir", "Capaian Kompetensi"]],
    body: mapelBody,
    tableWidth: pageWidth - M * 2,
    ...RAPOR_PDF_TABLE_BASE,
    columnStyles: {
      0: { cellWidth: 12, halign: "center", valign: "middle" },
      1: { cellWidth: 38, halign: "left", valign: "middle" },
      2: { cellWidth: 24, halign: "center", valign: "middle" },
      3: { cellWidth: "auto", halign: "left", valign: "top" },
    },
    margin: { left: M, right: M },
    rowPageBreak: "avoid",
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY + 6;

  if (kehadiran) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("B. Ketidakhadiran", M, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.text(
      `Sakit: ${kehadiran.sakit} hari · Izin: ${kehadiran.izin} hari · Tanpa keterangan: ${kehadiran.tanpa_keterangan} hari`,
      M,
      y,
    );
    y += 8;
  }

  if (ekstrakurikuler.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("C. Ekstrakurikuler", M, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["No", "Kegiatan", "Predikat", "Keterangan"]],
      body: ekstrakurikuler.map((ex, i) => [
        String(i + 1),
        ex.nama_ekskul,
        ex.predikat_kualitatif ?? ex.predikat ?? "—",
        ex.deskripsi_capaian ?? "—",
      ]),
      ...RAPOR_PDF_TABLE_BASE,
      margin: { left: M, right: M },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 6;
  }

  if (eRapor?.catatan_wali_kelas) {
    doc.setFont("helvetica", "bold");
    doc.text("Catatan Wali Kelas", M, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(
      eRapor.catatan_wali_kelas,
      pageWidth - M * 2,
    );
    doc.text(lines, M, y);
    y += lines.length * 4 + 4;
  }

  await drawKmSignatureBlock(doc, data, y + 8);

  applyRaporWatermark(doc, logoDataUrl, useWatermark);

  return {
    doc,
    filename: sanitizeRaporFilename(siswa.nama_siswa, semester, tahunAjaran),
  };
}
