import { createClient } from "@/lib/supabase/client";
import type { Guru, Kelas } from "@/lib/types/database";

export async function fetchCurrentGuru(): Promise<Guru> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Sesi tidak valid. Silakan masuk kembali.");

  const { data, error } = await supabase
    .from("guru")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Profil guru belum ditemukan.");

  return data as Guru;
}

export async function fetchKelasByGuru(): Promise<Kelas[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("kelas")
    .select("*")
    .order("nama_kelas");

  if (error) throw error;
  return (data ?? []) as Kelas[];
}

export async function createKelas(idGuru: number, namaKelas: string) {
  const supabase = createClient();
  const trimmed = namaKelas.trim();
  if (!trimmed) throw new Error("Nama kelas wajib diisi.");

  const { data, error } = await supabase
    .from("kelas")
    .insert({ id_guru: idGuru, nama_kelas: trimmed })
    .select()
    .single();

  if (error) throw error;
  return data as Kelas;
}

export async function updateKelas(kelasId: number, namaKelas: string) {
  const supabase = createClient();
  const trimmed = namaKelas.trim();
  if (!trimmed) throw new Error("Nama kelas wajib diisi.");

  const { data, error } = await supabase
    .from("kelas")
    .update({ nama_kelas: trimmed })
    .eq("id", kelasId)
    .select()
    .single();

  if (error) throw error;
  return data as Kelas;
}

export async function deleteKelas(kelasId: number) {
  const supabase = createClient();
  const { error } = await supabase.from("kelas").delete().eq("id", kelasId);
  if (error) throw error;
}
