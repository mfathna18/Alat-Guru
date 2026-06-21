/**
 * Definisi struktur template Rapor Semester Ganjil (MAN IPS).
 * Layout Kelompok A/B/C/L ada di sini — bukan di migration DB.
 * Migration mapel (012/014) opsional, hanya untuk sinkron penilaian di database.
 */
import {
  MAN_SMA_IPS_MAPEL_SEED,
  type ManMapelSeedItem,
} from "@/lib/rapor/default-man-mapel";
import type { MataPelajaran } from "@/lib/types/database";

export const SEMESTER_GANJIL_TEMPLATE_META = {
  id: "semester-ganjil-man" as const,
  label: "Rapor Semester",
  description:
    "Rapor semester dengan nilai pengetahuan, keterampilan, sikap, dan kehadiran",
};

/** Daftar baris mapel bawaan template (sumber kebenaran layout). */
export const SEMESTER_GANJIL_MAPEL_STRUCTURE: ManMapelSeedItem[] =
  MAN_SMA_IPS_MAPEL_SEED;

export function normalizeMapelName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Apakah database sudah punya struktur MAN (grup/sub-mapel)? */
export function mapelListHasManStructure(mapelList: MataPelajaran[]): boolean {
  return mapelList.some(
    (m) =>
      m.is_group_header === true ||
      m.parent_id != null ||
      (m.kelompok_mapel != null && m.kelompok_mapel !== "A"),
  );
}

/** Kerangka mapel virtual dari definisi template — dipakai jika DB belum disinkronkan. */
export function buildTemplateMapelSkeleton(): MataPelajaran[] {
  const keyToId = new Map<string, number>();
  SEMESTER_GANJIL_MAPEL_STRUCTURE.forEach((item, i) => {
    keyToId.set(item.key, -(i + 1));
  });

  return SEMESTER_GANJIL_MAPEL_STRUCTURE.map((item) => ({
    id: keyToId.get(item.key)!,
    id_guru: 0,
    kode_mapel: item.key,
    nama_mapel: item.nama_mapel,
    is_default: false,
    is_active: true,
    kelompok_mapel: item.kelompok_mapel,
    parent_id: item.parent_key ? keyToId.get(item.parent_key)! : null,
    urutan: item.urutan,
    is_group_header: item.is_group_header ?? false,
    created_at: "",
  }));
}

export function findRaporRowForMapel(
  mapel: Pick<MataPelajaran, "id" | "nama_mapel" | "kode_mapel">,
  raporRows: Array<{
    id_mata_pelajaran: number;
    mata_pelajaran?: { nama_mapel?: string; kode_mapel?: string | null } | null;
  }>,
  mapelById: Map<number, MataPelajaran>,
): (typeof raporRows)[number] | undefined {
  if (mapel.id > 0) {
    const byId = raporRows.find((r) => r.id_mata_pelajaran === mapel.id);
    if (byId) return byId;
  }

  const target = normalizeMapelName(mapel.nama_mapel);
  const targetKey = mapel.kode_mapel?.toLowerCase();

  for (const row of raporRows) {
    const joined = row.mata_pelajaran;
    const dbMapel = mapelById.get(row.id_mata_pelajaran);
    const nama = joined?.nama_mapel ?? dbMapel?.nama_mapel;
    if (!nama) continue;

    if (normalizeMapelName(nama) === target) return row;

    const kode = joined?.kode_mapel ?? dbMapel?.kode_mapel;
    if (targetKey && kode?.toLowerCase() === targetKey) return row;
  }

  return undefined;
}
