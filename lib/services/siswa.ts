import { createClient } from "@/lib/supabase/client";
import type { Siswa } from "@/lib/types/database";

export async function fetchSiswaByKelas(
  kelasId: number,
  includeDeleted = false,
): Promise<Siswa[]> {
  const supabase = createClient();
  let query = supabase
    .from("siswa")
    .select("*")
    .eq("id_kelas", kelasId)
    .order("nama_siswa");

  if (!includeDeleted) {
    query = query.eq("is_deleted", false);
  } else {
    query = query.eq("is_deleted", true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Siswa[];
}

export async function createSiswa(input: {
  id_kelas: number;
  nama_siswa: string;
  nisn?: string | null;
  nis?: string | null;
}) {
  const supabase = createClient();
  const nama = input.nama_siswa.trim();
  if (!nama) throw new Error("Nama siswa wajib diisi.");

  const { data, error } = await supabase
    .from("siswa")
    .insert({
      id_kelas: input.id_kelas,
      nama_siswa: nama,
      nisn: input.nisn?.trim() || null,
      nis: input.nis?.trim() || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Siswa;
}

export async function updateSiswa(
  siswaId: number,
  input: { nama_siswa: string; nisn?: string | null; nis?: string | null },
) {
  const supabase = createClient();
  const nama = input.nama_siswa.trim();
  if (!nama) throw new Error("Nama siswa wajib diisi.");

  const { data, error } = await supabase
    .from("siswa")
    .update({
      nama_siswa: nama,
      nisn: input.nisn?.trim() || null,
      nis: input.nis?.trim() || null,
    })
    .eq("id", siswaId)
    .select()
    .single();

  if (error) throw error;
  return data as Siswa;
}

export async function softDeleteSiswa(siswaId: number) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("siswa")
    .update({ is_deleted: true })
    .eq("id", siswaId)
    .select()
    .single();

  if (error) throw error;
  return data as Siswa;
}

export async function restoreSiswa(siswaId: number) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("siswa")
    .update({ is_deleted: false, deleted_at: null })
    .eq("id", siswaId)
    .select()
    .single();

  if (error) throw error;
  return data as Siswa;
}

export async function bulkCreateSiswa(
  idKelas: number,
  rows: { nama_siswa: string; nisn?: string | null; nis?: string | null }[],
) {
  if (rows.length === 0) return [];

  const supabase = createClient();
  const payload = rows.map((row) => ({
    id_kelas: idKelas,
    nama_siswa: row.nama_siswa.trim(),
    nisn: row.nisn?.trim() || null,
    nis: row.nis?.trim() || null,
  }));

  const { data, error } = await supabase.from("siswa").insert(payload).select();
  if (error) throw error;
  return (data ?? []) as Siswa[];
}
