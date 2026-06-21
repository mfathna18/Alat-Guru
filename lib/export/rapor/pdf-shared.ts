import type { jsPDF } from "jspdf";

import { formatTanggalRapor, jkLabel } from "@/lib/rapor/format-utils";
import { DEFAULT_RAPOR_SLOGAN } from "@/lib/rapor/default-man-mapel";
import { kelasSemesterLabel, semesterLabel } from "@/lib/rapor/semester-labels";
import {
  addLogoWatermarkToPdf,
  fetchImageBase64,
} from "@/lib/export/pdf-watermark";
import type { ERaporPreviewData } from "@/lib/services/e-rapor";
import type { PengaturanSekolah } from "@/lib/types/database";
import { siswaHasNis, siswaNisTrimmed } from "@/lib/siswa/siswa-nis";

/** Padding halaman rapor MAN (mm) — selaras pratinjau & cetak. */
export const RAPOR_MAN_PAGE_PADDING_X = 14;
export const RAPOR_MAN_PAGE_PADDING_Y = 12;
export const MARGIN = RAPOR_MAN_PAGE_PADDING_X;

export async function loadSchoolLogoDataUrl(
  pengaturan: PengaturanSekolah | null,
): Promise<string | null> {
  if (!pengaturan?.logo_url) return null;
  return fetchImageBase64(pengaturan.logo_url);
}

async function loadSignatureDataUrl(url: string | null | undefined) {
  if (!url) return null;
  return fetchImageBase64(url);
}

function drawPdfSignatureImage(
  doc: jsPDF,
  dataUrl: string,
  centerX: number,
  topY: number,
  maxWidth: number,
  maxHeight: number,
): void {
  const props = doc.getImageProperties(dataUrl);
  const ratio = props.width / props.height;
  let width = maxWidth;
  let height = width / ratio;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }
  doc.addImage(dataUrl, "PNG", centerX - width / 2, topY, width, height);
}

export function applyRaporWatermark(
  doc: jsPDF,
  logoDataUrl: string | null,
  enabled: boolean,
): void {
  if (enabled && logoDataUrl) {
    addLogoWatermarkToPdf(doc, logoDataUrl);
  }
}

export function getRaporSloganText(
  pengaturan: PengaturanSekolah | null,
): string {
  return pengaturan?.rapor_slogan?.trim() || DEFAULT_RAPOR_SLOGAN;
}

/** Kop sekolah — jenjang + nama sekolah, logo sekolah opsional (tanpa Kemenag). */
export function drawManPdfHeader(
  doc: jsPDF,
  pengaturan: PengaturanSekolah | null,
  logoDataUrl: string | null,
  startY = MARGIN,
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = startY;

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", pageWidth / 2 - 8, y, 16, 16);
    y += 18;
  }

  const jenjang = (
    pengaturan?.jenjang ?? "Jenjang Sekolah"
  ).toUpperCase();
  const namaSekolah = (
    pengaturan?.nama_sekolah ?? "Nama Sekolah"
  ).toUpperCase();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(jenjang, pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.text(namaSekolah, pageWidth / 2, y, { align: "center" });
  y += 4;

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y + 2, pageWidth - MARGIN, y + 2);

  return y + 8;
}

