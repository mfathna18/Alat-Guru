import { createClient } from "@/lib/supabase/client";
import type { Guru } from "@/lib/types/database";

import { fetchCurrentGuru } from "./kelas";

export { fetchCurrentGuru };

export interface GuruProfileInput {
  nama_guru: string;
  nip_guru?: string | null;
  mata_pelajaran: string;
}

export async function updateGuruProfile(
  input: GuruProfileInput,
): Promise<Guru> {
  const guru = await fetchCurrentGuru();
  const supabase = createClient();

  const nama = input.nama_guru.trim();
  if (!nama) throw new Error("Nama guru wajib diisi.");

  const mapel = input.mata_pelajaran.trim() || "Umum";

  const { data, error } = await supabase
    .from("guru")
    .update({
      nama_guru: nama,
      nip_guru: input.nip_guru?.trim() || null,
      mata_pelajaran: mapel,
    })
    .eq("id", guru.id)
    .select()
    .single();

  if (error) throw error;
  return data as Guru;
}
