export type SkalaPenilaian = "ANGKA" | "HURUF";
export type JenisAsesmen = "FORMATIF" | "SUMATIF" | "REMEDIAL" | "PENGAYAAN";
export type TipeSumatif = "STS" | "SAS";
/** Skor huruf A–E untuk input penilaian (skala HURUF) */
export type SkorHuruf = "A" | "B" | "C" | "D" | "E";
/** Predikat Kurikulum Merdeka pada rapor (BB–SB) */
export type SkorKualitatif = "BB" | "MB" | "BSH" | "SB";
export type StatusAbsensi = "H" | "I" | "S" | "A";
export type JenjangSekolah = "SD" | "SMP" | "SMA";
export type FaseKm = "A" | "B" | "C" | "D" | "E" | "F";
export type StatusRapor = "draft" | "final";
export type SumberDeskripsi = "auto" | "manual";
export type SumberKehadiran = "absensi" | "manual";

export interface Guru {
  id: number;
  auth_user_id: string | null;
  email: string;
  nama_guru: string;
  nip_guru: string | null;
  mata_pelajaran: string;
  created_at: string;
}

export interface PengaturanSekolah {
  id: number;
  id_guru: number;
  nama_sekolah: string;
  logo_url: string | null;
  tahun_ajaran: string;
  nama_kepsek: string;
  nip_kepsek: string;
  kkm_angka?: number;
  ambang_pengayaan_angka?: number;
  kkm_kualitatif?: SkorHuruf;
  ambang_pengayaan_kualitatif?: SkorHuruf;
  jenjang?: JenjangSekolah | null;
  npsn?: string | null;
  alamat_sekolah?: string | null;
  desa_kelurahan?: string | null;
  kecamatan?: string | null;
  kabupaten_kota?: string | null;
  provinsi?: string | null;
  nama_wali_kelas?: string | null;
  nip_wali_kelas?: string | null;
  /** Gambar tanda tangan wali kelas (URL Supabase Storage). */
  ttd_wali_kelas_url?: string | null;
  /** Gambar tanda tangan kepala sekolah (URL Supabase Storage). */
  ttd_kepsek_url?: string | null;
  bobot_formatif?: number;
  bobot_sumatif_lm?: number;
  bobot_sas?: number;
  rapor_tampilkan_angka?: boolean;
  rapor_tampilkan_predikat?: boolean;
  rapor_watermark_logo?: boolean;
  rapor_template_id?: string;
  rapor_slogan?: string | null;
  /** Baris instansi pada kop surat (mis. Pemerintah · Dinas Pendidikan). */
  kop_instansi?: string | null;
  updated_at: string;
}

export interface Kelas {
  id: number;
  id_guru: number;
  nama_kelas: string;
  jenjang?: JenjangSekolah | null;
  fase?: FaseKm | null;
  tingkat?: string | null;
  rombel?: string | null;
  created_at: string;
}

export interface Siswa {
  id: number;
  id_kelas: number;
  nisn: string | null;
  nis?: string | null;
  nama_siswa: string;
  jenis_kelamin?: "L" | "P" | null;
  tempat_lahir?: string | null;
  tanggal_lahir?: string | null;
  nama_ayah?: string | null;
  nama_ibu?: string | null;
  alamat?: string | null;
  anak_ke?: number | null;
  jumlah_saudara?: number | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
}

export interface TujuanPembelajaran {
  id: number;
  id_kelas: number;
  id_mata_pelajaran?: number | null;
  id_lingkup_materi?: number | null;
  semester: 1 | 2;
  kode_tp: string;
  deskripsi_tp: string;
  created_at: string;
}

export interface Indikator {
  id: number;
  id_tp: number;
  kode_indikator: string;
  deskripsi_indikator: string;
}

export interface Rubrik {
  id: number;
  id_tp: number;
  skala_penilaian: SkalaPenilaian;
  kriteria_json: Record<string, unknown> | null;
  updated_at: string;
}