export function drawManPdfBiodata(
  doc: jsPDF,
  data: ERaporPreviewData,
  startY: number,
): number {
  const { siswa, kelas, semester, tahunAjaran, pengaturan } = data;
  const pageWidth = doc.internal.pageSize.getWidth();
  const colMid = pageWidth / 2;
  const lineH = 4.2;

  const left = [
    `Nama : ${siswa.nama_siswa}`,
    ...(siswaHasNis(siswa.nis)
      ? [`NIS : ${siswaNisTrimmed(siswa.nis)}`]
      : []),
    `NISN : ${siswa.nisn ?? "—"}`,
  ];
  const right = [
    `Sekolah : ${pengaturan?.nama_sekolah ?? "—"}`,
    `Kelas/Semester : ${kelasSemesterLabel(kelas.nama_kelas, semester)}`,
    `Tahun Pembelajaran : ${tahunAjaran}`,
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  let y = startY;
  const rows = Math.max(left.length, right.length);
  for (let i = 0; i < rows; i += 1) {
    if (left[i]) doc.text(left[i], MARGIN, y);
    if (right[i]) doc.text(right[i], colMid, y);
    y += lineH;
  }
  return y + 4;
}

/** Biodata lengkap untuk halaman 1 KM-style. */
export function drawKmBiodataGrid(
  doc: jsPDF,
  data: ERaporPreviewData,
  startY: number,
): number {
  const { siswa, kelas } = data;
  const rows = [
    ["Nama", siswa.nama_siswa],
    ["NISN", siswa.nisn ?? "—"],
    ...(siswaHasNis(siswa.nis)
      ? [["NIS", siswaNisTrimmed(siswa.nis)!] as const]
      : []),
    ["Kelas", kelas.nama_kelas],
    ["Jenis Kelamin", jkLabel(siswa.jenis_kelamin)],
    [
      "Tempat, Tgl Lahir",
      `${siswa.tempat_lahir ?? "—"}${siswa.tanggal_lahir ? `, ${formatTanggalRapor(siswa.tanggal_lahir)}` : ""}`,
    ],
    ["Alamat", siswa.alamat ?? "—"],
    [
      "Orang Tua",
      `Ayah ${siswa.nama_ayah ?? "—"} / Ibu ${siswa.nama_ibu ?? "—"}`,
    ],
  ];

  doc.setFontSize(8);
  let y = startY;
  for (const [label, value] of rows) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`${label}`, MARGIN, y);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(`: ${value}`, MARGIN + 32, y);
    y += 4.5;
  }
  return y + 2;
}

export async function drawKmSignatureBlock(
  doc: jsPDF,
  data: ERaporPreviewData,
  startY: number,
): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const { pengaturan, eRapor } = data;
  const kota = pengaturan?.kabupaten_kota ?? "…………………";
  const tgl = formatTanggalRapor(
    eRapor?.tanggal_terbit ?? new Date().toISOString(),
  );

  const [ttdWali, ttdKepsek] = await Promise.all([
    loadSignatureDataUrl(pengaturan?.ttd_wali_kelas_url),
    loadSignatureDataUrl(pengaturan?.ttd_kepsek_url),
  ]);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`${kota}, ${tgl}`, pageWidth - MARGIN, startY, { align: "right" });

  const colW = (pageWidth - MARGIN * 2) / 3;
  const labels = ["Orang Tua/Wali", "Wali Kelas", "Kepala Sekolah"];
  const names = [
    "(……………………………)",
    pengaturan?.nama_wali_kelas ?? "(……………………………)",
    pengaturan?.nama_kepsek ?? "(……………………………)",
  ];
  const nips = [
    "",
    pengaturan?.nip_wali_kelas ? `NIP. ${pengaturan.nip_wali_kelas}` : "",
    pengaturan?.nip_kepsek ? `NIP. ${pengaturan.nip_kepsek}` : "",
  ];
  const signatures = [null, ttdWali, ttdKepsek] as const;

  const roleY = startY + 8;
  const signatureTopY = roleY + 3;
  const nameY = roleY + 22;
  for (let i = 0; i < 3; i += 1) {
    const x = MARGIN + colW * i + colW / 2;
    doc.text(labels[i]!, x, roleY, { align: "center" });
    const signature = signatures[i];
    if (signature) {
      drawPdfSignatureImage(
        doc,
        signature,
        x,
        signatureTopY,
        colW * 0.75,
        14,
      );
    }
    doc.setFont("helvetica", "bold");
    doc.text(names[i]!, x, nameY, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    if (nips[i]) doc.text(nips[i]!, x, nameY + 4, { align: "center" });
    doc.setFontSize(8);
  }

  return nameY + 8;
}

export { semesterLabel };
