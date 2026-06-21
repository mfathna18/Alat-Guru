-- Teacher's Dashboard — Initial Schema (Kurikulum Merdeka)
-- Filosofi: Zero Redundancy — Satu Input, Multi-Output
-- Jalur data: guru → kelas → siswa / TP → indikator → nilai

-- =============================================================================
-- EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. TABEL GURU / USER UTAMA
-- =============================================================================
CREATE TABLE guru (
    id SERIAL PRIMARY KEY,
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(150) UNIQUE NOT NULL,
    nama_guru VARCHAR(150) NOT NULL,
    nip_guru VARCHAR(50),
    mata_pelajaran VARCHAR(100) DEFAULT 'Umum',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 2. TABEL PENGATURAN SEKOLAH (Metadata Dokumen & Legalitas)
-- =============================================================================
CREATE TABLE pengaturan_sekolah (
    id SERIAL PRIMARY KEY,
    id_guru INT REFERENCES guru(id) ON DELETE CASCADE,
    nama_sekolah VARCHAR(150) NOT NULL,
    logo_url TEXT,
    tahun_ajaran VARCHAR(20) NOT NULL,
    nama_kepsek VARCHAR(150) NOT NULL,
    nip_kepsek VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_pengaturan_per_guru UNIQUE (id_guru)
);

-- =============================================================================
-- 3. TABEL KELAS
-- =============================================================================
CREATE TABLE kelas (
    id SERIAL PRIMARY KEY,
    id_guru INT REFERENCES guru(id) ON DELETE CASCADE,
    nama_kelas VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_kelas_per_guru UNIQUE (id_guru, nama_kelas)
);

-- =============================================================================
-- 4. TABEL SISWA (Soft Delete & Excel Importer)
-- =============================================================================
CREATE TABLE siswa (
    id SERIAL PRIMARY KEY,
    id_kelas INT REFERENCES kelas(id) ON DELETE CASCADE,
    nisn VARCHAR(20),
    nama_siswa VARCHAR(150) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 5. TABEL TUJUAN PEMBELAJARAN (TP)
-- =============================================================================
CREATE TABLE tujuan_pembelajaran (
    id SERIAL PRIMARY KEY,
    id_kelas INT REFERENCES kelas(id) ON DELETE CASCADE,
    semester INT CHECK (semester IN (1, 2)),
    kode_tp VARCHAR(20) NOT NULL,
    deskripsi_tp TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tp_per_kelas UNIQUE (id_kelas, semester, kode_tp)
);

-- =============================================================================
-- 6. TABEL INDIKATOR KETERCAPAIAN (Anak Relasi dari TP)
-- =============================================================================
CREATE TABLE indikator (
    id SERIAL PRIMARY KEY,
    id_tp INT REFERENCES tujuan_pembelajaran(id) ON DELETE CASCADE,
    kode_indikator VARCHAR(20) NOT NULL,
    deskripsi_indikator TEXT NOT NULL,
    CONSTRAINT unique_indikator_per_tp UNIQUE (id_tp, kode_indikator)
);

-- =============================================================================
-- 7. TABEL RUBRIK PENILAIAN
-- =============================================================================
CREATE TABLE rubrik (
    id SERIAL PRIMARY KEY,
    id_tp INT REFERENCES tujuan_pembelajaran(id) ON DELETE CASCADE,
    skala_penilaian VARCHAR(30) NOT NULL CHECK (skala_penilaian IN ('ANGKA', 'SKALA_4', 'KUALITATIF')),
    kriteria_json JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_rubrik_per_tp UNIQUE (id_tp)
);

-- =============================================================================
-- 8. TABEL DATA NILAI (Inti Transaksional — UPSERT)
-- =============================================================================
CREATE TABLE nilai (
    id SERIAL PRIMARY KEY,
    id_siswa INT REFERENCES siswa(id) ON DELETE CASCADE,
    id_indikator INT REFERENCES indikator(id) ON DELETE CASCADE,
    jenis_asesmen VARCHAR(20) NOT NULL CHECK (jenis_asesmen IN ('FORMATIF', 'SUMATIF')),
    skor_angka NUMERIC(5,2),
    skor_kualitatif VARCHAR(50) CHECK (skor_kualitatif IN ('BB', 'MB', 'BSH', 'SB')),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_penilaian UNIQUE (id_siswa, id_indikator, jenis_asesmen)
);

-- =============================================================================
-- INDEXES (Performa Query Relasional)
-- =============================================================================
CREATE INDEX idx_guru_auth_user ON guru(auth_user_id);
CREATE INDEX idx_guru_email ON guru(email);

CREATE INDEX idx_pengaturan_guru ON pengaturan_sekolah(id_guru);

CREATE INDEX idx_kelas_guru ON kelas(id_guru);

CREATE INDEX idx_siswa_kelas ON siswa(id_kelas);
CREATE INDEX idx_siswa_active ON siswa(id_kelas) WHERE is_deleted = FALSE;
CREATE INDEX idx_siswa_nisn ON siswa(nisn) WHERE nisn IS NOT NULL;

CREATE INDEX idx_tp_kelas_semester ON tujuan_pembelajaran(id_kelas, semester);

CREATE INDEX idx_indikator_tp ON indikator(id_tp);

CREATE INDEX idx_rubrik_tp ON rubrik(id_tp);

CREATE INDEX idx_nilai_siswa ON nilai(id_siswa);
CREATE INDEX idx_nilai_indikator ON nilai(id_indikator);
CREATE INDEX idx_nilai_jenis ON nilai(jenis_asesmen);

-- =============================================================================
-- TRIGGERS: Auto-update timestamps
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pengaturan_sekolah_updated
    BEFORE UPDATE ON pengaturan_sekolah
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_rubrik_updated
    BEFORE UPDATE ON rubrik
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_nilai_updated
    BEFORE UPDATE ON nilai
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Soft delete: set deleted_at when is_deleted flips to TRUE
CREATE OR REPLACE FUNCTION handle_siswa_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_deleted = TRUE AND (OLD.is_deleted IS DISTINCT FROM TRUE) THEN
        NEW.deleted_at = CURRENT_TIMESTAMP;
    ELSIF NEW.is_deleted = FALSE THEN
        NEW.deleted_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_siswa_soft_delete
    BEFORE UPDATE ON siswa
    FOR EACH ROW EXECUTE FUNCTION handle_siswa_soft_delete();

-- =============================================================================
-- AUTO-PROVISION GURU on Supabase Auth signup
-- =============================================================================
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.guru (auth_user_id, email, nama_guru)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nama_guru', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (email) DO UPDATE
        SET auth_user_id = EXCLUDED.auth_user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
ALTER TABLE guru ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengaturan_sekolah ENABLE ROW LEVEL SECURITY;
ALTER TABLE kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE tujuan_pembelajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE indikator ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubrik ENABLE ROW LEVEL SECURITY;
ALTER TABLE nilai ENABLE ROW LEVEL SECURITY;

-- Helper: resolve guru.id from auth.uid()
CREATE OR REPLACE FUNCTION current_guru_id()
RETURNS INT AS $$
    SELECT id FROM guru WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE POLICY guru_select_own ON guru
    FOR SELECT USING (auth_user_id = auth.uid());
CREATE POLICY guru_update_own ON guru
    FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY pengaturan_all_own ON pengaturan_sekolah
    FOR ALL USING (id_guru = current_guru_id())
    WITH CHECK (id_guru = current_guru_id());

CREATE POLICY kelas_all_own ON kelas
    FOR ALL USING (id_guru = current_guru_id())
    WITH CHECK (id_guru = current_guru_id());

CREATE POLICY siswa_all_own ON siswa
    FOR ALL USING (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id())
    )
    WITH CHECK (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id())
    );

