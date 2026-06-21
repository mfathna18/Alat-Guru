import { createClient } from "@/lib/supabase/client";
import { fetchCurrentGuru } from "@/lib/services/kelas";
import type {
  ERapor,
  Ekstrakurikuler,
  Siswa,
  SiswaEkstrakurikuler,
  SkorKualitatif,
} from "@/lib/types/database";
import { getErrorMessage, isMissingColumnError } from "@/lib/utils";

export interface SiswaRaporWaliKelasRow {
  siswa: Siswa;
  eRapor: ERapor | null;
  ekstrakurikuler: (SiswaEkstrakurikuler & { nama_ekskul: string })[];
}

export interface RaporWaliKelasWorkspace {
  siswaRows: SiswaRaporWaliKelasRow[];
  ekskulMaster: Ekstrakurikuler[];
}

export interface ERaporSikapCatatanInput {
  id_siswa: number;
  id_kelas: number;
  semester: 1 | 2;
  tahun_ajaran: string;
  sikap_deskripsi?: string | null;
  catatan_wali_kelas?: string | null;
}

export interface SiswaEkstrakurikulerInput {
  id_siswa: number;
  id_ekstrakurikuler: number;
  semester: 1 | 2;
  tahun_ajaran: string;
  predikat_kualitatif?: SkorKualitatif | null;
  deskripsi_capaian?: string | null;
}

function trimOrNull(value: string | null | undefined): string | null {
  const t = value?.trim();
  return t ? t : null;
}

export async function fetchRaporWaliKelasWorkspace(
  kelasId: number,
  semester: 1 | 2,
  tahunAjaran: string,
): Promise<RaporWaliKelasWorkspace> {
  const supabase = createClient();

  const [siswaRes, eRaporRes, ekskulMasterRes] = await Promise.all([
    supabase
      .from("siswa")
      .select("*")
      .eq("id_kelas", kelasId)
      .eq("is_deleted", false)
      .order("nama_siswa"),
    supabase
      .from("e_rapor")
      .select("*")
      .eq("id_kelas", kelasId)
      .eq("semester", semester)
      .eq("tahun_ajaran", tahunAjaran),
    supabase
      .from("ekstrakurikuler")
      .select("*")
      .eq("is_active", true)
      .order("nama_ekskul"),
  ]);

  if (siswaRes.error) throw siswaRes.error;
  if (eRaporRes.error) throw eRaporRes.error;
  if (ekskulMasterRes.error) throw ekskulMasterRes.error;

  const siswa = (siswaRes.data ?? []) as Siswa[];
  const eRaporBySiswa = new Map(
    ((eRaporRes.data ?? []) as ERapor[]).map((row) => [row.id_siswa, row]),
  );

  const ekskulBySiswa = new Map<
    number,
    (SiswaEkstrakurikuler & { nama_ekskul: string })[]
  >();
  for (const s of siswa) {
    ekskulBySiswa.set(s.id, []);
  }

  if (siswa.length > 0) {
    const { data: ekskulRows, error: ekskulErr } = await supabase
      .from("siswa_ekstrakurikuler")
      .select("*, ekstrakurikuler(nama_ekskul)")
      .in(
        "id_siswa",
        siswa.map((s) => s.id),
      )
      .eq("semester", semester)
      .eq("tahun_ajaran", tahunAjaran);

    if (ekskulErr) throw ekskulErr;

    for (const row of ekskulRows ?? []) {
      const typed = row as SiswaEkstrakurikuler & {
        ekstrakurikuler: { nama_ekskul: string } | null;
      };
      const list = ekskulBySiswa.get(typed.id_siswa) ?? [];
      list.push({
        ...typed,
        nama_ekskul: typed.ekstrakurikuler?.nama_ekskul ?? "Ekstrakurikuler",
      });
      ekskulBySiswa.set(typed.id_siswa, list);
    }
  }

  return {
    siswaRows: siswa.map((s) => ({
      siswa: s,
      eRapor: eRaporBySiswa.get(s.id) ?? null,
      ekstrakurikuler: ekskulBySiswa.get(s.id) ?? [],
    })),
    ekskulMaster: (ekskulMasterRes.data ?? []) as Ekstrakurikuler[],
  };
}

