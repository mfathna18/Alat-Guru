-- Baris instansi di kop surat (mis. Pemerintah · Dinas Pendidikan)
ALTER TABLE pengaturan_sekolah
  ADD COLUMN IF NOT EXISTS kop_instansi TEXT;

COMMENT ON COLUMN pengaturan_sekolah.kop_instansi IS
  'Teks baris instansi pada kop surat; kosong = default Pemerintah · Dinas Pendidikan';
