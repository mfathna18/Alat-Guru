import type { JenisAsesmen } from "@/lib/types/database";

export const JENIS_ASESMEN_OPTIONS: {
  value: JenisAsesmen;
  label: string;
  description: string;
}[] = [
  {
    value: "FORMATIF",
    label: "Formatif",
    description: "Penilaian proses pembelajaran",
  },
  {
    value: "SUMATIF",
    label: "Sumatif",
    description: "Penilaian hasil — dasar analisis remedial/pengayaan",
  },
  {
    value: "REMEDIAL",
    label: "Remedial",
    description: "Lembar nilai ujian perbaikan",
  },
  {
    value: "PENGAYAAN",
    label: "Pengayaan",
    description: "Lembar nilai kegiatan pengayaan",
  },
];

export function jenisAsesmenShortLabel(jenis: JenisAsesmen) {
  return JENIS_ASESMEN_OPTIONS.find((o) => o.value === jenis)?.label ?? jenis;
}