export interface Nilai {
  id: number;
  id_siswa: number;
  id_indikator: number;
  jenis_asesmen: JenisAsesmen;
  tipe_sumatif?: TipeSumatif | null;
  id_lingkup_materi?: number | null;
  skor_angka: number | null;
  skor_kualitatif: SkorHuruf | null;
  updated_at: string;
}

export interface Absensi {
  id: number;
  id_siswa: number;
  tanggal: string;
  status: StatusAbsensi;
  keterangan: string | null;
  updated_at: string;
}

export interface ModulAjar {
  id: number;
  id_guru: number;
  id_kelas: number;
  id_mata_pelajaran: number;
  urutan: number;
  judul: string;
  created_at: string;
}

export interface KelasModulProgress {
  id: number;
  id_kelas: number;
  id_modul: number;
  selesai: boolean;
  updated_at: string;
}

export interface RefJenjang {
  kode: JenjangSekolah;
  nama: string;
  urutan: number;
}

export interface RefFase {
  kode: FaseKm;
  jenjang: JenjangSekolah;
  nama: string;
  tingkat_contoh: string | null;
  urutan: number;
}

export type MapelKelompok = "A" | "B" | "C" | "L";

export interface MataPelajaran {
  id: number;
  id_guru: number;
  kode_mapel: string | null;
  nama_mapel: string;
  is_default: boolean;
  is_active: boolean;
  kelompok_mapel?: MapelKelompok | null;
  parent_id?: number | null;
  urutan?: number;
  is_group_header?: boolean;
  created_at: string;
}

export interface KelasMataPelajaran {
  id: number;
  id_kelas: number;
  id_mata_pelajaran: number;
  id_guru_pengampu: number;
  created_at: string;
}

export interface LingkupMateri {
  id: number;
  id_kelas: number;
  id_mata_pelajaran: number;
  semester: 1 | 2;
  kode_lm: string;
  judul_lm: string;
  urutan: number;
  created_at: string;
}

