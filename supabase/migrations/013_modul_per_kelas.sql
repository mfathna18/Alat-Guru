-- Modul ajar per kelas (bukan global per guru)
-- =============================================================================

ALTER TABLE modul_ajar ADD COLUMN IF NOT EXISTS id_kelas INT REFERENCES kelas(id) ON DELETE CASCADE;

ALTER TABLE modul_ajar DROP CONSTRAINT IF EXISTS unique_modul_urutan_per_guru;

-- Salin modul global lama ke setiap kelas milik guru yang sama
DO $$
DECLARE
    rec RECORD;
    k RECORD;
    new_id INT;
BEGIN
    FOR rec IN
        SELECT m.* FROM modul_ajar m WHERE m.id_kelas IS NULL
    LOOP
        FOR k IN
            SELECT id FROM kelas WHERE id_guru = rec.id_guru
        LOOP
            INSERT INTO modul_ajar (id_guru, id_kelas, urutan, judul)
            VALUES (rec.id_guru, k.id, rec.urutan, rec.judul)
            RETURNING id INTO new_id;

            UPDATE kelas_modul_progress
            SET id_modul = new_id
            WHERE id_modul = rec.id AND id_kelas = k.id;
        END LOOP;

        DELETE FROM kelas_modul_progress WHERE id_modul = rec.id;
        DELETE FROM modul_ajar WHERE id = rec.id;
    END LOOP;
END $$;

ALTER TABLE modul_ajar ALTER COLUMN id_kelas SET NOT NULL;

ALTER TABLE modul_ajar DROP CONSTRAINT IF EXISTS unique_modul_urutan_per_guru;
ALTER TABLE modul_ajar ADD CONSTRAINT unique_modul_urutan_per_kelas UNIQUE (id_kelas, urutan);

CREATE INDEX IF NOT EXISTS idx_modul_ajar_kelas ON modul_ajar(id_kelas);

DROP POLICY IF EXISTS modul_ajar_insert_own ON modul_ajar;
CREATE POLICY modul_ajar_insert_own ON modul_ajar
    FOR INSERT WITH CHECK (
        id_guru = current_guru_id()
        AND guru_can_write()
        AND id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id())
    );

DROP POLICY IF EXISTS modul_ajar_update_own ON modul_ajar;
CREATE POLICY modul_ajar_update_own ON modul_ajar
    FOR UPDATE USING (
        id_guru = current_guru_id()
        AND guru_can_write()
        AND id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id())
    );

DROP POLICY IF EXISTS modul_ajar_delete_own ON modul_ajar;
CREATE POLICY modul_ajar_delete_own ON modul_ajar
    FOR DELETE USING (
        id_guru = current_guru_id()
        AND guru_can_write()
        AND id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id())
    );
