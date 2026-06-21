import type { SkorHuruf } from "@/lib/types/database";

export const HURUF_OPTIONS: SkorHuruf[] = ["A", "B", "C", "D", "E"];

/** Nilai normalisasi 0–100 untuk perhitungan NA & intervensi */
export const HURUF_TO_NORMALIZED: Record<SkorHuruf, number> = {
  A: 95,
  B: 85,
  C: 75,
  D: 65,
  E: 45,
};

export const HURUF_LABELS: Record<SkorHuruf, string> = {
  A: "Sangat Baik (A)",
  B: "Baik (B)",
  C: "Cukup (C)",
  D: "Kurang (D)",
  E: "Sangat Kurang (E)",
};

export const HURUF_HINTS: Record<SkorHuruf, string> = {
  A: "86 – 100",
  B: "71 – 85",
  C: "61 – 70",
  D: "51 – 60",
  E: "1 – 50",
};

export function isSkorHuruf(value: string | null | undefined): value is SkorHuruf {
  return value != null && HURUF_OPTIONS.includes(value as SkorHuruf);
}
