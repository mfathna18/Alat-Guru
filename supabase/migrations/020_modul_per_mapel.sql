-- Modul ajar per kelas × mata pelajaran (idempotent)
-- Termasuk langkah 013 jika id_kelas belum ada.
-- =============================================================================

-- ── 1. Pastikan kolom id_kelas ada (migration 013) ─────────────────────────

ALTER TABLE modul_ajar
    ADD COLUMN IF NOT EXISTS id_kelas INT REFERENCES kelas(id) ON DELETE CASCADE;

ALTER TABLE modul_ajar DROP CONSTRAINT IF EXISTS unique_modul_urutan_per_guru;
ALTER TABLE modul_ajar DROP CONSTRAINT IF EXISTS unique_modul_urutan_per_kelas;
ALTER TABLE modul_ajar DROP CONSTRAINT IF EXISTS unique_modul_urutan_per_kelas_mapel;

-- Bersihkan salinan migrasi 013 yang terpotong (masih ada modul global id_kelas NULL)
DELETE FROM modul_ajar target
WHERE target.id_kelas IS NOT NULL
  AND EXISTS (
      SELECT 1
      FROM modul_ajar legacy
      WHERE legacy.id_kelas IS NULL
        AND legacy.id_guru = target.id_guru
        AND legacy.urutan = target.urutan
        AND legacy.judul = target.judul
  );

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

DELETE FROM modul_ajar WHERE id_kelas IS NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'modul_ajar'
          AND column_name = 'id_kelas'
          AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE modul_ajar ALTER COLUMN id_kelas SET NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_modul_ajar_kelas ON modul_ajar(id_kelas);

-- ── 2. Kolom id_mata_pelajaran ───────────────────────────────────────────────

ALTER TABLE modul_ajar
    ADD COLUMN IF NOT EXISTS id_mata_pelajaran INT REFERENCES mata_pelajaran(id) ON DELETE CASCADE;

-- Bersihkan salinan migrasi 020 yang terpotong (kolom mapel sudah ada, masih ada modul global)
DELETE FROM modul_ajar target
WHERE target.id_kelas IS NOT NULL
  AND target.id_mata_pelajaran IS NULL
  AND EXISTS (
      SELECT 1
      FROM modul_ajar legacy
      WHERE legacy.id_kelas IS NULL
        AND legacy.id_guru = target.id_guru
        AND legacy.urutan = target.urutan
        AND legacy.judul = target.judul
  );

UPDATE modul_ajar m
SET id_mata_pelajaran = sub.default_id
FROM (
    SELECT DISTINCT ON (m2.id)
        m2.id AS modul_id,
        COALESCE(
            (
                SELECT mp.id
                FROM mata_pelajaran mp
                WHERE mp.id_guru = m2.id_guru
                  AND mp.is_active = TRUE
                  AND mp.is_group_header = FALSE
                  AND mp.is_default = TRUE
                LIMIT 1
            ),
            (
                SELECT mp.id
                FROM mata_pelajaran mp
                WHERE mp.id_guru = m2.id_guru
                  AND mp.is_active = TRUE
                  AND mp.is_group_header = FALSE
                ORDER BY mp.urutan ASC, mp.id ASC
                LIMIT 1
            )
        ) AS default_id
    FROM modul_ajar m2
    WHERE m2.id_mata_pelajaran IS NULL
) sub
WHERE m.id = sub.modul_id
  AND m.id_mata_pelajaran IS NULL
  AND sub.default_id IS NOT NULL;

DELETE FROM modul_ajar WHERE id_mata_pelajaran IS NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'modul_ajar'
          AND column_name = 'id_mata_pelajaran'
          AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE modul_ajar ALTER COLUMN id_mata_pelajaran SET NOT NULL;
    END IF;
END $$;

-- ── 3. Constraint urutan per kelas × mapel ───────────────────────────────────

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'unique_modul_urutan_per_kelas_mapel'
    ) THEN
        ALTER TABLE modul_ajar ADD CONSTRAINT unique_modul_urutan_per_kelas_mapel
            UNIQUE (id_kelas, id_mata_pelajaran, urutan);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_modul_ajar_mapel ON modul_ajar(id_mata_pelajaran);

-- ── 4. RLS policies ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS modul_ajar_insert_own ON modul_ajar;
CREATE POLICY modul_ajar_insert_own ON modul_ajar
    FOR INSERT WITH CHECK (
        id_guru = current_guru_id()
        AND guru_can_write()
        AND id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id())
        AND id_mata_pelajaran IN (
            SELECT id FROM mata_pelajaran
            WHERE id_guru = current_guru_id() AND is_active = TRUE
        )
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
