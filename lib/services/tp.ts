import { createClient } from "@/lib/supabase/client";
import { filterByMapelId } from "@/lib/services/penilaian";
import type {
  Indikator,
  Rubrik,
  SkalaPenilaian,
  TpWithRelations,
  TujuanPembelajaran,
} from "@/lib/types/database";

export async function fetchTpWithRelations(
  kelasId: number,
  semester: 1 | 2,
  mapelId?: number | null,
  defaultMapelId?: number | null,
): Promise<TpWithRelations[]> {
  const supabase = createClient();

  const { data: tpList, error: tpError } = await supabase
    .from("tujuan_pembelajaran")
    .select("*")
    .eq("id_kelas", kelasId)
    .eq("semester", semester)
    .order("kode_tp");

  if (tpError) throw tpError;
  let tps = (tpList ?? []) as TujuanPembelajaran[];
  if (mapelId != null) {
    tps = filterByMapelId(tps, mapelId, defaultMapelId);
  }
  if (tps.length === 0) return [];

  const tpIds = tps.map((tp) => tp.id);

  const [indikatorRes, rubrikRes] = await Promise.all([
    supabase
      .from("indikator")
      .select("*")
      .in("id_tp", tpIds)
      .order("kode_indikator"),
    supabase.from("rubrik").select("*").in("id_tp", tpIds),
  ]);

  if (indikatorRes.error) throw indikatorRes.error;
  if (rubrikRes.error) throw rubrikRes.error;

  const indikators = (indikatorRes.data ?? []) as Indikator[];
  const rubriks = (rubrikRes.data ?? []) as Rubrik[];

  return tps.map((tp) => ({
    ...tp,
    indikator: indikators.filter((i) => i.id_tp === tp.id),
    rubrik: rubriks.find((r) => r.id_tp === tp.id) ?? null,
  }));
}

export async function createTp(input: {
  id_kelas: number;
  semester: 1 | 2;
  kode_tp: string;
  deskripsi_tp: string;
  skala_penilaian?: SkalaPenilaian;
  id_mata_pelajaran: number;
}) {
  const supabase = createClient();
  const kode = input.kode_tp.trim();
  const deskripsi = input.deskripsi_tp.trim();
  if (!kode || !deskripsi) throw new Error("Kode dan deskripsi TP wajib diisi.");
  if (!input.id_mata_pelajaran) {
    throw new Error("Mata pelajaran wajib dipilih.");
  }

  const { data: tp, error: tpError } = await supabase
    .from("tujuan_pembelajaran")
    .insert({
      id_kelas: input.id_kelas,
      semester: input.semester,
      kode_tp: kode,
      deskripsi_tp: deskripsi,
      id_mata_pelajaran: input.id_mata_pelajaran,
    })
    .select()
    .single();

  if (tpError) throw tpError;

  const { error: rubrikError } = await supabase.from("rubrik").insert({
    id_tp: (tp as TujuanPembelajaran).id,
    skala_penilaian: input.skala_penilaian ?? "ANGKA",
    kriteria_json: null,
  });

  if (rubrikError) throw rubrikError;
  return tp as TujuanPembelajaran;
}

export async function updateTp(
  tpId: number,
  input: {
    kode_tp: string;
    deskripsi_tp: string;
    id_mata_pelajaran?: number;
  },
) {
  const supabase = createClient();
  const kode = input.kode_tp.trim();
  const deskripsi = input.deskripsi_tp.trim();
  if (!kode || !deskripsi) throw new Error("Kode dan deskripsi TP wajib diisi.");

  const payload: {
    kode_tp: string;
    deskripsi_tp: string;
    id_mata_pelajaran?: number;
  } = { kode_tp: kode, deskripsi_tp: deskripsi };
  if (input.id_mata_pelajaran != null) {
    payload.id_mata_pelajaran = input.id_mata_pelajaran;
  }

  const { data, error } = await supabase
    .from("tujuan_pembelajaran")
    .update(payload)
    .eq("id", tpId)
    .select()
    .single();

  if (error) throw error;
  return data as TujuanPembelajaran;
}

export async function deleteTp(tpId: number) {
  const supabase = createClient();
  const { error } = await supabase
    .from("tujuan_pembelajaran")
    .delete()
    .eq("id", tpId);
  if (error) throw error;
}

export async function createIndikator(input: {
  id_tp: number;
  kode_indikator: string;
  deskripsi_indikator: string;
}) {
  const supabase = createClient();
  const kode = input.kode_indikator.trim();
  const deskripsi = input.deskripsi_indikator.trim();
  if (!kode || !deskripsi) {
    throw new Error("Kode dan deskripsi indikator wajib diisi.");
  }

  const { data, error } = await supabase
    .from("indikator")
    .insert({
      id_tp: input.id_tp,
      kode_indikator: kode,
      deskripsi_indikator: deskripsi,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Indikator;
}

export async function updateIndikator(
  indikatorId: number,
  input: { kode_indikator: string; deskripsi_indikator: string },
) {
  const supabase = createClient();
  const kode = input.kode_indikator.trim();
  const deskripsi = input.deskripsi_indikator.trim();
  if (!kode || !deskripsi) {
    throw new Error("Kode dan deskripsi indikator wajib diisi.");
  }

  const { data, error } = await supabase
    .from("indikator")
    .update({
      kode_indikator: kode,
      deskripsi_indikator: deskripsi,
    })
    .eq("id", indikatorId)
    .select()
    .single();

  if (error) throw error;
  return data as Indikator;
}

export async function deleteIndikator(indikatorId: number) {
  const supabase = createClient();
  const { error } = await supabase
    .from("indikator")
    .delete()
    .eq("id", indikatorId);
  if (error) throw error;
}

export async function upsertRubrik(
  tpId: number,
  skala: SkalaPenilaian,
  kriteria_json?: Record<string, string> | null,
) {
  const supabase = createClient();
  const payload = {
    skala_penilaian: skala,
    kriteria_json: kriteria_json ?? null,
  };

  const { data: existing } = await supabase
    .from("rubrik")
    .select("id")
    .eq("id_tp", tpId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("rubrik")
      .update(payload)
      .eq("id_tp", tpId)
      .select()
      .single();
    if (error) throw error;
    return data as Rubrik;
  }

  const { data, error } = await supabase
    .from("rubrik")
    .insert({ id_tp: tpId, ...payload })
    .select()
    .single();

  if (error) throw error;
  return data as Rubrik;
}
