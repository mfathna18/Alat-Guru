-- Opsi watermark logo sekolah pada E-Rapor (default: tidak)
ALTER TABLE pengaturan_sekolah
    ADD COLUMN IF NOT EXISTS rapor_watermark_logo BOOLEAN NOT NULL DEFAULT FALSE;
