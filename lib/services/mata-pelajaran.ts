import { createClient } from "@/lib/supabase/client";
import { fetchCurrentGuru } from "@/lib/services/kelas";
import {
  MAN_SMA_IPS_MAPEL_SEED,
  type ManMapelSeedItem,
} from "@/lib/rapor/default-man-mapel";
import { JENJANG_MAPEL_SEED } from "@/lib/mapel/jenjang-mapel-seed";
import type { Guru, JenjangSekolah, MapelKelompok, MataPelajaran } from "@/lib/types/database";

function isMissingColumnError(message: string | undefined): boolean {
  if (!message) return false;
  return (
    message.includes("Could not find") ||
    message.includes("does not exist") ||
    message.includes("column")
  );
}

export function sortMataPelajaranList(mapel: MataPelajaran[]): MataPelajaran[] {
  return [...mapel].sort((a, b) => {
    const ka = a.kelompok_mapel ?? "A";
    const kb = b.kelompok_mapel ?? "A";
    if (ka !== kb) return ka.localeCompare(kb);
    const ua = a.urutan ?? 999;
    const ub = b.urutan ?? 999;
    if (ua !== ub) return ua - ub;
    if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
    return a.nama_mapel.localeCompare(b.nama_mapel, "id");
  });
}

async function ensureDefaultMataPelajaran(guru: Guru): Promise<MataPelajaran | null> {
  const nama = guru.mata_pelajaran?.trim();
  if (!nama) return null;

  const supabase = createClient();
  const { data: existing } = await supabase
    .from("mata_pelajaran")
    .select("*")
    .eq("id_guru", guru.id)
    .eq("nama_mapel", nama)
    .maybeSingle();

  if (existing) {
    if (!existing.is_active || !existing.is_default) {
      await supabase
        .from("mata_pelajaran")
        .update({ is_active: true, is_default: true })
        .eq("id", existing.id);
    }
    return { ...(existing as MataPelajaran), is_active: true, is_default: true };
  }

  const { data: inserted, error } = await supabase
    .from("mata_pelajaran")
    .insert({
      id_guru: guru.id,
      nama_mapel: nama,
      is_default: true,
      is_active: true,
    })
    .select("*")
    .single();

  if (error) throw error;
  return inserted as MataPelajaran;
}

export async function fetchMataPelajaranOrdered(): Promise<MataPelajaran[]> {
  const guru = await fetchCurrentGuru();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("mata_pelajaran")
    .select("*")
    .eq("id_guru", guru.id)
    .eq("is_active", true);

  if (error) throw error;

  const raw = (data ?? []) as MataPelajaran[];
  const groupHeaderIds = new Set(
    raw.filter((m) => m.is_group_header).map((m) => m.id),
  );

  let list = raw
    .filter((m) => !m.is_group_header)
    .map((m) =>
      m.parent_id && groupHeaderIds.has(m.parent_id)
        ? { ...m, parent_id: null }
        : m,
    );
  if (list.length === 0) {
    const created = await ensureDefaultMataPelajaran(guru);
    if (created) list = [created];
  }

  return sortMataPelajaranList(list);
}

export async function updateMataPelajaranMeta(
  mapelId: number,
  patch: {
    kelompok_mapel?: MapelKelompok;
    urutan?: number;
    parent_id?: number | null;
    is_group_header?: boolean;
  },
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("mata_pelajaran")
    .update(patch)
    .eq("id", mapelId);

  if (error) throw error;
}

export async function createMataPelajaran(input: {
  nama_mapel: string;
  kode_mapel?: string | null;
}): Promise<MataPelajaran> {
  const guru = await fetchCurrentGuru();
  const nama = input.nama_mapel.trim();
  if (!nama) throw new Error("Nama mata pelajaran wajib diisi.");

  const supabase = createClient();

  const { data: existingRows } = await supabase
    .from("mata_pelajaran")
    .select("id, urutan, is_group_header")
    .eq("id_guru", guru.id)
    .eq("is_active", true);

  const scorable = (existingRows ?? []).filter((m) => !m.is_group_header);
  const maxUrutan = (existingRows ?? []).reduce(
    (max, row) => Math.max(max, (row as MataPelajaran).urutan ?? 0),
    0,
  );

  const payload = {
    id_guru: guru.id,
    nama_mapel: nama,
    kode_mapel: input.kode_mapel?.trim() || null,
    is_active: true,
    is_default: scorable.length === 0,
    is_group_header: false,
    kelompok_mapel: "A" as MapelKelompok,
    urutan: maxUrutan + 1,
  };

  let { data, error } = await supabase
    .from("mata_pelajaran")
    .insert(payload)
    .select("*")
    .single();

  if (error && isMissingColumnError(error.message)) {
    ({ data, error } = await supabase
      .from("mata_pelajaran")
      .insert({
        id_guru: guru.id,
        nama_mapel: nama,
        is_active: true,
        is_default: scorable.length === 0,
      })
      .select("*")
      .single());
  }

  if (error) {
    if (error.code === "23505") {
      throw new Error("Mata pelajaran dengan nama tersebut sudah ada.");
    }
    throw error;
  }

  return data as MataPelajaran;
}

