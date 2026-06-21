import {
  type ImportSiswaRow,
  isImportHeaderLine,
  normalizeImportRow,
} from "@/lib/siswa/import-row";

export type { ImportSiswaRow } from "@/lib/siswa/import-row";

/**
 * Parse teks hasil salin dari Excel/Spreadsheet.
 * Format: NISN · NIS · Nama Lengkap (tab/koma/titik koma).
 * NISN dan NIS opsional; Nama Lengkap wajib.
 */
export function parseSiswaImportText(raw: string): ImportSiswaRow[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const rows: ImportSiswaRow[] = [];

  for (const line of lines) {
    const parts = line.includes("\t")
      ? line.split("\t")
      : line.includes(";")
        ? line.split(";")
        : line.includes(",")
          ? line.split(",")
          : [line];

    const cells = parts.map((c) => c.trim());

    if (isImportHeaderLine(cells)) continue;

    const nonEmpty = cells.filter(Boolean);
    if (nonEmpty.length === 0) continue;

    let parsed: ImportSiswaRow | null = null;

    if (cells.length >= 3) {
      parsed = normalizeImportRow(cells[0] ?? "", cells[1] ?? "", cells[2] ?? "");
    } else if (cells.length === 2) {
      parsed = normalizeImportRow(cells[0] ?? "", "", cells[1] ?? "");
    } else {
      parsed = normalizeImportRow("", "", cells[0] ?? "");
    }

    if (parsed) rows.push(parsed);
  }

  return rows;
}
