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
import type {
  Absensi,
  Guru,
  PengaturanSekolah,
  Siswa,
  StatusAbsensi,
} from "@/lib/types/database";

export interface AbsensiRekapPdfInput {
  pengaturan: PengaturanSekolah | null;
  guru: Guru;
  kelasNama: string;
  bulan: string;
  siswa: Siswa[];
  absensi: Absensi[];
  tanggalList: string[];
}

const STATUS_LABEL: Record<StatusAbsensi, string> = {
  H: "H",
  I: "I",
  S: "S",
  A: "A",
};

function bulanLabel(ym: string) {
  const [y, m] = ym.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

function countStatus(
  absensiMap: Map<string, StatusAbsensi>,
  status: StatusAbsensi,
) {
  let n = 0;
  for (const s of absensiMap.values()) {
    if (s === status) n++;
  }
  return n;
}

export async function buildAbsensiRekapPdf(
  input: AbsensiRekapPdfInput,
): Promise<{ doc: jsPDF; filename: string }> {
  const { pengaturan, guru, kelasNama, bulan, siswa, absensi, tanggalList } =
    input;

  const landscape = tanggalList.length > 10;
  const doc = new jsPDF({
    orientation: landscape ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });

  const bySiswaDate = new Map<string, StatusAbsensi>();
  for (const a of absensi) {
    bySiswaDate.set(`${a.id_siswa}:${a.tanggal}`, a.status);
  }

  let y = await drawSchoolPdfHeader(doc, {
    pengaturan,
    title: "Rekap Absensi Siswa",
    subtitleLines: [
      `Kelas: ${kelasNama}  ·  Bulan: ${bulanLabel(bulan)}`,
      `Guru: ${guru.nama_guru}${guru.nip_guru ? ` (NIP ${guru.nip_guru})` : ""}`,
      "Keterangan: H = Hadir, I = Izin, S = Sakit, A = Alpa",
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
    const dayHeaders = tanggalList.map((t) => {
      const day = t.split("-")[2];
      return day.startsWith("0") ? day.slice(1) : day;
    });

    const head = [
      "No",
      "Nama",
      ...dayHeaders,
      "H",
      "I",
      "S",
      "A",
    ];

    const body = siswa.map((s, idx) => {
      const rowMap = new Map<string, StatusAbsensi>();
      for (const t of tanggalList) {
        const st = bySiswaDate.get(`${s.id}:${t}`);
        if (st) rowMap.set(t, st);
      }

      return [
        String(idx + 1),
        s.nama_siswa,
        ...tanggalList.map((t) => {
          const st = bySiswaDate.get(`${s.id}:${t}`);
          return st ? STATUS_LABEL[st] : "";
        }),
        String(countStatus(rowMap, "H")),
        String(countStatus(rowMap, "I")),
        String(countStatus(rowMap, "S")),
        String(countStatus(rowMap, "A")),
      ];
    });

    const fontSize = tanggalList.length > 20 ? 5 : tanggalList.length > 12 ? 6 : 7;
    const tableMargin = 8;
    const pageWidth = doc.internal.pageSize.getWidth();

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
      columnStyles: {
        0: { halign: "center", cellWidth: 8 },
        1: { halign: "left", cellWidth: landscape ? 40 : 35 },
      },
      margin: { left: tableMargin, right: tableMargin },
      rowPageBreak: "avoid",
    });

    y =
      (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY ?? y + 20;
  }

  await drawWaliKelasFooter(doc, pengaturan, y + 10, {
    namaFallback: guru.nama_guru,
    nipFallback: guru.nip_guru ?? undefined,
  });

  const filename = `Rekap_Absensi_${sanitizePdfFilename(kelasNama)}_${bulan.replace("-", "")}.pdf`;
  return { doc, filename };
}

export async function absensiRekapPdfBlob(
  input: AbsensiRekapPdfInput,
): Promise<PdfBlobResult> {
  const { doc, filename } = await buildAbsensiRekapPdf(input);
  return { blob: jsPdfToBlob(doc), filename };
}

export async function generateAbsensiRekapPdf(
  input: AbsensiRekapPdfInput,
): Promise<void> {
  const { blob, filename } = await absensiRekapPdfBlob(input);
  downloadPdfBlob(blob, filename);
}
