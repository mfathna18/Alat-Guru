import { createClient } from "@/lib/supabase/client";
import { modulScopeKey } from "@/lib/modul-ajar/scope";
import { progressKey } from "@/lib/modul-ajar/progress";
import { fetchCurrentGuru } from "@/lib/services/kelas";
import type { Kelas, KelasModulProgress, ModulAjar } from "@/lib/types/database";

export interface ModulAjarWorkspace {
  /** key: `${kelasId}-${mapelId}` */
  modulByScope: Record<string, ModulAjar[]>;
  kelasList: Kelas[];
  /** key: `${kelasId}-${modulId}` → selesai */
  progressMap: Record<string, boolean>;
  /** true jika migration 013 belum dijalankan */
  legacyGlobalModul: boolean;
  /** true jika kolom id_mata_pelajaran belum ada (migration 020) */
  legacyWithoutMapel: boolean;
}

type ModulSchemaMode = "per-kelas-mapel" | "per-kelas" | "legacy";

let cachedSchemaMode: ModulSchemaMode | null = null;

async function detectModulSchemaMode(
  supabase: ReturnType<typeof createClient>,
): Promise<ModulSchemaMode> {
  if (cachedSchemaMode) return cachedSchemaMode;

  const { error: mapelColErr } = await supabase
    .from("modul_ajar")
    .select("id_mata_pelajaran")
    .limit(1);

  if (
    mapelColErr &&
    (mapelColErr.code === "PGRST204" ||
      mapelColErr.message.includes("id_mata_pelajaran") ||
      mapelColErr.message.includes("schema cache"))
  ) {
    const { error: kelasColErr } = await supabase
      .from("modul_ajar")
      .select("id_kelas")
      .limit(1);

    if (
      kelasColErr &&
      (kelasColErr.code === "PGRST204" ||
        kelasColErr.message.includes("id_kelas") ||
        kelasColErr.message.includes("schema cache"))
    ) {
      cachedSchemaMode = "legacy";
    } else {
      cachedSchemaMode = "per-kelas";
    }
    return cachedSchemaMode;
  }

  cachedSchemaMode = "per-kelas-mapel";
  return cachedSchemaMode;
}

