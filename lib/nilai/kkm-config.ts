import type { PengaturanSekolah, SkorHuruf } from "@/lib/types/database";

export interface KkmConfig {
  kkmAngka: number;
  ambangPengayaanAngka: number;
  kkmHuruf: SkorHuruf;
  ambangPengayaanHuruf: SkorHuruf;
}

export const DEFAULT_KKM: KkmConfig = {
  kkmAngka: 70,
  ambangPengayaanAngka: 85,
  kkmHuruf: "C",
  ambangPengayaanHuruf: "A",
};

export function kkmFromPengaturan(
  pengaturan: PengaturanSekolah | null | undefined,
): KkmConfig {
  if (!pengaturan) return DEFAULT_KKM;
  return {
    kkmAngka: pengaturan.kkm_angka ?? DEFAULT_KKM.kkmAngka,
    ambangPengayaanAngka:
      pengaturan.ambang_pengayaan_angka ?? DEFAULT_KKM.ambangPengayaanAngka,
    kkmHuruf: pengaturan.kkm_kualitatif ?? DEFAULT_KKM.kkmHuruf,
    ambangPengayaanHuruf:
      pengaturan.ambang_pengayaan_kualitatif ??
      DEFAULT_KKM.ambangPengayaanHuruf,
  };
}
