-- Struktur mapel rapor MAN: kelompok A/B/C, nested PAI, nilai dual KI-3/KI-4
-- =============================================================================

ALTER TABLE mata_pelajaran
    ADD COLUMN IF NOT EXISTS kelompok_mapel CHAR(1) NOT NULL DEFAULT 'A'
        CHECK (kelompok_mapel IN ('A', 'B', 'C')),
    ADD COLUMN IF NOT EXISTS parent_id INT REFERENCES mata_pelajaran(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS urutan SMALLINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_group_header BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_mapel_kelompok ON mata_pelajaran(id_guru, kelompok_mapel, urutan);

ALTER TABLE rapor_mapel
    ADD COLUMN IF NOT EXISTS nilai_pengetahuan NUMERIC(5,2)
        CHECK (nilai_pengetahuan IS NULL OR (nilai_pengetahuan >= 0 AND nilai_pengetahuan <= 100)),
    ADD COLUMN IF NOT EXISTS nilai_keterampilan NUMERIC(5,2)
        CHECK (nilai_keterampilan IS NULL OR (nilai_keterampilan >= 0 AND nilai_keterampilan <= 100));

ALTER TABLE pengaturan_sekolah
    ADD COLUMN IF NOT EXISTS rapor_slogan TEXT;

COMMENT ON COLUMN mata_pelajaran.is_group_header IS
    'Baris induk tanpa nilai (mis. Pendidikan Agama Islam)';
COMMENT ON COLUMN rapor_mapel.nilai_pengetahuan IS 'KI-3 Pengetahuan';
COMMENT ON COLUMN rapor_mapel.nilai_keterampilan IS 'KI-4 Keterampilan';
