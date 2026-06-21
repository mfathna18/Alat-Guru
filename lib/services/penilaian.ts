import { createClient } from "@/lib/supabase/client";
import type {
  Indikator,
  JenisAsesmen,
  Kelas,
  LingkupMateri,
  Nilai,
  Rubrik,
  Siswa,
  SkalaPenilaian,
  TipeSumatif,
  TujuanPembelajaran,
} from "@/lib/types/database";

export interface SumatifPenilaianContext {
  tipe: TipeSumatif;
}

export interface IndikatorColumn extends Indikator {
  kode_tp: string;
  tp_id: number;
  deskripsi_tp: string;
  skala_penilaian: SkalaPenilaian;
}

export interface TpPenilaianSummary {
  id: number;
  kode_tp: string;
  deskripsi_tp: string;
  skala_penilaian: SkalaPenilaian;
  indikator_count: number;
}

export interface PenilaianWorkspace {
  kelas: Kelas[];
  siswa: Siswa[];
  indikator: IndikatorColumn[];
  nilaiMap: Record<string, Nilai>;
  /** Skala dominan / fallback (skala TP pertama) */
  skalaPenilaian: SkalaPenilaian;
  tpSummaries: TpPenilaianSummary[];
  /** Jumlah TP di semester lain (petunjuk ganti filter) */
  tpCountOtherSemester: number;
}

/** Kunci sel spreadsheet — unik per baris nilai (termasuk tipe sumatif). */
export function nilaiKey(siswaId: number, indikatorId: number) {
  return `${siswaId}-${indikatorId}`;
}

function nilaiRowKey(row: Pick<
  Nilai,
  "id_siswa" | "id_indikator" | "jenis_asesmen" | "tipe_sumatif" | "id_lingkup_materi"
>) {
  if (row.jenis_asesmen !== "SUMATIF") {
    return nilaiKey(row.id_siswa, row.id_indikator);
  }
  return `${row.id_siswa}-${row.id_indikator}-${row.tipe_sumatif ?? "SAS"}-${row.id_lingkup_materi ?? ""}`;
}

export function buildNilaiMap(
  nilaiList: Nilai[],
  /** Saat query sudah difilter (mis. sumatif STS/SAS), gunakan kunci sel sederhana. */
  useSimpleKeys = false,
) {
  return nilaiList.reduce<Record<string, Nilai>>((acc, row) => {
    const key = useSimpleKeys
      ? nilaiKey(row.id_siswa, row.id_indikator)
      : nilaiRowKey(row);
    acc[key] = row;
    return acc;
  }, {});
}

export async function fetchLingkupMateriForPenilaian(
  kelasId: number,
  semester: 1 | 2,
  mapelId: number,
  defaultMapelId?: number | null,
): Promise<LingkupMateri[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("lingkup_materi")
    .select("*")
    .eq("id_kelas", kelasId)
    .eq("semester", semester)
    .order("urutan");

  if (error) throw error;
  return filterByMapelId(
    (data ?? []) as LingkupMateri[],
    mapelId,
    defaultMapelId,
  );
}

export async function fetchKelasList(): Promise<Kelas[]> {
  const { fetchKelasByGuru } = await import("@/lib/services/kelas");
  return fetchKelasByGuru();
}

export function filterByMapelId<T extends { id_mata_pelajaran?: number | null }>(
  rows: T[],
  mapelId: number,
  defaultMapelId?: number | null,
): T[] {
  return rows.filter((row) => {
    if (row.id_mata_pelajaran != null) {
      return row.id_mata_pelajaran === mapelId;
    }
    return defaultMapelId != null && mapelId === defaultMapelId;
  });
}

export function filterTpByMapel(
  tpList: TujuanPembelajaran[],
  mapelId: number,
  defaultMapelId?: number | null,
): TujuanPembelajaran[] {
  return filterByMapelId(tpList, mapelId, defaultMapelId);
}

