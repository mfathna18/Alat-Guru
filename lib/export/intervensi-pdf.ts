import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import {
  downloadPdfBlob,
  jsPdfToBlob,
  type PdfBlobResult,
} from "@/lib/export/pdf-utils";
import { RAPOR_PDF_TABLE_BASE } from "@/lib/export/rapor/pdf-table-styles";
import type { IntervensiAnalysis } from "@/lib/nilai/ketuntasan";
import type { KkmConfig } from "@/lib/nilai/kkm-config";
import { getKopInstansiText } from "@/lib/rapor/kop-instansi";
import type { PengaturanSekolah } from "@/lib/types/database";

export interface IntervensiPdfInput {
  jenis: "remedial" | "pengayaan";
  analysis: IntervensiAnalysis;
  kkm: KkmConfig;
  kelasNama: string;
  semester: 1 | 2;
  pengaturan: Pick<
    PengaturanSekolah,
    "nama_sekolah" | "tahun_ajaran" | "logo_url" | "kop_instansi"
  > | null;
  guruNama?: string;
}

function sanitizeFilename(name: string) {
  return name.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
}

export async function buildIntervensiPdf(
  input: IntervensiPdfInput,
): Promise<{ doc: jsPDF; filename: string }> {
  const {
    jenis,
    analysis,
    kkm,
    kelasNama,
    semester,
    pengaturan,
    guruNama,
  } = input;

  const items =
    jenis === "remedial" ? analysis.remedial : analysis.pengayaan;
  const title =
    jenis === "remedial" ? "DAFTAR SISWA REMEDIAL" : "DAFTAR SISWA PENGAYAAN";

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 16;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(getKopInstansiText(pengaturan), pageWidth / 2, y, {
    align: "center",
  });

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(
    (pengaturan?.nama_sekolah ?? "Nama Sekolah").toUpperCase(),
    pageWidth / 2,
    y + 6,
    { align: "center" },
  );

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Tahun Ajaran ${pengaturan?.tahun_ajaran ?? "—/—"}`,
    pageWidth / 2,
    y + 11,
    { align: "center" },
  );

  y += 20;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageWidth / 2, y, { align: "center" });

  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Kelas ${kelasNama} · Semester ${semester} · KKM ${kkm.kkmAngka} · Ambang Pengayaan ${kkm.ambangPengayaanAngka}`,
    pageWidth / 2,
    y,
    { align: "center" },
  );
  if (guruNama) {
    y += 5;
    doc.text(`Guru: ${guruNama}`, pageWidth / 2, y, { align: "center" });
  }

  const tableBody =
    items.length === 0
      ? [["—", "Belum ada siswa", "—"]]
      : items.map((entry, i) => {
          const indikatorText =
            jenis === "remedial"
              ? entry.indikatorRemedial
                  .map((ind) => `${ind.kodeTp}/${ind.kodeIndikator} (${ind.display})`)
                  .join("; ")
              : `${entry.indikatorPengayaan.length} indikator di atas ambang`;

          return [
            String(i + 1),
            entry.siswa.nama_siswa,
            entry.siswa.nisn ?? "—",
            entry.rataRata != null ? String(Math.round(entry.rataRata)) : "—",
            indikatorText,
          ];
        });

  const tableMargin = 14;

  autoTable(doc, {
    startY: y + 8,
    head: [["No", "Nama Siswa", "NISN", "Rata-rata*", "Indikator"]],
    body: tableBody,
    tableWidth: pageWidth - tableMargin * 2,
    ...RAPOR_PDF_TABLE_BASE,
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { halign: "left", cellWidth: 45 },
      2: { halign: "center", cellWidth: 28 },
      3: { halign: "center", cellWidth: 18 },
      4: { halign: "left", cellWidth: "auto" },
    },
    margin: { left: tableMargin, right: tableMargin },
    rowPageBreak: "avoid",
  });

  const finalY =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? y + 40;

  doc.setFontSize(7);
  doc.text(
    "*Rata-rata dinormalisasi skala 0–100 untuk perbandingan lintas indikator.",
    14,
    finalY + 8,
  );

  if (jenis === "remedial") {
    doc.text(
      "Lembar nilai remedial dapat diisi di menu Penilaian → filter Remedial.",
      14,
      finalY + 13,
    );
  }

  const filename = `${sanitizeFilename(
    `${jenis}_${kelasNama}_S${semester}_${new Date().toISOString().slice(0, 10)}`,
  )}.pdf`;
  return { doc, filename };
}

export async function intervensiPdfBlob(
  input: IntervensiPdfInput,
): Promise<PdfBlobResult> {
  const { doc, filename } = await buildIntervensiPdf(input);
  return { blob: jsPdfToBlob(doc), filename };
}

export async function generateIntervensiPdf(
  input: IntervensiPdfInput,
): Promise<void> {
  const { blob, filename } = await intervensiPdfBlob(input);
  downloadPdfBlob(blob, filename);
}
