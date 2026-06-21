-- Modul Ajar & Progress per Kelas Paralel (Anti-Lupa Selesai Materi)
-- =============================================================================

CREATE TABLE modul_ajar (
    id SERIAL PRIMARY KEY,
    id_guru INT NOT NULL REFERENCES guru(id) ON DELETE CASCADE,
    urutan INT NOT NULL CHECK (urutan > 0),
    judul VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_modul_urutan_per_guru UNIQUE (id_guru, urutan)
);

CREATE TABLE kelas_modul_progress (
    id SERIAL PRIMARY KEY,
    id_kelas INT NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    id_modul INT NOT NULL REFERENCES modul_ajar(id) ON DELETE CASCADE,
    selesai BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_kelas_modul UNIQUE (id_kelas, id_modul)
);

CREATE INDEX idx_modul_ajar_guru ON modul_ajar(id_guru);
CREATE INDEX idx_kelas_modul_progress_kelas ON kelas_modul_progress(id_kelas);
CREATE INDEX idx_kelas_modul_progress_modul ON kelas_modul_progress(id_modul);

CREATE TRIGGER trg_kelas_modul_progress_updated
    BEFORE UPDATE ON kelas_modul_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE modul_ajar ENABLE ROW LEVEL SECURITY;
ALTER TABLE kelas_modul_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY modul_ajar_all_own ON modul_ajar
    FOR ALL USING (id_guru = current_guru_id())
    WITH CHECK (id_guru = current_guru_id());

CREATE POLICY kelas_modul_progress_all_own ON kelas_modul_progress
    FOR ALL USING (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id())
    )
    WITH CHECK (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id())
    );