export async function updateMataPelajaran(
  mapelId: number,
  patch: { nama_mapel?: string; kode_mapel?: string | null },
): Promise<void> {
  const updates: Record<string, string | null> = {};
  if (patch.nama_mapel !== undefined) {
    const nama = patch.nama_mapel.trim();
    if (!nama) throw new Error("Nama mata pelajaran wajib diisi.");
    updates.nama_mapel = nama;
  }
  if (patch.kode_mapel !== undefined) {
    updates.kode_mapel = patch.kode_mapel?.trim() || null;
  }
  if (Object.keys(updates).length === 0) return;

  const supabase = createClient();
  const { error } = await supabase
    .from("mata_pelajaran")
    .update(updates)
    .eq("id", mapelId);

  if (error) {
    if (error.code === "23505") {
      throw new Error("Mata pelajaran dengan nama tersebut sudah ada.");
    }
    throw error;
  }
}

export async function deleteMataPelajaran(mapelId: number): Promise<void> {
  const guru = await fetchCurrentGuru();
  const supabase = createClient();

  const { data: mapel, error: fetchErr } = await supabase
    .from("mata_pelajaran")
    .select("*")
    .eq("id", mapelId)
    .eq("id_guru", guru.id)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (!mapel) throw new Error("Mata pelajaran tidak ditemukan.");

  const { data: activeRows, error: listErr } = await supabase
    .from("mata_pelajaran")
    .select("id, is_group_header, is_default")
    .eq("id_guru", guru.id)
    .eq("is_active", true);

  if (listErr) throw listErr;

  const scorable = (activeRows ?? []).filter((m) => !m.is_group_header);
  if (scorable.length <= 1) {
    throw new Error("Minimal harus ada satu mata pelajaran aktif.");
  }

  const { error: raporDeleteErr } = await supabase
    .from("rapor_mapel")
    .delete()
    .eq("id_mata_pelajaran", mapelId)
    .eq("id_guru", guru.id);

  if (raporDeleteErr) throw raporDeleteErr;

  const { error } = await supabase
    .from("mata_pelajaran")
    .update({ is_active: false, is_default: false })
    .eq("id", mapelId);

  if (error) throw error;

  if ((mapel as MataPelajaran).is_default) {
    const next = scorable.find((m) => m.id !== mapelId);
    if (next) {
      await supabase
        .from("mata_pelajaran")
        .update({ is_default: true })
        .eq("id", next.id);
    }
  }
}

/** Hanya baris rapor yang mapel-nya masih aktif (untuk pratinjau & cetak). */
export function filterRaporMapelToActiveMapel<T extends { id_mata_pelajaran: number }>(
  rows: T[],
  activeMapelList: Pick<MataPelajaran, "id">[],
): T[] {
  const activeIds = new Set(activeMapelList.map((m) => m.id));
  return rows.filter((row) => activeIds.has(row.id_mata_pelajaran));
}

/**
 * Menyisipkan struktur mapel MAN SMA IPS untuk guru saat ini.
 * Mapel dengan nama sama di-update metadata-nya; yang belum ada di-insert.
 */
