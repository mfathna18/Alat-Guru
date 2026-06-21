import * as XLSX from "xlsx";

const TEMPLATE_ROWS = [
  ["NISN", "NIS", "Nama Lengkap"],
  ["0123456789", "12345", "Budi Santoso"],
  ["0123456790", "", "Siti Aminah"],
  ["", "12346", "Andi Wijaya"],
  ["0123456791", "12347", "Citra Dewi"],
];

/** Unduh template Excel contoh impor siswa. */
export function downloadSiswaImportTemplate() {
  const sheet = XLSX.utils.aoa_to_sheet(TEMPLATE_ROWS);
  sheet["!cols"] = [{ wch: 14 }, { wch: 10 }, { wch: 28 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Impor Siswa");
  XLSX.writeFile(workbook, "template-impor-siswa.xlsx");
}
