-- Sikap spiritual & sosial — satu deskripsi (disimpan di sikap_spiritual)

ALTER TABLE e_rapor
    ADD COLUMN IF NOT EXISTS sikap_spiritual TEXT,
    ADD COLUMN IF NOT EXISTS sikap_sosial TEXT;

COMMENT ON COLUMN e_rapor.sikap_spiritual IS 'Deskripsi sikap spiritual dan sosial (gabungan)';
COMMENT ON COLUMN e_rapor.sikap_sosial IS 'Legacy — tidak dipakai; gunakan sikap_spiritual';