export async function seedManSmaIpsMapel(): Promise<number> {
  const guru = await fetchCurrentGuru();
  const supabase = createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from("mata_pelajaran")
    .select("*")
    .eq("id_guru", guru.id);

  if (fetchErr) throw fetchErr;

  const byName = new Map(
    (existing ?? []).map((m) => [
      (m as MataPelajaran).nama_mapel.toLowerCase().trim(),
      m as MataPelajaran,
    ]),
  );

  const idByKey = new Map<string, number>();
  let touched = 0;

  async function upsertItem(item: ManMapelSeedItem) {
    const parentId = item.parent_key
      ? (idByKey.get(item.parent_key) ?? null)
      : null;

    const normalized = item.nama_mapel.toLowerCase().trim();
    const found = byName.get(normalized);

    const manMeta = {
      kelompok_mapel: item.kelompok_mapel,
      urutan: item.urutan,
      parent_id: parentId,
      is_group_header: item.is_group_header ?? false,
      is_active: true,
    };

    if (found) {
      let { error } = await supabase
        .from("mata_pelajaran")
        .update(manMeta)
        .eq("id", found.id);

      if (error && isMissingColumnError(error.message)) {
        ({ error } = await supabase
          .from("mata_pelajaran")
          .update({ is_active: true })
          .eq("id", found.id));
      }

      if (error) throw error;
      idByKey.set(item.key, found.id);
      touched += 1;
      return;
    }

    let { data: inserted, error } = await supabase
      .from("mata_pelajaran")
      .insert({
        id_guru: guru.id,
        nama_mapel: item.nama_mapel,
        is_default: item.key === "mtk",
        ...manMeta,
      })
      .select("id")
      .single();

    if (error && isMissingColumnError(error.message)) {
      ({ data: inserted, error } = await supabase
        .from("mata_pelajaran")
        .insert({
          id_guru: guru.id,
          nama_mapel: item.nama_mapel,
          is_default: item.key === "mtk",
          is_active: true,
        })
        .select("id")
        .single());
    }

    if (error) throw error;
    idByKey.set(item.key, inserted!.id);
    byName.set(normalized, {
      id: inserted!.id,
      id_guru: guru.id,
      nama_mapel: item.nama_mapel,
      kode_mapel: null,
      is_default: false,
      is_active: true,
      created_at: "",
      kelompok_mapel: item.kelompok_mapel,
      urutan: item.urutan,
      parent_id: parentId,
      is_group_header: item.is_group_header ?? false,
    });
    touched += 1;
  }

  for (const item of MAN_SMA_IPS_MAPEL_SEED) {
    await upsertItem(item);
  }

  for (const row of existing ?? []) {
    const mp = row as MataPelajaran;
    if (!mp.is_group_header) continue;

    const { error } = await supabase
      .from("mata_pelajaran")
      .update({ is_active: false, is_group_header: false })
      .eq("id", mp.id);

    if (error && !isMissingColumnError(error.message)) throw error;
  }

  return touched;
}

/**
 * Menambahkan mapel default jenjang (SD/SMP/SMA) yang belum ada.
 * Mapel kustom yang sudah ada tidak dihapus atau diubah namanya.
 */
export async function seedJenjangMapel(jenjang: JenjangSekolah): Promise<number> {
  const guru = await fetchCurrentGuru();
  const supabase = createClient();
  const seedNames = JENJANG_MAPEL_SEED[jenjang];

  const { data: existing, error: fetchErr } = await supabase
    .from("mata_pelajaran")
    .select("*")
    .eq("id_guru", guru.id);

  if (fetchErr) throw fetchErr;

  const rows = (existing ?? []) as MataPelajaran[];
  const byName = new Map(
    rows.map((m) => [m.nama_mapel.toLowerCase().trim(), m]),
  );

  const activeScorable = rows.filter((m) => m.is_active && !m.is_group_header);
  const hasDefault = activeScorable.some((m) => m.is_default);
  const maxUrutan = rows.reduce(
    (max, row) => Math.max(max, row.urutan ?? 0),
    0,
  );

  let touched = 0;
  let nextUrutan = maxUrutan;
  let assignDefault = activeScorable.length === 0 && !hasDefault;

  for (const nama of seedNames) {
    const normalized = nama.toLowerCase().trim();
    const found = byName.get(normalized);

    if (found) {
      if (!found.is_active) {
        let { error } = await supabase
          .from("mata_pelajaran")
          .update({ is_active: true, is_group_header: false })
          .eq("id", found.id);

        if (error && isMissingColumnError(error.message)) {
          ({ error } = await supabase
            .from("mata_pelajaran")
            .update({ is_active: true })
            .eq("id", found.id));
        }

        if (error) throw error;
        touched += 1;
      }
      continue;
    }

    nextUrutan += 1;
    const makeDefault = assignDefault;
    if (makeDefault) assignDefault = false;

    const payload = {
      id_guru: guru.id,
      nama_mapel: nama,
      is_active: true,
      is_default: makeDefault,
      is_group_header: false,
      kelompok_mapel: "A" as MapelKelompok,
      urutan: nextUrutan,
    };

    let { data: inserted, error } = await supabase
      .from("mata_pelajaran")
      .insert(payload)
      .select("id")
      .single();

    if (error && isMissingColumnError(error.message)) {
      ({ data: inserted, error } = await supabase
        .from("mata_pelajaran")
        .insert({
          id_guru: guru.id,
          nama_mapel: nama,
          is_active: true,
          is_default: makeDefault,
        })
        .select("id")
        .single());
    }

    if (error) throw error;

    byName.set(normalized, {
      id: inserted!.id,
      id_guru: guru.id,
      nama_mapel: nama,
      kode_mapel: null,
      is_default: makeDefault,
      is_active: true,
      created_at: "",
      kelompok_mapel: "A",
      urutan: nextUrutan,
      is_group_header: false,
    });
    touched += 1;
  }

  return touched;
}
