import { siswaNisTrimmed } from "@/lib/siswa/siswa-nis";

export interface ImportSiswaRow {
  nama_siswa: string;
  nisn?: string | null;
  nis?: string | null;
}

export function normalizeImportRow(
  nisnRaw: string,
  nisRaw: string,
  namaRaw: string,
): ImportSiswaRow | null {
  const nama_siswa = namaRaw.trim();
  if (!nama_siswa) return null;

  const nisn = nisnRaw.trim() || null;
  const nis = siswaNisTrimmed(nisRaw.trim() || null);

  return { nama_siswa, nisn, nis };
}

export function isImportHeaderLine(cells: string[]): boolean {
  const lower = cells.map((c) => c.trim().toLowerCase());
  const joined = lower.join(" ");

  if (joined.includes("nisn") || joined.includes("nomor induk")) return true;
  if (joined.includes("nama lengkap") || joined.includes("nama siswa")) {
    return true;
  }
  if (lower.some((c) => c === "nis" || c === "nisn" || c.startsWith("nama"))) {
    return true;
  }

  return false;
}
