export type PredikatK13 = "A" | "B" | "C" | "D";

export interface PredikatK13Ranges {
  D: string;
  C: string;
  B: string;
  A: string;
}

/** Predikat K13 relatif KKM — pola dokumen MAN (contoh KKM 85 → C:85–89, B:90–94, A:95–100). */
export function predikatK13(nilai: number, kkm: number): PredikatK13 {
  if (nilai < kkm) return "D";
  if (nilai <= kkm + 4) return "C";
  if (nilai <= kkm + 9) return "B";
  return "A";
}

export function predikatK13Ranges(kkm: number): PredikatK13Ranges {
  const dMax = Math.max(0, kkm - 1);
  return {
    D: `0 ≤ x ≤ ${dMax}`,
    C: `${kkm} ≤ x ≤ ${kkm + 4}`,
    B: `${kkm + 5} ≤ x ≤ ${kkm + 9}`,
    A: `${kkm + 10} ≤ x ≤ 100`,
  };
}

export function predikatK13FromNullable(
  nilai: number | null | undefined,
  kkm: number,
): PredikatK13 | null {
  if (nilai == null || Number.isNaN(nilai)) return null;
  return predikatK13(Math.round(nilai), kkm);
}
