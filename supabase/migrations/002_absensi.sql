-- =============================================================================
-- ABSENSI HARIAN SISWA
-- =============================================================================
CREATE TABLE absensi (
    id SERIAL PRIMARY KEY,
    id_siswa INT NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('H', 'I', 'S', 'A')),
    keterangan TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_absensi_per_hari UNIQUE (id_siswa, tanggal)
);

CREATE INDEX idx_absensi_siswa_tanggal ON absensi(id_siswa, tanggal);
CREATE INDEX idx_absensi_tanggal ON absensi(tanggal);

CREATE TRIGGER trg_absensi_updated
    BEFORE UPDATE ON absensi
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE absensi ENABLE ROW LEVEL SECURITY;

CREATE POLICY absensi_all_own ON absensi
    FOR ALL USING (
        id_siswa IN (
            SELECT s.id FROM siswa s
            JOIN kelas k ON k.id = s.id_kelas
            WHERE k.id_guru = current_guru_id()
        )
    )
    WITH CHECK (
        id_siswa IN (
            SELECT s.id FROM siswa s
            JOIN kelas k ON k.id = s.id_kelas
            WHERE k.id_guru = current_guru_id()
        )
    );
