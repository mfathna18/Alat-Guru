import * as XLSX from "xlsx";

import {
  type ImportSiswaRow,
  isImportHeaderLine,
  normalizeImportRow,
} from "@/lib/siswa/import-row";

function cellText(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function detectColumns(row: (string | number)[]) {
  let nisnCol = -1;
  let nisCol = -1;
  let namaCol = -1;

  for (let c = 0; c < row.length; c++) {
    const cell = cellText(row[c]).toLowerCase();
    if (!cell) continue;

    if (cell.includes("nisn") || cell.includes("nomor induk")) {
      nisnCol = c;
      continue;
    }
    if (
      cell === "nis" ||
      (cell.includes("nis") && !cell.includes("nisn"))
    ) {
      nisCol = c;
      continue;
    }
    if (cell.includes("nama")) {
      namaCol = c;
    }
  }

  return { nisnCol, nisCol, namaCol };
}

/**
 * Parse file .xlsx / .xls — sheet pertama, kolom NISN · NIS · Nama Lengkap.
 */
export function parseSiswaXlsx(buffer: ArrayBuffer): ImportSiswaRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (matrix.length === 0) return [];

  let startRow = 0;
  let nisnCol = 0;
  let nisCol = 1;
  let namaCol = 2;
  let headerFound = false;

  for (let r = 0; r < Math.min(8, matrix.length); r++) {
    const row = matrix[r] ?? [];
    const cells = row.map((v) => cellText(v));
    if (cells.every((c) => !c)) continue;

    const detected = detectColumns(row);
    if (
      detected.nisnCol >= 0 ||
      detected.nisCol >= 0 ||
      detected.namaCol >= 0 ||
      isImportHeaderLine(cells)
    ) {
      headerFound = true;
      startRow = r + 1;
      nisnCol = detected.nisnCol >= 0 ? detected.nisnCol : 0;
      nisCol = detected.nisCol >= 0 ? detected.nisCol : 1;
      namaCol = detected.namaCol >= 0 ? detected.namaCol : 2;

      if (detected.namaCol < 0) {
        if (detected.nisnCol >= 0 && detected.nisCol >= 0) {
          namaCol = Math.max(detected.nisnCol, detected.nisCol) + 1;
        } else if (detected.nisnCol >= 0) {
          namaCol = detected.nisnCol === 0 ? 1 : 0;
          nisCol = -1;
        } else if (detected.nisCol >= 0) {
          namaCol = detected.nisCol === 0 ? 1 : 0;
        }
      } else if (detected.nisCol < 0 && detected.nisnCol >= 0) {
        nisCol = -1;
      }
      break;
    }
  }

  if (!headerFound) {
    nisnCol = 0;
    nisCol = 1;
    namaCol = 2;
    startRow = 0;
  }

  const rows: ImportSiswaRow[] = [];

  for (let r = startRow; r < matrix.length; r++) {
    const row = matrix[r] ?? [];
    const nisnRaw = cellText(row[nisnCol]);
    const nisRaw = nisCol >= 0 ? cellText(row[nisCol]) : "";
    const namaRaw = cellText(row[namaCol]);

    if (!nisnRaw && !nisRaw && !namaRaw) continue;

    const parsed = normalizeImportRow(nisnRaw, nisRaw, namaRaw);
    if (parsed) rows.push(parsed);
  }

  return rows;
}
