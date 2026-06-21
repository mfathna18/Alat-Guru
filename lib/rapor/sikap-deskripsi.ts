import type { ERapor } from "@/lib/types/database";

/** Baca deskripsi sikap gabungan (mendukung data lama spiritual + sosial terpisah). */
export function readSikapDeskripsi(eRapor: ERapor | null | undefined): string {
  if (!eRapor) return "";
  const spiritual = eRapor.sikap_spiritual?.trim() ?? "";
  const sosial = eRapor.sikap_sosial?.trim() ?? "";
  if (spiritual && sosial) {
    return spiritual === sosial ? spiritual : `${spiritual}\n\n${sosial}`;
  }
  return spiritual || sosial;
}

export function hasSikapDeskripsi(eRapor: ERapor | null | undefined): boolean {
  return readSikapDeskripsi(eRapor).length > 0;
}

export const SIKAP_DESKRIPSI_PLACEHOLDER =
  "Deskripsi sikap spiritual dan sosial diisi oleh wali kelas.";