export async function upsertERaporSikapCatatan(
  input: ERaporSikapCatatanInput,
): Promise<ERapor> {
  const supabase = createClient();
  const payload = {
    id_siswa: input.id_siswa,
    id_kelas: input.id_kelas,
    semester: input.semester,
    tahun_ajaran: input.tahun_ajaran,
    sikap_spiritual: trimOrNull(input.sikap_deskripsi),
    sikap_sosial: null,
    catatan_wali_kelas: trimOrNull(input.catatan_wali_kelas),
    status: "draft" as const,
  };

  let result = await supabase
    .from("e_rapor")
    .upsert(payload, { onConflict: "id_siswa,semester,tahun_ajaran" })
    .select()
    .single();

  if (result.error && isMissingColumnError(result.error)) {
    const { sikap_spiritual, sikap_sosial, ...legacy } = payload;
    void sikap_spiritual;
    void sikap_sosial;
    result = await supabase
      .from("e_rapor")
      .upsert(legacy, { onConflict: "id_siswa,semester,tahun_ajaran" })
      .select()
      .single();
  }

  if (result.error) {
    throw new Error(
      getErrorMessage(result.error, "Gagal menyimpan sikap dan catatan."),
    );
  }

  return result.data as ERapor;
}

export async function createEkstrakurikuler(
  namaEkskul: string,
  pembina?: string | null,
): Promise<Ekstrakurikuler> {
  const guru = await fetchCurrentGuru();
  const supabase = createClient();
  const nama = namaEkskul.trim();
  if (!nama) throw new Error("Nama kegiatan ekstrakurikuler wajib diisi.");

  const { data, error } = await supabase
    .from("ekstrakurikuler")
    .insert({
      id_guru: guru.id,
      nama_ekskul: nama,
      pembina: pembina?.trim() || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      getErrorMessage(error, "Gagal menambah kegiatan ekstrakurikuler."),
    );
  }

  return data as Ekstrakurikuler;
}

export async function deleteEkstrakurikuler(id: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("ekstrakurikuler").delete().eq("id", id);

  if (error) {
    throw new Error(
      getErrorMessage(error, "Gagal menghapus kegiatan ekstrakurikuler."),
    );
  }
}

export async function upsertSiswaEkstrakurikuler(
  input: SiswaEkstrakurikulerInput,
): Promise<SiswaEkstrakurikuler & { nama_ekskul: string }> {
  const supabase = createClient();
  const payload = {
    id_siswa: input.id_siswa,
    id_ekstrakurikuler: input.id_ekstrakurikuler,
    semester: input.semester,
    tahun_ajaran: input.tahun_ajaran,
    predikat_kualitatif: input.predikat_kualitatif ?? null,
    predikat: input.predikat_kualitatif ?? null,
    deskripsi_capaian: trimOrNull(input.deskripsi_capaian),
  };

  const { data, error } = await supabase
    .from("siswa_ekstrakurikuler")
    .upsert(payload, {
      onConflict: "id_siswa,id_ekstrakurikuler,semester,tahun_ajaran",
    })
    .select("*, ekstrakurikuler(nama_ekskul)")
    .single();

  if (error) {
    throw new Error(
      getErrorMessage(error, "Gagal menyimpan data ekstrakurikuler siswa."),
    );
  }

  const row = data as SiswaEkstrakurikuler & {
    ekstrakurikuler: { nama_ekskul: string } | null;
  };

  return {
    ...row,
    nama_ekskul: row.ekstrakurikuler?.nama_ekskul ?? "Ekstrakurikuler",
  };
}

export async function deleteSiswaEkstrakurikuler(id: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("siswa_ekstrakurikuler")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(
      getErrorMessage(error, "Gagal menghapus baris ekstrakurikuler."),
    );
  }
}
