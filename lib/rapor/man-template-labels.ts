import type { MapelKelompok } from "@/lib/types/database";

/** Label baris kelompok mapel — sesuai dokumen MAN Semester Ganjil. */
export const KELOMPOK_SECTION_LABELS: Record<MapelKelompok, string> = {
  A: "Kelompok A (Umum)",
  B: "Kelompok B (Umum)",
  C: "Kelompok C (Peminatan)",
  L: "Lintas Minat/Pendalaman Minat",
};

export function parseMapelKelompok(value: string | null | undefined): MapelKelompok {
  if (value === "B" || value === "C" || value === "L") return value;
  return "A";
}
