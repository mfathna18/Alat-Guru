import type { Nilai, SkalaPenilaian } from "@/lib/types/database";

export function formatNilaiCell(
  nilai: Nilai | undefined,
  skala: SkalaPenilaian,
): string {
  if (!nilai) return "—";
  if (skala === "HURUF") return nilai.skor_kualitatif ?? "—";
  if (nilai.skor_angka != null) return String(nilai.skor_angka);
  return "—";
}

export function jenisAsesmenLabel(jenis: string) {
  switch (jenis) {
    case "SUMATIF":
      return "Sumatif";
    case "REMEDIAL":
      return "Remedial";
    case "PENGAYAAN":
      return "Pengayaan";
    default:
      return "Formatif";
  }
}
