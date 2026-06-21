-- Tanda tangan gambar untuk Wali Kelas & Kepala Sekolah pada rapor/dokumen
ALTER TABLE pengaturan_sekolah
  ADD COLUMN IF NOT EXISTS ttd_wali_kelas_url TEXT,
  ADD COLUMN IF NOT EXISTS ttd_kepsek_url TEXT;
