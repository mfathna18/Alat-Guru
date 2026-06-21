-- Sumatif: ganti LM → STS, tanpa lingkup materi pada penilaian sumatif

UPDATE nilai
SET tipe_sumatif = 'STS', id_lingkup_materi = NULL
WHERE jenis_asesmen = 'SUMATIF' AND tipe_sumatif = 'LM';

-- Hapus duplikat setelah konsolidasi (siswa × indikator × tipe)
WITH ranked AS (
    SELECT id,
        ROW_NUMBER() OVER (
            PARTITION BY id_siswa, id_indikator, jenis_asesmen,
                COALESCE(tipe_sumatif, ''), COALESCE(id_lingkup_materi, 0)
            ORDER BY id DESC
        ) AS rn
    FROM nilai
    WHERE jenis_asesmen = 'SUMATIF'
)
DELETE FROM nilai
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

ALTER TABLE nilai DROP CONSTRAINT IF EXISTS nilai_lm_requires_lingkup;
ALTER TABLE nilai DROP CONSTRAINT IF EXISTS nilai_tipe_sumatif_check;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'nilai'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%tipe_sumatif%'
    LOOP
        EXECUTE format('ALTER TABLE nilai DROP CONSTRAINT IF EXISTS %I', r.conname);
    END LOOP;
END $$;

ALTER TABLE nilai ADD CONSTRAINT nilai_tipe_sumatif_check CHECK (
    jenis_asesmen = 'SUMATIF'
    OR (tipe_sumatif IS NULL AND id_lingkup_materi IS NULL)
);

ALTER TABLE nilai ADD CONSTRAINT nilai_tipe_sumatif_value_check CHECK (
    tipe_sumatif IS NULL OR tipe_sumatif IN ('STS', 'SAS')
);

CREATE OR REPLACE FUNCTION nilai_default_tipe_sumatif()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.jenis_asesmen = 'SUMATIF' AND NEW.tipe_sumatif IS NULL THEN
        NEW.tipe_sumatif := 'SAS';
    END IF;
    IF NEW.jenis_asesmen <> 'SUMATIF' THEN
        NEW.tipe_sumatif := NULL;
        NEW.id_lingkup_materi := NULL;
    END IF;
    IF NEW.jenis_asesmen = 'SUMATIF' THEN
        NEW.id_lingkup_materi := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
