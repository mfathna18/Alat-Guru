import { createClient } from "@/lib/supabase/server";
import type { Guru, PengaturanSekolah } from "@/lib/types/database";

export interface DashboardSummary {
  guru: Guru | null;
  email: string;
  stats: {
    totalKelas: number;
    totalSiswaAktif: number;
    hasPengaturanSekolah: boolean;
    tahunAjaran: string | null;
    namaSekolah: string | null;
  };
  pengaturan: PengaturanSekolah | null;
}

export async function getDashboardSummary(): Promise<DashboardSummary | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const { data: guru } = await supabase
    .from("guru")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const guruId = guru?.id;

  const [kelasRes, pengaturanRes] = await Promise.all([
    guruId
      ? supabase.from("kelas").select("id", { count: "exact", head: true }).eq("id_guru", guruId)
      : Promise.resolve({ count: 0 }),
    guruId
      ? supabase.from("pengaturan_sekolah").select("*").eq("id_guru", guruId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  let totalSiswaAktif = 0;
  if (guruId) {
    const { data: kelasList } = await supabase
      .from("kelas")
      .select("id")
      .eq("id_guru", guruId);

    const kelasIds = kelasList?.map((k) => k.id) ?? [];
    if (kelasIds.length > 0) {
      const { count } = await supabase
        .from("siswa")
        .select("id", { count: "exact", head: true })
        .in("id_kelas", kelasIds)
        .eq("is_deleted", false);
      totalSiswaAktif = count ?? 0;
    }
  }

  const pengaturan = pengaturanRes.data as PengaturanSekolah | null;

  return {
    guru: guru as Guru | null,
    email: user.email,
    pengaturan,
    stats: {
      totalKelas: kelasRes.count ?? 0,
      totalSiswaAktif,
      hasPengaturanSekolah: Boolean(pengaturan),
      tahunAjaran: pengaturan?.tahun_ajaran ?? null,
      namaSekolah: pengaturan?.nama_sekolah ?? null,
    },
  };
}
