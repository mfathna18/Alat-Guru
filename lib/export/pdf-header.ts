import type { jsPDF } from "jspdf";

import { formatTanggalRapor } from "@/lib/rapor/format-utils";
import type { PengaturanSekolah } from "@/lib/types/database";
import { getKopInstansiText } from "@/lib/rapor/kop-instansi";

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

function drawPdfSignatureImage(
  doc: jsPDF,
  dataUrl: string,
  centerX: number,
  topY: number,
  maxWidth: number,
  maxHeight: number,
): number {
  const props = doc.getImageProperties(dataUrl);
  const ratio = props.width / props.height;
  let width = maxWidth;
  let height = width / ratio;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }
  doc.addImage(dataUrl, "PNG", centerX - width / 2, topY, width, height);
  return topY + height;
}

export function sanitizePdfFilename(name: string) {
  return name.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
}

export interface PdfHeaderOptions {
  pengaturan: PengaturanSekolah | null;
  title: string;
  subtitleLines?: string[];
}

/** Menggambar kop sekolah standar; mengembalikan posisi Y untuk konten berikutnya. */
export async function drawSchoolPdfHeader(
  doc: jsPDF,
  options: PdfHeaderOptions,
): Promise<number> {
  const { pengaturan, title, subtitleLines = [] } = options;
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
  doc.text(title.toUpperCase(), pageWidth / 2, y, { align: "center" });
  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  for (const line of subtitleLines) {
    doc.text(line, pageWidth / 2, y, { align: "center" });
    y += 5;
  }

  return y + 4;
}

export interface WaliKelasFooterOptions {
  /** Tanggal sudah diformat (id-ID), atau ISO — diformat otomatis. */
  tanggal?: string;
  /** Fallback jika nama_wali_kelas kosong di pengaturan. */
  namaFallback?: string;
  nipFallback?: string;
}

/** Blok tanda tangan wali kelas — selaras posisi kolom kanan rapor (bukan kepala sekolah). */
export async function drawWaliKelasFooter(
  doc: jsPDF,
  pengaturan: PengaturanSekolah | null,
  startY: number,
  options: WaliKelasFooterOptions = {},
): Promise<void> {
  const nama =
    pengaturan?.nama_wali_kelas?.trim() || options.namaFallback?.trim();
  if (!nama) return;

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const colW = (pageWidth - margin * 2) / 3;
  const centerX = pageWidth - margin - colW / 2;

  const footerY = Math.min(
    startY + 8,
    doc.internal.pageSize.getHeight() - 42,
  );

  const kota = pengaturan?.kabupaten_kota?.trim();
  const tanggalText = options.tanggal
    ? options.tanggal.includes("T") || /^\d{4}-\d{2}-\d{2}$/.test(options.tanggal)
      ? formatTanggalRapor(options.tanggal)
      : options.tanggal
    : formatTanggalRapor(new Date().toISOString());

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  if (kota) {
    doc.text(`${kota}, ${tanggalText}`, centerX, footerY, { align: "center" });
  } else {
    doc.text(tanggalText, centerX, footerY, { align: "center" });
  }

  const roleY = footerY + 8;
  doc.text("Wali Kelas", centerX, roleY, { align: "center" });

  const ttd = pengaturan?.ttd_wali_kelas_url
    ? await fetchImageBase64(pengaturan.ttd_wali_kelas_url)
    : null;

  let nameY = roleY + 20;
  if (ttd) {
    const bottomY = drawPdfSignatureImage(
      doc,
      ttd,
      centerX,
      roleY + 3,
      colW * 0.72,
      16,
    );
    nameY = bottomY + 4;
  }

  const nip =
    pengaturan?.nip_wali_kelas?.trim() || options.nipFallback?.trim();

  doc.setFont("helvetica", "bold");
  doc.text(nama, centerX, nameY, { align: "center" });
  doc.setFont("helvetica", "normal");
  if (nip) {
    doc.text(`NIP. ${nip}`, centerX, nameY + 5, { align: "center" });
  }
}

export async function drawKepsekFooter(
  doc: jsPDF,
  pengaturan: PengaturanSekolah | null,
  startY: number,
) {
  if (!pengaturan?.nama_kepsek) return;

  const pageWidth = doc.internal.pageSize.getWidth();
  const footerY = Math.min(
    startY,
    doc.internal.pageSize.getHeight() - 35,
  );

  const ttdKepsek = pengaturan.ttd_kepsek_url
    ? await fetchImageBase64(pengaturan.ttd_kepsek_url)
    : null;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Mengetahui,", pageWidth - 20, footerY + 10, { align: "right" });

  let nameY = footerY + 22;
  if (ttdKepsek) {
    const maxW = 40;
    const maxH = 14;
    const props = doc.getImageProperties(ttdKepsek);
    const ratio = props.width / props.height;
    let width = maxW;
    let height = width / ratio;
    if (height > maxH) {
      height = maxH;
      width = height * ratio;
    }
    const x = pageWidth - 20 - width / 2;
    doc.addImage(ttdKepsek, "PNG", x, footerY + 11, width, height);
    nameY = footerY + 11 + height + 4;
  }

  doc.setFont("helvetica", "bold");
  doc.text(pengaturan.nama_kepsek, pageWidth - 20, nameY, {
    align: "right",
  });
  doc.setFont("helvetica", "normal");
  doc.text(`NIP. ${pengaturan.nip_kepsek}`, pageWidth - 20, nameY + 5, {
    align: "right",
  });
  doc.text("Kepala Sekolah", pageWidth - 20, nameY + 10, {
    align: "right",
  });
}
