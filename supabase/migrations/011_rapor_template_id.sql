-- Template rapor default per sekolah
ALTER TABLE pengaturan_sekolah
    ADD COLUMN IF NOT EXISTS rapor_template_id VARCHAR(40) NOT NULL DEFAULT 'km-default';
