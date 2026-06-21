import type { SkorHuruf, JenjangSekolah } from "@/lib/types/database";
import { DEFAULT_KKM } from "@/lib/nilai/kkm-config";

export interface PengaturanSekolahInput {
  nama_sekolah: string;
  tahun_ajaran: string;
  nama_kepsek: string;
  nip_kepsek: string;
  logo_url?: string | null;
  kkm_angka?: number;
  ambang_pengayaan_angka?: number;
  kkm_kualitatif?: SkorHuruf;
  ambang_pengayaan_kualitatif?: SkorHuruf;
  rapor_watermark_logo?: boolean;
  kop_instansi?: string | null;
  nama_wali_kelas?: string | null;
  nip_wali_kelas?: string | null;
  ttd_wali_kelas_url?: string | null;
  ttd_kepsek_url?: string | null;
  jenjang?: JenjangSekolah | null;
}

export function validateTahunAjaran(value: string) {
  return /^\d{4}\/\d{4}$/.test(value.trim());
}

export function buildPengaturanPayload(
  idGuru: number,
  input: PengaturanSekolahInput,
) {
  return {
    id_guru: idGuru,
    nama_sekolah: input.nama_sekolah.trim(),
    tahun_ajaran: input.tahun_ajaran.trim(),
    nama_kepsek: input.nama_kepsek.trim(),
    nip_kepsek: input.nip_kepsek.trim(),
    logo_url: input.logo_url ?? null,
    kkm_angka: input.kkm_angka ?? DEFAULT_KKM.kkmAngka,
    ambang_pengayaan_angka:
      input.ambang_pengayaan_angka ?? DEFAULT_KKM.ambangPengayaanAngka,
    kkm_kualitatif: input.kkm_kualitatif ?? DEFAULT_KKM.kkmHuruf,
    ambang_pengayaan_kualitatif:
      input.ambang_pengayaan_kualitatif ?? DEFAULT_KKM.ambangPengayaanHuruf,
    rapor_watermark_logo: input.rapor_watermark_logo ?? false,
    kop_instansi: input.kop_instansi?.trim() || null,
    nama_wali_kelas: input.nama_wali_kelas?.trim() || null,
    nip_wali_kelas: input.nip_wali_kelas?.trim() || null,
    ttd_wali_kelas_url: input.ttd_wali_kelas_url ?? null,
    ttd_kepsek_url: input.ttd_kepsek_url ?? null,
    jenjang: input.jenjang ?? null,
  };
}

export function assertPengaturanPayload(payload: ReturnType<typeof buildPengaturanPayload>) {
  if (payload.kkm_angka < 0 || payload.kkm_angka > 100) {
    throw new Error("KKM angka harus antara 0–100.");
  }
  if (
    payload.ambang_pengayaan_angka < 0 ||
    payload.ambang_pengayaan_angka > 100
  ) {
    throw new Error("Ambang pengayaan harus antara 0–100.");
  }
  if (payload.ambang_pengayaan_angka <= payload.kkm_angka) {
    throw new Error("Ambang pengayaan harus lebih tinggi dari KKM.");
  }
  if (!payload.nama_sekolah) throw new Error("Nama sekolah wajib diisi.");
  if (!validateTahunAjaran(payload.tahun_ajaran)) {
    throw new Error("Tahun ajaran harus format 2025/2026.");
  }
  if (!payload.nama_kepsek) throw new Error("Nama kepala sekolah wajib diisi.");
  if (!payload.nip_kepsek) throw new Error("NIP kepala sekolah wajib diisi.");
}

export function slimOptionalPengaturanColumns<
  T extends Record<string, unknown>,
>(payload: T) {
  const {
    kop_instansi: _k,
    ttd_wali_kelas_url: _tw,
    ttd_kepsek_url: _tk,
    nama_wali_kelas: _nw,
    nip_wali_kelas: _nipw,
    ...slim
  } = payload;
  return slim;
}

export type PengaturanPayload = ReturnType<typeof buildPengaturanPayload>;