export async function fetchPenilaianWorkspace(
  kelasId: number,
  semester: 1 | 2,
  jenisAsesmen: JenisAsesmen,
  mapelId: number,
  defaultMapelId?: number | null,
  sumatifCtx?: SumatifPenilaianContext,
): Promise<Omit<PenilaianWorkspace, "kelas">> {
  const supabase = createClient();
  const otherSemester: 1 | 2 = semester === 1 ? 2 : 1;

  const [siswaRes, tpRes, tpOtherRes] = await Promise.all([
    supabase
      .from("siswa")
      .select("*")
      .eq("id_kelas", kelasId)
      .eq("is_deleted", false)
      .order("nama_siswa"),
    supabase
      .from("tujuan_pembelajaran")
      .select("*")
      .eq("id_kelas", kelasId)
      .eq("semester", semester)
      .order("kode_tp"),
    supabase
      .from("tujuan_pembelajaran")
      .select("*")
      .eq("id_kelas", kelasId)
      .eq("semester", otherSemester),
  ]);

  if (siswaRes.error) throw siswaRes.error;
  if (tpRes.error) throw tpRes.error;
  if (tpOtherRes.error) throw tpOtherRes.error;

  const siswa = (siswaRes.data ?? []) as Siswa[];
  const tpCountOtherSemester = filterTpByMapel(
    (tpOtherRes.data ?? []) as TujuanPembelajaran[],
    mapelId,
    defaultMapelId,
  ).length;

  let tpList = filterTpByMapel(
    (tpRes.data ?? []) as TujuanPembelajaran[],
    mapelId,
    defaultMapelId,
  );

  const tpIds = tpList.map((tp) => tp.id);

  if (tpIds.length === 0) {
    return {
      siswa,
      indikator: [],
      nilaiMap: {},
      skalaPenilaian: "ANGKA",
      tpSummaries: [],
      tpCountOtherSemester,
    };
  }

  const [indikatorRes, rubrikRes] = await Promise.all([
    supabase.from("indikator").select("*").in("id_tp", tpIds).order("kode_indikator"),
    supabase.from("rubrik").select("*").in("id_tp", tpIds),
  ]);

  if (indikatorRes.error) throw indikatorRes.error;
  if (rubrikRes.error) throw rubrikRes.error;

  const tpById = new Map(tpList.map((tp) => [tp.id, tp]));
  const rubrikByTp = new Map(
    ((rubrikRes.data ?? []) as Rubrik[]).map((r) => [r.id_tp, r]),
  );
  const rawIndikator = (indikatorRes.data ?? []) as Indikator[];

  const tpSummaries: TpPenilaianSummary[] = tpList.map((tp) => ({
    id: tp.id,
    kode_tp: tp.kode_tp,
    deskripsi_tp: tp.deskripsi_tp,
    skala_penilaian:
      rubrikByTp.get(tp.id)?.skala_penilaian ?? "ANGKA",
    indikator_count: rawIndikator.filter((i) => i.id_tp === tp.id).length,
  }));

  const indikator: IndikatorColumn[] = rawIndikator
    .map((ind) => {
      const tp = tpById.get(ind.id_tp);
      const rubrik = rubrikByTp.get(ind.id_tp);
      return {
        ...ind,
        kode_tp: tp?.kode_tp ?? "",
        tp_id: ind.id_tp,
        deskripsi_tp: tp?.deskripsi_tp ?? "",
        skala_penilaian: rubrik?.skala_penilaian ?? "ANGKA",
      };
    })
    .sort((a, b) =>
      `${a.kode_tp}${a.kode_indikator}`.localeCompare(
        `${b.kode_tp}${b.kode_indikator}`,
      ),
    );

  const skalaPenilaian: SkalaPenilaian =
    tpSummaries[0]?.skala_penilaian ?? "ANGKA";

  const siswaIds = siswa.map((s) => s.id);
  const indikatorIds = indikator.map((i) => i.id);

  let nilaiMap: Record<string, Nilai> = {};

  if (siswaIds.length > 0 && indikatorIds.length > 0) {
    let nilaiQuery = supabase
      .from("nilai")
      .select("*")
      .in("id_siswa", siswaIds)
      .in("id_indikator", indikatorIds)
      .eq("jenis_asesmen", jenisAsesmen);

    if (jenisAsesmen === "SUMATIF") {
      const tipe = sumatifCtx?.tipe ?? "SAS";
      nilaiQuery = nilaiQuery.eq("tipe_sumatif", tipe);
    }

    const { data: nilaiData, error: nilaiError } = await nilaiQuery;

    if (nilaiError) throw nilaiError;
    nilaiMap = buildNilaiMap((nilaiData ?? []) as Nilai[], true);
  }

  return {
    siswa,
    indikator,
    nilaiMap,
    skalaPenilaian,
    tpSummaries,
    tpCountOtherSemester,
  };
}
