-- Remedial & Pengayaan — KKM + jenis asesmen REMEDIAL/PENGAYAAN
-- =============================================================================

-- Kriteria Ketuntasan Minimum (KKM) di pengaturan sekolah
ALTER TABLE pengaturan_sekolah
    ADD COLUMN IF NOT EXISTS kkm_angka SMALLINT NOT NULL DEFAULT 70
        CHECK (kkm_angka BETWEEN 0 AND 100),
    ADD COLUMN IF NOT EXISTS ambang_pengayaan_angka SMALLINT NOT NULL DEFAULT 85
        CHECK (ambang_pengayaan_angka BETWEEN 0 AND 100),
    ADD COLUMN IF NOT EXISTS kkm_kualitatif VARCHAR(10) NOT NULL DEFAULT 'BSH'
        CHECK (kkm_kualitatif IN ('BB', 'MB', 'BSH', 'SB')),
    ADD COLUMN IF NOT EXISTS ambang_pengayaan_kualitatif VARCHAR(10) NOT NULL DEFAULT 'SB'
        CHECK (ambang_pengayaan_kualitatif IN ('BB', 'MB', 'BSH', 'SB'));

-- Perluas jenis asesmen: FORMATIF, SUMATIF, REMEDIAL, PENGAYAAN
ALTER TABLE nilai DROP CONSTRAINT IF EXISTS nilai_jenis_asesmen_check;
ALTER TABLE nilai ADD CONSTRAINT nilai_jenis_asesmen_check
    CHECK (jenis_asesmen IN ('FORMATIF', 'SUMATIF', 'REMEDIAL', 'PENGAYAAN'));