async function nextUrutanPerScope(
  supabase: ReturnType<typeof createClient>,
  kelasId: number,
  mapelId?: number | null,
): Promise<number> {
  let query = supabase
    .from("modul_ajar")
    .select("urutan")
    .eq("id_kelas", kelasId)
    .order("urutan", { ascending: false })
    .limit(1);

  if (mapelId != null) {
    query = query.eq("id_mata_pelajaran", mapelId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data && data.length > 0 ? (data[0] as { urutan: number }).urutan + 1 : 1;
}

async function nextUrutanPerGuru(
  supabase: ReturnType<typeof createClient>,
  guruId: number,
): Promise<number> {
  const { data, error } = await supabase
    .from("modul_ajar")
    .select("urutan")
    .eq("id_guru", guruId)
    .order("urutan", { ascending: false })
    .limit(1);

  if (error) throw error;
  return data && data.length > 0 ? (data[0] as { urutan: number }).urutan + 1 : 1;
}

function putModulInScope(
  modulByScope: Record<string, ModulAjar[]>,
  kelasId: number,
  mapelId: number,
  modul: ModulAjar,
) {
  const key = modulScopeKey(kelasId, mapelId);
  if (!modulByScope[key]) modulByScope[key] = [];
  modulByScope[key]!.push(modul);
}

export async function fetchModulAjarWorkspace(): Promise<ModulAjarWorkspace> {
  const supabase = createClient();
  const schemaMode = await detectModulSchemaMode(supabase);
  const legacyGlobalModul = schemaMode === "legacy";
  const legacyWithoutMapel = schemaMode === "per-kelas";

  const [modulRes, kelasRes, mapelRes] = await Promise.all([
    supabase.from("modul_ajar").select("*").order("urutan"),
    supabase.from("kelas").select("*").order("nama_kelas"),
    supabase.from("mata_pelajaran").select("id").eq("is_active", true),
  ]);

  if (modulRes.error) throw modulRes.error;
  if (kelasRes.error) throw kelasRes.error;
  if (mapelRes.error) throw mapelRes.error;

  const kelasList = (kelasRes.data ?? []) as Kelas[];
  const allModul = (modulRes.data ?? []) as ModulAjar[];
  const mapelIds = (mapelRes.data ?? []).map((m) => m.id as number);
  const modulByScope: Record<string, ModulAjar[]> = {};

  if (legacyGlobalModul) {
    for (const k of kelasList) {
      for (const mapelId of mapelIds) {
        modulByScope[modulScopeKey(k.id, mapelId)] = allModul.map((m) => ({
          ...m,
          id_kelas: k.id,
          id_mata_pelajaran: mapelId,
        }));
      }
    }
  } else if (legacyWithoutMapel) {
    for (const m of allModul) {
      for (const mapelId of mapelIds) {
        putModulInScope(modulByScope, m.id_kelas, mapelId, {
          ...m,
          id_mata_pelajaran: mapelId,
        });
      }
    }
  } else {
    for (const m of allModul) {
      putModulInScope(modulByScope, m.id_kelas, m.id_mata_pelajaran, m);
    }
  }

  for (const key of Object.keys(modulByScope)) {
    modulByScope[key]!.sort((a, b) => a.urutan - b.urutan);
  }

  const kelasIds = kelasList.map((k) => k.id);
  const modulIds = allModul.map((m) => m.id);
  const progressMap: Record<string, boolean> = {};

  if (kelasIds.length > 0 && modulIds.length > 0) {
    const { data, error } = await supabase
      .from("kelas_modul_progress")
      .select("*")
      .in("id_kelas", kelasIds)
      .in("id_modul", modulIds);

    if (error) throw error;

    for (const row of (data ?? []) as KelasModulProgress[]) {
      progressMap[progressKey(row.id_kelas, row.id_modul)] = row.selesai;
    }
  }

  return {
    modulByScope,
    kelasList,
    progressMap,
    legacyGlobalModul,
    legacyWithoutMapel,
  };
}

export async function fetchModulByKelasMapel(
  kelasId: number,
  mapelId: number,
): Promise<ModulAjar[]> {
  const workspace = await fetchModulAjarWorkspace();
  return workspace.modulByScope[modulScopeKey(kelasId, mapelId)] ?? [];
}

export async function createModulAjar(
  kelasId: number,
  mapelId: number,
  judul: string,
) {
  const supabase = createClient();
  const guru = await fetchCurrentGuru();
  const trimmed = judul.trim();
  if (!trimmed) throw new Error("Judul modul wajib diisi.");

  const schemaMode = await detectModulSchemaMode(supabase);

  if (schemaMode === "legacy") {
    const nextUrutan = await nextUrutanPerGuru(supabase, guru.id);
    const { data, error } = await supabase
      .from("modul_ajar")
      .insert({
        id_guru: guru.id,
        urutan: nextUrutan,
        judul: trimmed,
      })
      .select()
      .single();

    if (error) throw error;
    cachedSchemaMode = null;
    return {
      ...(data as ModulAjar),
      id_kelas: kelasId,
      id_mata_pelajaran: mapelId,
    };
  }

  const nextUrutan = await nextUrutanPerScope(
    supabase,
    kelasId,
    schemaMode === "per-kelas-mapel" ? mapelId : null,
  );

  const row: Record<string, unknown> = {
    id_guru: guru.id,
    id_kelas: kelasId,
    urutan: nextUrutan,
    judul: trimmed,
  };

  if (schemaMode === "per-kelas-mapel") {
    row.id_mata_pelajaran = mapelId;
  }

  const { data, error } = await supabase
    .from("modul_ajar")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return {
    ...(data as ModulAjar),
    id_mata_pelajaran: mapelId,
  };
}

export async function duplicateModulAjar(
  sourceModulId: number,
  targetKelasId: number,
  targetMapelId: number,
) {
  const supabase = createClient();
  const { data: source, error: srcErr } = await supabase
    .from("modul_ajar")
    .select("*")
    .eq("id", sourceModulId)
    .single();

  if (srcErr || !source) throw new Error("Modul sumber tidak ditemukan.");

  return createModulAjar(
    targetKelasId,
    targetMapelId,
    (source as ModulAjar).judul,
  );
}

export async function updateModulAjar(modulId: number, judul: string) {
  const supabase = createClient();
  const trimmed = judul.trim();
  if (!trimmed) throw new Error("Judul modul wajib diisi.");

  const { data, error } = await supabase
    .from("modul_ajar")
    .update({ judul: trimmed })
    .eq("id", modulId)
    .select()
    .single();

  if (error) throw error;
  return data as ModulAjar;
}

export async function deleteModulAjar(modulId: number) {
  const supabase = createClient();
  const { error } = await supabase.from("modul_ajar").delete().eq("id", modulId);
  if (error) throw error;
  cachedSchemaMode = null;
}

export async function upsertModulProgress(
  kelasId: number,
  modulId: number,
  selesai: boolean,
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("kelas_modul_progress")
    .upsert(
      { id_kelas: kelasId, id_modul: modulId, selesai },
      { onConflict: "id_kelas,id_modul" },
    )
    .select()
    .single();

  if (error) throw error;
  return data as KelasModulProgress;
}
