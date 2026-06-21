/**
 * Template rapor baru: Rapor Semester Ganjil (MAN IPS).
 *
 * Ini adalah TEMPLATE PRESENTASI (layout Word) — terpisah dari Kurikulum Merdeka.
 * Struktur Kelompok A/B/C/L didefinisikan di kode (`semester-ganjil-template.ts`),
 * bukan wajib lewat migration Supabase.
 *
 * Cara pakai: /e-rapor → pilih template "Rapor Semester Ganjil (MAN IPS)".
 *
 * Alur data:
 * - `fetchERaporPreview()` → nilai siswa, sekolah, kehadiran
 * - `buildSemesterGanjilViewModel()` → isi template + cocokkan nilai mapel
 * - `SemesterGanjilManTemplate` → render HTML/PDF
 */
export { SemesterGanjilManTemplate as RaporSemesterGanjil } from "@/components/rapor/templates/semester-ganjil-man/semester-ganjil-man-template";
export {
  SEMESTER_GANJIL_TEMPLATE_META,
  SEMESTER_GANJIL_MAPEL_STRUCTURE,
} from "@/lib/rapor/semester-ganjil-template";
export { buildSemesterGanjilViewModel } from "@/lib/rapor/build-view-model";
export type { SemesterGanjilViewModel, MapelNilaiDualRow } from "@/lib/rapor/build-view-model";
