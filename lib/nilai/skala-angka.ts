export const SKOR_ANGKA_MIN = 1;
export const SKOR_ANGKA_MAX = 100;

/** Clamp nilai tersimpan ke rentang 1–100. */
export function clampSkorAngka(value: number): number {
  return Math.min(
    SKOR_ANGKA_MAX,
    Math.max(SKOR_ANGKA_MIN, Math.round(value)),
  );
}

/**
 * Filter input saat mengetik — hanya digit, maksimum 100.
 * Mengembalikan string kosong jika field dikosongkan.
 */
export function sanitizeSkorAngkaInput(raw: string): string {
  if (raw === "") return "";

  const digits = raw.replace(/\D/g, "");
  if (digits === "") return "";

  const n = Number(digits);
  if (n > SKOR_ANGKA_MAX) return String(SKOR_ANGKA_MAX);
  return digits;
}

/** Parse nilai untuk disimpan; null jika kosong atau di luar 1–100. */
export function parseSkorAngka(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const n = Number(trimmed);
  if (Number.isNaN(n) || n < SKOR_ANGKA_MIN || n > SKOR_ANGKA_MAX) {
    return null;
  }

  return clampSkorAngka(n);
}

export function skorAngkaRangeMessage(): string {
  return `Nilai angka harus antara ${SKOR_ANGKA_MIN}–${SKOR_ANGKA_MAX}.`;
}