CREATE POLICY tp_all_own ON tujuan_pembelajaran
    FOR ALL USING (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id())
    )
    WITH CHECK (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id())
    );

CREATE POLICY indikator_all_own ON indikator
    FOR ALL USING (
        id_tp IN (
            SELECT tp.id FROM tujuan_pembelajaran tp
            JOIN kelas k ON k.id = tp.id_kelas
            WHERE k.id_guru = current_guru_id()
        )
    )
    WITH CHECK (
        id_tp IN (
            SELECT tp.id FROM tujuan_pembelajaran tp
            JOIN kelas k ON k.id = tp.id_kelas
            WHERE k.id_guru = current_guru_id()
        )
    );

CREATE POLICY rubrik_all_own ON rubrik
    FOR ALL USING (
        id_tp IN (
            SELECT tp.id FROM tujuan_pembelajaran tp
            JOIN kelas k ON k.id = tp.id_kelas
            WHERE k.id_guru = current_guru_id()
        )
    )
    WITH CHECK (
        id_tp IN (
            SELECT tp.id FROM tujuan_pembelajaran tp
            JOIN kelas k ON k.id = tp.id_kelas
            WHERE k.id_guru = current_guru_id()
        )
    );

CREATE POLICY nilai_all_own ON nilai
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

-- =============================================================================
-- STORAGE: Logo Sekolah bucket
-- =============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('logo-sekolah', 'logo-sekolah', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY logo_sekolah_read ON storage.objects
    FOR SELECT USING (bucket_id = 'logo-sekolah');

CREATE POLICY logo_sekolah_upload ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'logo-sekolah'
        AND auth.uid() IS NOT NULL
    );

CREATE POLICY logo_sekolah_update ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'logo-sekolah'
        AND auth.uid() IS NOT NULL
    );

CREATE POLICY logo_sekolah_delete ON storage.objects
    FOR DELETE USING (
        bucket_id = 'logo-sekolah'
        AND auth.uid() IS NOT NULL
    );
