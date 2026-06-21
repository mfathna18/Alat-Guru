-- Perbaikan upsert nilai — constraint kolom biasa (kompatibel Supabase ON CONFLICT)
-- =============================================================================

DROP INDEX IF EXISTS unique_penilaian_v2;

ALTER TABLE nilai DROP CONSTRAINT IF EXISTS unique_nilai_row;

ALTER TABLE nilai
    ADD CONSTRAINT unique_nilai_row UNIQUE NULLS NOT DISTINCT (
        id_siswa,
        id_indikator,
        jenis_asesmen,
        tipe_sumatif,
        id_lingkup_materi
    );