export interface Ekstrakurikuler {
  id: number;
  id_guru: number;
  nama_ekskul: string;
  pembina: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SiswaEkstrakurikuler {
  id: number;
  id_siswa: number;
  id_ekstrakurikuler: number;
  semester: 1 | 2;
  tahun_ajaran: string;
  predikat: string | null;
  predikat_kualitatif: SkorKualitatif | null;
  deskripsi_capaian: string | null;
  updated_at: string;
}

export interface RaporKehadiran {
  id: number;
  id_siswa: number;
  semester: 1 | 2;
  tahun_ajaran: string;
  sakit: number;
  izin: number;
  tanpa_keterangan: number;
  hari_efektif: number | null;
  sumber: SumberKehadiran;
  updated_at: string;
}

export interface DimensiP5 {
  id: number;
  kode: string;
  nama: string;
  urutan: number;
}

export interface ProjekP5 {
  id: number;
  id_kelas: number;
  semester: 1 | 2;
  tema: string;
  judul_projek: string;
  deskripsi: string | null;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  created_at: string;
}

export interface SiswaP5Capaian {
  id: number;
  id_siswa: number;
  id_projek: number;
  id_dimensi: number;
  elemen: string | null;
  deskripsi_capaian: string;
  updated_at: string;
}

export interface ERapor {
  id: number;
  id_siswa: number;
  id_kelas: number;
  semester: 1 | 2;
  tahun_ajaran: string;
  jenjang: JenjangSekolah | null;
  fase: FaseKm | null;
  status: StatusRapor;
  sikap_spiritual: string | null;
  sikap_sosial: string | null;
  catatan_wali_kelas: string | null;
  tanggal_terbit: string | null;
  finalized_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RaporMapel {
  id: number;
  id_siswa: number;
  id_kelas: number;
  id_mata_pelajaran: number;
  id_guru: number;
  semester: 1 | 2;
  tahun_ajaran: string;
  nilai_formatif: number | null;
  nilai_sumatif_lm: number | null;
  nilai_sas: number | null;
  nilai_akhir: number | null;
  nilai_pengetahuan?: number | null;
  nilai_keterampilan?: number | null;
  predikat_kualitatif: SkorKualitatif | null;
  predikat_huruf: string | null;
  id_tp_tertinggi: number | null;
  id_tp_terendah: number | null;
  deskripsi_capaian: string | null;
  deskripsi_sumber: SumberDeskripsi;
  updated_at: string;
}

export interface RaporNilaiLm {
  id: number;
  id_rapor_mapel: number;
  id_lingkup_materi: number;
  nilai_lm: number;
}

/** UPSERT payload — satu baris nilai per siswa × indikator × jenis asesmen */
export interface NilaiUpsertInput {
  id_siswa: number;
  id_indikator: number;
  jenis_asesmen: JenisAsesmen;
  tipe_sumatif?: TipeSumatif | null;
  id_lingkup_materi?: number | null;
  skor_angka?: number | null;
  skor_kualitatif?: SkorHuruf | null;
}

/** Relational view: TP dengan indikator & rubrik (Zero Redundancy chain) */
export interface TpWithRelations extends TujuanPembelajaran {
  indikator: Indikator[];
  rubrik: Rubrik | null;
}

/** Relational view: Kelas dengan siswa aktif */
export interface KelasWithSiswa extends Kelas {
  siswa: Siswa[];
}

export interface Database {
  public: {
    Tables: {
      guru: {
        Row: Guru;
        Insert: Omit<Guru, "id" | "created_at"> & {
          id?: number;
          created_at?: string;
        };
        Update: Partial<Omit<Guru, "id">>;
        Relationships: [];
      };
      pengaturan_sekolah: {
        Row: PengaturanSekolah;
        Insert: Omit<PengaturanSekolah, "id" | "updated_at"> & {
          id?: number;
          updated_at?: string;
        };
        Update: Partial<Omit<PengaturanSekolah, "id">>;
        Relationships: [];
      };
      kelas: {
        Row: Kelas;
        Insert: Omit<Kelas, "id" | "created_at"> & {
          id?: number;
          created_at?: string;
        };
        Update: Partial<Omit<Kelas, "id">>;
        Relationships: [];
      };
      siswa: {
        Row: Siswa;
        Insert: Omit<Siswa, "id" | "created_at" | "is_deleted" | "deleted_at"> & {
          id?: number;
          is_deleted?: boolean;
          deleted_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<Siswa, "id">>;
        Relationships: [];
      };
      tujuan_pembelajaran: {
        Row: TujuanPembelajaran;
        Insert: Omit<TujuanPembelajaran, "id" | "created_at"> & {
          id?: number;
          created_at?: string;
        };
        Update: Partial<Omit<TujuanPembelajaran, "id">>;
        Relationships: [];
      };
      indikator: {
        Row: Indikator;
        Insert: Omit<Indikator, "id"> & { id?: number };
        Update: Partial<Omit<Indikator, "id">>;
        Relationships: [];
      };
      rubrik: {
        Row: Rubrik;
        Insert: Omit<Rubrik, "id" | "updated_at"> & {
          id?: number;
          updated_at?: string;
        };
        Update: Partial<Omit<Rubrik, "id">>;
        Relationships: [];
      };
      nilai: {
        Row: Nilai;
        Insert: Omit<Nilai, "id" | "updated_at"> & {
          id?: number;
          updated_at?: string;
        };
        Update: Partial<Omit<Nilai, "id">>;
        Relationships: [];
      };
      absensi: {
        Row: Absensi;
        Insert: Omit<Absensi, "id" | "updated_at"> & {
          id?: number;
          updated_at?: string;
        };
        Update: Partial<Omit<Absensi, "id">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
