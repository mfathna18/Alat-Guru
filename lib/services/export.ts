import { createClient } from "@/lib/supabase/client";
import { fetchCurrentGuru } from "@/lib/services/kelas";
import { fetchPenilaianWorkspace } from "@/lib/services/penilaian";
import { fetchPengaturanSekolah } from "@/lib/services/pengaturan";
import type { JenisAsesmen } from "@/lib/types/database";

export async function fetchRekapExportData(
  kelasId: number,
  kelasNama: string,
  semester: 1 | 2,
  jenisAsesmen: JenisAsesmen,
  mapelId: number,
  defaultMapelId?: number | null,
) {
  const supabase = createClient();
  const [guru, pengaturan, workspace, mapelRes] = await Promise.all([
    fetchCurrentGuru(),
    fetchPengaturanSekolah(),
    fetchPenilaianWorkspace(
      kelasId,
      semester,
      jenisAsesmen,
      mapelId,
      defaultMapelId,
    ),
    supabase
      .from("mata_pelajaran")
      .select("nama_mapel")
      .eq("id", mapelId)
      .maybeSingle(),
  ]);

  if (mapelRes.error) throw mapelRes.error;

  return {
    guru,
    pengaturan,
    kelasNama,
    semester,
    jenisAsesmen,
    mapelNama: mapelRes.data?.nama_mapel ?? "Mapel",
    workspace,
  };
}
