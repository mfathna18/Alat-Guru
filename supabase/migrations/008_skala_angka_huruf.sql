-- Skala penilaian: Angka 1–100 dan Huruf A–E (ganti KUALITATIF BB–SB & SKALA_4)
-- =============================================================================

-- Rubrik: hanya ANGKA atau HURUF
UPDATE rubrik SET skala_penilaian = 'HURUF' WHERE skala_penilaian = 'KUALITATIF';
UPDATE rubrik SET skala_penilaian = 'ANGKA' WHERE skala_penilaian = 'SKALA_4';

ALTER TABLE rubrik DROP CONSTRAINT IF EXISTS rubrik_skala_penilaian_check;
ALTER TABLE rubrik ADD CONSTRAINT rubrik_skala_penilaian_check
    CHECK (skala_penilaian IN ('ANGKA', 'HURUF'));

-- Nilai: skor huruf A–E (input penilaian)
UPDATE nilai SET skor_kualitatif = 'E' WHERE skor_kualitatif = 'BB';
UPDATE nilai SET skor_kualitatif = 'D' WHERE skor_kualitatif = 'MB';
UPDATE nilai SET skor_kualitatif = 'C' WHERE skor_kualitatif = 'BSH';
UPDATE nilai SET skor_kualitatif = 'B' WHERE skor_kualitatif = 'SB';

ALTER TABLE nilai DROP CONSTRAINT IF EXISTS nilai_skor_kualitatif_check;
ALTER TABLE nilai ADD CONSTRAINT nilai_skor_kualitatif_check
    CHECK (skor_kualitatif IS NULL OR skor_kualitatif IN ('A', 'B', 'C', 'D', 'E'));

-- KKM huruf di pengaturan (kolom kkm_kualitatif tetap dipakai)
UPDATE pengaturan_sekolah SET kkm_kualitatif = 'C' WHERE kkm_kualitatif IN ('BSH', 'MB', 'BB');
UPDATE pengaturan_sekolah SET ambang_pengayaan_kualitatif = 'A'
    WHERE ambang_pengayaan_kualitatif IN ('SB', 'BSH');

ALTER TABLE pengaturan_sekolah DROP CONSTRAINT IF EXISTS pengaturan_sekolah_kkm_kualitatif_check;
ALTER TABLE pengaturan_sekolah DROP CONSTRAINT IF EXISTS pengaturan_sekolah_ambang_pengayaan_kualitatif_check;
ALTER TABLE pengaturan_sekolah ADD CONSTRAINT pengaturan_sekolah_kkm_kualitatif_check
    CHECK (kkm_kualitatif IN ('A', 'B', 'C', 'D', 'E'));
ALTER TABLE pengaturan_sekolah ADD CONSTRAINT pengaturan_sekolah_ambang_pengayaan_kualitatif_check
    CHECK (ambang_pengayaan_kualitatif IN ('A', 'B', 'C', 'D', 'E'));

ALTER TABLE pengaturan_sekolah ALTER COLUMN kkm_kualitatif SET DEFAULT 'C';
ALTER TABLE pengaturan_sekolah ALTER COLUMN ambang_pengayaan_kualitatif SET DEFAULT 'A';
