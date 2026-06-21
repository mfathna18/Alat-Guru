import { createClient } from "@/lib/supabase/client";
import { clampSkorAngka } from "@/lib/nilai/skala-angka";
import type { Nilai, NilaiUpsertInput } from "@/lib/types/database";

export {
  softDeleteSiswa,
  restoreSiswa,
} from "@/lib/services/siswa";

/** Normalisasi baris nilai agar cocok dengan unique_nilai_row di database. */
export function normalizeNilaiUpsert(entry: NilaiUpsertInput): NilaiUpsertInput {
  const normalized =
    entry.jenis_asesmen === "SUMATIF"
      ? {
          ...entry,
          tipe_sumatif: entry.tipe_sumatif ?? "SAS",
          id_lingkup_materi: null,
        }
      : {
          ...entry,
          tipe_sumatif: null,
          id_lingkup_materi: null,
        };

  if (normalized.skor_angka != null) {
    normalized.skor_angka = clampSkorAngka(normalized.skor_angka);
  }

  return normalized;
}

/**
 * Zero Redundancy UPSERT — satu baris nilai per
 * (siswa × indikator × jenis × tipe sumatif × lingkup materi).
 */
export async function upsertNilaiBatch(entries: NilaiUpsertInput[]) {
  if (entries.length === 0) return [];

  const rows = entries.map(normalizeNilaiUpsert);
  const supabase = createClient();
  const { data, error } = await supabase
    .from("nilai")
    .upsert(rows, {
      onConflict: "id_siswa,id_indikator,jenis_asesmen,tipe_sumatif,id_lingkup_materi",
    })
    .select();

  if (error) throw error;
  return data as Nilai[];
}
