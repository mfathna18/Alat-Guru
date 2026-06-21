-- E-Rapor Kurikulum Merdeka — SD/SMP/SMA, multi-mapel, skala angka + predikat
-- Migration 007 — Zero Redundancy: nilai/indikator/TP tetap sumber kebenaran
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A. REFERENSI JENJANG & FASE (A–F)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ref_jenjang (
    kode VARCHAR(5) PRIMARY KEY,
    nama VARCHAR(50) NOT NULL,
    urutan SMALLINT NOT NULL
);

CREATE TABLE IF NOT EXISTS ref_fase (
    kode VARCHAR(5) PRIMARY KEY,
    jenjang VARCHAR(5) NOT NULL REFERENCES ref_jenjang(kode),
    nama VARCHAR(80) NOT NULL,
    tingkat_contoh VARCHAR(30),
    urutan SMALLINT NOT NULL
);

INSERT INTO ref_jenjang (kode, nama, urutan) VALUES
    ('SD',  'Sekolah Dasar', 1),
    ('SMP', 'Sekolah Menengah Pertama', 2),
    ('SMA', 'Sekolah Menengah Atas', 3)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO ref_fase (kode, jenjang, nama, tingkat_contoh, urutan) VALUES
    ('A', 'SD',  'Fase A — Kelas 1–2 SD',  '1–2', 1),
    ('B', 'SD',  'Fase B — Kelas 3–4 SD',  '3–4', 2),
    ('C', 'SD',  'Fase C — Kelas 5–6 SD',  '5–6', 3),
    ('D', 'SMP', 'Fase D — Kelas 7–9 SMP', '7–9', 4),
    ('E', 'SMP', 'Fase E — (alias D SMP)', '7–9', 5),
    ('F', 'SMA', 'Fase F — Kelas 10–12 SMA', '10–12', 6)
ON CONFLICT (kode) DO NOTHING;

-- -----------------------------------------------------------------------------
-- B. PERLUAS TABEL EXISTING
-- -----------------------------------------------------------------------------

-- B1. Pengaturan sekolah — header rapor, jenjang default, bobot NA, tampilan skala
ALTER TABLE pengaturan_sekolah
    ADD COLUMN IF NOT EXISTS jenjang VARCHAR(5) REFERENCES ref_jenjang(kode),
    ADD COLUMN IF NOT EXISTS npsn VARCHAR(20),
    ADD COLUMN IF NOT EXISTS alamat_sekolah TEXT,
    ADD COLUMN IF NOT EXISTS desa_kelurahan VARCHAR(100),
    ADD COLUMN IF NOT EXISTS kecamatan VARCHAR(100),
    ADD COLUMN IF NOT EXISTS kabupaten_kota VARCHAR(100),
    ADD COLUMN IF NOT EXISTS provinsi VARCHAR(100),
    ADD COLUMN IF NOT EXISTS nama_wali_kelas VARCHAR(150),
    ADD COLUMN IF NOT EXISTS nip_wali_kelas VARCHAR(50),
    ADD COLUMN IF NOT EXISTS bobot_formatif SMALLINT NOT NULL DEFAULT 30
        CHECK (bobot_formatif BETWEEN 0 AND 100),
    ADD COLUMN IF NOT EXISTS bobot_sumatif_lm SMALLINT NOT NULL DEFAULT 40
        CHECK (bobot_sumatif_lm BETWEEN 0 AND 100),
    ADD COLUMN IF NOT EXISTS bobot_sas SMALLINT NOT NULL DEFAULT 30
        CHECK (bobot_sas BETWEEN 0 AND 100),
    ADD COLUMN IF NOT EXISTS rapor_tampilkan_angka BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS rapor_tampilkan_predikat BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE pengaturan_sekolah DROP CONSTRAINT IF EXISTS pengaturan_bobot_sum_check;
ALTER TABLE pengaturan_sekolah ADD CONSTRAINT pengaturan_bobot_sum_check
    CHECK (bobot_formatif + bobot_sumatif_lm + bobot_sas = 100);

-- B2. Kelas — jenjang, fase, tingkat, rombel
ALTER TABLE kelas
    ADD COLUMN IF NOT EXISTS jenjang VARCHAR(5) REFERENCES ref_jenjang(kode),
    ADD COLUMN IF NOT EXISTS fase VARCHAR(5) REFERENCES ref_fase(kode),
    ADD COLUMN IF NOT EXISTS tingkat VARCHAR(10),
    ADD COLUMN IF NOT EXISTS rombel VARCHAR(20);

-- B3. Siswa — biodata rapor
ALTER TABLE siswa
    ADD COLUMN IF NOT EXISTS nis VARCHAR(30),
    ADD COLUMN IF NOT EXISTS jenis_kelamin VARCHAR(1)
        CHECK (jenis_kelamin IS NULL OR jenis_kelamin IN ('L', 'P')),
    ADD COLUMN IF NOT EXISTS tempat_lahir VARCHAR(100),
    ADD COLUMN IF NOT EXISTS tanggal_lahir DATE,
    ADD COLUMN IF NOT EXISTS nama_ayah VARCHAR(150),
    ADD COLUMN IF NOT EXISTS nama_ibu VARCHAR(150),
    ADD COLUMN IF NOT EXISTS alamat TEXT,
    ADD COLUMN IF NOT EXISTS anak_ke SMALLINT CHECK (anak_ke IS NULL OR anak_ke > 0),
    ADD COLUMN IF NOT EXISTS jumlah_saudara SMALLINT CHECK (jumlah_saudara IS NULL OR jumlah_saudara >= 0);

CREATE INDEX IF NOT EXISTS idx_siswa_nis ON siswa(nis) WHERE nis IS NOT NULL;

-- -----------------------------------------------------------------------------
-- C. MULTI-MATA PELAJARAN
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS mata_pelajaran (
    id SERIAL PRIMARY KEY,
    id_guru INT NOT NULL REFERENCES guru(id) ON DELETE CASCADE,
    kode_mapel VARCHAR(30),
    nama_mapel VARCHAR(100) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_mapel_per_guru UNIQUE (id_guru, nama_mapel)
);

CREATE INDEX IF NOT EXISTS idx_mapel_guru ON mata_pelajaran(id_guru);

-- Mapel yang diajarkan di kelas tertentu (multi-mapel per kelas)
CREATE TABLE IF NOT EXISTS kelas_mata_pelajaran (
    id SERIAL PRIMARY KEY,
    id_kelas INT NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    id_mata_pelajaran INT NOT NULL REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
    id_guru_pengampu INT NOT NULL REFERENCES guru(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_kelas_mapel UNIQUE (id_kelas, id_mata_pelajaran)
);

CREATE INDEX IF NOT EXISTS idx_kelas_mapel_kelas ON kelas_mata_pelajaran(id_kelas);

-- Backfill: buat mapel default dari guru.mata_pelajaran
INSERT INTO mata_pelajaran (id_guru, nama_mapel, is_default, is_active)
SELECT g.id, g.mata_pelajaran, TRUE, TRUE
FROM guru g
WHERE g.mata_pelajaran IS NOT NULL AND TRIM(g.mata_pelajaran) <> ''
ON CONFLICT (id_guru, nama_mapel) DO UPDATE SET is_default = TRUE;

-- Hubungkan semua kelas existing ke mapel default guru
INSERT INTO kelas_mata_pelajaran (id_kelas, id_mata_pelajaran, id_guru_pengampu)
SELECT k.id, mp.id, k.id_guru
FROM kelas k
JOIN mata_pelajaran mp ON mp.id_guru = k.id_guru AND mp.is_default = TRUE
ON CONFLICT (id_kelas, id_mata_pelajaran) DO NOTHING;

-- -----------------------------------------------------------------------------
-- D. LINGKUP MATERI & SUMATIF LM / SAS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS lingkup_materi (
    id SERIAL PRIMARY KEY,
    id_kelas INT NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    id_mata_pelajaran INT NOT NULL REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
    semester INT NOT NULL CHECK (semester IN (1, 2)),
    kode_lm VARCHAR(20) NOT NULL,
    judul_lm VARCHAR(200) NOT NULL,
    urutan SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_lm_per_kelas_mapel UNIQUE (id_kelas, id_mata_pelajaran, semester, kode_lm)
);

CREATE INDEX IF NOT EXISTS idx_lm_kelas_semester ON lingkup_materi(id_kelas, semester);

ALTER TABLE tujuan_pembelajaran
    ADD COLUMN IF NOT EXISTS id_mata_pelajaran INT REFERENCES mata_pelajaran(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS id_lingkup_materi INT REFERENCES lingkup_materi(id) ON DELETE SET NULL;

-- Backfill TP → mapel default kelas
UPDATE tujuan_pembelajaran tp
SET id_mata_pelajaran = mp.id
FROM kelas k
JOIN mata_pelajaran mp ON mp.id_guru = k.id_guru AND mp.is_default = TRUE
WHERE tp.id_kelas = k.id AND tp.id_mata_pelajaran IS NULL;

-- Perluas nilai: pisah Sumatif LM vs SAS
ALTER TABLE nilai
    ADD COLUMN IF NOT EXISTS tipe_sumatif VARCHAR(10)
        CHECK (tipe_sumatif IS NULL OR tipe_sumatif IN ('LM', 'SAS')),
    ADD COLUMN IF NOT EXISTS id_lingkup_materi INT REFERENCES lingkup_materi(id) ON DELETE SET NULL;

-- Backfill sumatif lama sebagai SAS
UPDATE nilai SET tipe_sumatif = 'SAS'
WHERE jenis_asesmen = 'SUMATIF' AND tipe_sumatif IS NULL;

-- Default SAS untuk insert SUMATIF baru tanpa tipe (backward compatible)
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
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_nilai_default_tipe_sumatif ON nilai;
CREATE TRIGGER trg_nilai_default_tipe_sumatif
    BEFORE INSERT OR UPDATE ON nilai
    FOR EACH ROW EXECUTE FUNCTION nilai_default_tipe_sumatif();

ALTER TABLE nilai DROP CONSTRAINT IF EXISTS unique_penilaian;
DROP INDEX IF EXISTS unique_penilaian_v2;
CREATE UNIQUE INDEX unique_penilaian_v2 ON nilai (
    id_siswa,
    id_indikator,
    jenis_asesmen,
    COALESCE(tipe_sumatif, ''),
    COALESCE(id_lingkup_materi, 0)
);

-- Validasi: non-sumatif tidak boleh punya tipe/lingkup
ALTER TABLE nilai DROP CONSTRAINT IF EXISTS nilai_tipe_sumatif_check;
ALTER TABLE nilai ADD CONSTRAINT nilai_tipe_sumatif_check CHECK (
    jenis_asesmen = 'SUMATIF'
    OR (tipe_sumatif IS NULL AND id_lingkup_materi IS NULL)
);

ALTER TABLE nilai DROP CONSTRAINT IF EXISTS nilai_lm_requires_lingkup;
ALTER TABLE nilai ADD CONSTRAINT nilai_lm_requires_lingkup CHECK (
    tipe_sumatif IS DISTINCT FROM 'LM'
    OR id_lingkup_materi IS NOT NULL
);

-- -----------------------------------------------------------------------------
-- E. EKSTRAKURIKULER
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ekstrakurikuler (
    id SERIAL PRIMARY KEY,
    id_guru INT NOT NULL REFERENCES guru(id) ON DELETE CASCADE,
    nama_ekskul VARCHAR(100) NOT NULL,
    pembina VARCHAR(150),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_ekskul_per_guru UNIQUE (id_guru, nama_ekskul)
);

CREATE TABLE IF NOT EXISTS siswa_ekstrakurikuler (
    id SERIAL PRIMARY KEY,
    id_siswa INT NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
    id_ekstrakurikuler INT NOT NULL REFERENCES ekstrakurikuler(id) ON DELETE CASCADE,
    semester INT NOT NULL CHECK (semester IN (1, 2)),
    tahun_ajaran VARCHAR(20) NOT NULL,
    predikat VARCHAR(30),
    predikat_kualitatif VARCHAR(10)
        CHECK (predikat_kualitatif IS NULL OR predikat_kualitatif IN ('BB', 'MB', 'BSH', 'SB')),
    deskripsi_capaian TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_siswa_ekskul UNIQUE (id_siswa, id_ekstrakurikuler, semester, tahun_ajaran)
);

DROP TRIGGER IF EXISTS trg_siswa_ekskul_updated ON siswa_ekstrakurikuler;
CREATE TRIGGER trg_siswa_ekskul_updated
    BEFORE UPDATE ON siswa_ekstrakurikuler
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- F. KEHADIRAN RAPOR (agregat semester)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS rapor_kehadiran (
    id SERIAL PRIMARY KEY,
    id_siswa INT NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
    semester INT NOT NULL CHECK (semester IN (1, 2)),
    tahun_ajaran VARCHAR(20) NOT NULL,
    sakit SMALLINT NOT NULL DEFAULT 0 CHECK (sakit >= 0),
    izin SMALLINT NOT NULL DEFAULT 0 CHECK (izin >= 0),
    tanpa_keterangan SMALLINT NOT NULL DEFAULT 0 CHECK (tanpa_keterangan >= 0),
    hari_efektif SMALLINT CHECK (hari_efektif IS NULL OR hari_efektif > 0),
    sumber VARCHAR(20) NOT NULL DEFAULT 'absensi'
        CHECK (sumber IN ('absensi', 'manual')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_kehadiran_rapor UNIQUE (id_siswa, semester, tahun_ajaran)
);

DROP TRIGGER IF EXISTS trg_rapor_kehadiran_updated ON rapor_kehadiran;
CREATE TRIGGER trg_rapor_kehadiran_updated
    BEFORE UPDATE ON rapor_kehadiran
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- G. P5 — PROJEK PENGUATAN PROFIL PELAJAR PANCASILA
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS dimensi_p5 (
    id SMALLINT PRIMARY KEY,
    kode VARCHAR(10) NOT NULL UNIQUE,
    nama VARCHAR(120) NOT NULL,
    urutan SMALLINT NOT NULL
);

INSERT INTO dimensi_p5 (id, kode, nama, urutan) VALUES
    (1, 'D1', 'Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia', 1),
    (2, 'D2', 'Berkebinekaan Global', 2),
    (3, 'D3', 'Bergotong Royong', 3),
    (4, 'D4', 'Mandiri', 4),
    (5, 'D5', 'Bernalar Kritis', 5),
    (6, 'D6', 'Kreatif', 6)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS projek_p5 (
    id SERIAL PRIMARY KEY,
    id_kelas INT NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    semester INT NOT NULL CHECK (semester IN (1, 2)),
    tema VARCHAR(200) NOT NULL,
    judul_projek VARCHAR(200) NOT NULL,
    deskripsi TEXT,
    tanggal_mulai DATE,
    tanggal_selesai DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projek_p5_kelas ON projek_p5(id_kelas, semester);

CREATE TABLE IF NOT EXISTS siswa_p5_capaian (
    id SERIAL PRIMARY KEY,
    id_siswa INT NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
    id_projek INT NOT NULL REFERENCES projek_p5(id) ON DELETE CASCADE,
    id_dimensi SMALLINT NOT NULL REFERENCES dimensi_p5(id),
    elemen VARCHAR(200),
    deskripsi_capaian TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_siswa_p5_dimensi UNIQUE (id_siswa, id_projek, id_dimensi)
);

DROP TRIGGER IF EXISTS trg_siswa_p5_updated ON siswa_p5_capaian;
CREATE TRIGGER trg_siswa_p5_updated
    BEFORE UPDATE ON siswa_p5_capaian
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- H. INTI E-RAPOR — NA angka + predikat, deskripsi capaian
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS e_rapor (
    id SERIAL PRIMARY KEY,
    id_siswa INT NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
    id_kelas INT NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    semester INT NOT NULL CHECK (semester IN (1, 2)),
    tahun_ajaran VARCHAR(20) NOT NULL,
    jenjang VARCHAR(5) REFERENCES ref_jenjang(kode),
    fase VARCHAR(5) REFERENCES ref_fase(kode),
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'final')),
    catatan_wali_kelas TEXT,
    tanggal_terbit DATE,
    finalized_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_e_rapor UNIQUE (id_siswa, semester, tahun_ajaran)
);

DROP TRIGGER IF EXISTS trg_e_rapor_updated ON e_rapor;
CREATE TRIGGER trg_e_rapor_updated
    BEFORE UPDATE ON e_rapor
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS rapor_mapel (
    id SERIAL PRIMARY KEY,
    id_siswa INT NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
    id_kelas INT NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    id_mata_pelajaran INT NOT NULL REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
    id_guru INT NOT NULL REFERENCES guru(id) ON DELETE CASCADE,
    semester INT NOT NULL CHECK (semester IN (1, 2)),
    tahun_ajaran VARCHAR(20) NOT NULL,
    nilai_formatif NUMERIC(5,2) CHECK (nilai_formatif IS NULL OR (nilai_formatif >= 0 AND nilai_formatif <= 100)),
    nilai_sumatif_lm NUMERIC(5,2) CHECK (nilai_sumatif_lm IS NULL OR (nilai_sumatif_lm >= 0 AND nilai_sumatif_lm <= 100)),
    nilai_sas NUMERIC(5,2) CHECK (nilai_sas IS NULL OR (nilai_sas >= 0 AND nilai_sas <= 100)),
    nilai_akhir NUMERIC(5,2) CHECK (nilai_akhir IS NULL OR (nilai_akhir >= 0 AND nilai_akhir <= 100)),
    predikat_kualitatif VARCHAR(10)
        CHECK (predikat_kualitatif IS NULL OR predikat_kualitatif IN ('BB', 'MB', 'BSH', 'SB')),
    predikat_huruf VARCHAR(30),
    id_tp_tertinggi INT REFERENCES tujuan_pembelajaran(id) ON DELETE SET NULL,
    id_tp_terendah INT REFERENCES tujuan_pembelajaran(id) ON DELETE SET NULL,
    deskripsi_capaian TEXT,
    deskripsi_sumber VARCHAR(20) NOT NULL DEFAULT 'auto'
        CHECK (deskripsi_sumber IN ('auto', 'manual')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_rapor_mapel UNIQUE (id_siswa, id_mata_pelajaran, semester, tahun_ajaran)
);

CREATE INDEX IF NOT EXISTS idx_rapor_mapel_siswa ON rapor_mapel(id_siswa, semester, tahun_ajaran);
CREATE INDEX IF NOT EXISTS idx_rapor_mapel_guru ON rapor_mapel(id_guru);

DROP TRIGGER IF EXISTS trg_rapor_mapel_updated ON rapor_mapel;
CREATE TRIGGER trg_rapor_mapel_updated
    BEFORE UPDATE ON rapor_mapel
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Detail nilai per Lingkup Materi (opsional, untuk tabel rapor)
CREATE TABLE IF NOT EXISTS rapor_nilai_lm (
    id SERIAL PRIMARY KEY,
    id_rapor_mapel INT NOT NULL REFERENCES rapor_mapel(id) ON DELETE CASCADE,
    id_lingkup_materi INT NOT NULL REFERENCES lingkup_materi(id) ON DELETE CASCADE,
    nilai_lm NUMERIC(5,2) CHECK (nilai_lm >= 0 AND nilai_lm <= 100),
    CONSTRAINT unique_rapor_lm UNIQUE (id_rapor_mapel, id_lingkup_materi)
);

-- -----------------------------------------------------------------------------
-- I. FUNGSI BANTU — konversi angka ↔ predikat KM
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION angka_ke_predikat_km(nilai NUMERIC)
RETURNS VARCHAR(10) AS $$
BEGIN
    IF nilai IS NULL THEN RETURN NULL; END IF;
    IF nilai >= 90 THEN RETURN 'SB'; END IF;
    IF nilai >= 80 THEN RETURN 'BSH'; END IF;
    IF nilai >= 70 THEN RETURN 'MB'; END IF;
    RETURN 'BB';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION predikat_ke_angka_midpoint(predikat VARCHAR(10))
RETURNS NUMERIC AS $$
BEGIN
    RETURN CASE predikat
        WHEN 'SB'  THEN 95
        WHEN 'BSH' THEN 85
        WHEN 'MB'  THEN 75
        WHEN 'BB'  THEN 55
        ELSE NULL
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Sinkronkan predikat saat nilai_akhir diisi
CREATE OR REPLACE FUNCTION sync_rapor_mapel_predikat()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.nilai_akhir IS NOT NULL AND NEW.predikat_kualitatif IS NULL THEN
        NEW.predikat_kualitatif := angka_ke_predikat_km(NEW.nilai_akhir);
    END IF;
    IF NEW.predikat_kualitatif IS NOT NULL AND NEW.nilai_akhir IS NULL THEN
        NEW.nilai_akhir := predikat_ke_angka_midpoint(NEW.predikat_kualitatif);
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rapor_mapel_sync_predikat ON rapor_mapel;
CREATE TRIGGER trg_rapor_mapel_sync_predikat
    BEFORE INSERT OR UPDATE ON rapor_mapel
    FOR EACH ROW EXECUTE FUNCTION sync_rapor_mapel_predikat();

-- Agregasi kehadiran dari absensi (S/I/A dalam rentang semester)
CREATE OR REPLACE FUNCTION hitung_kehadiran_rapor(
    p_id_siswa INT,
    p_semester INT,
    p_tahun_ajaran VARCHAR(20)
)
RETURNS TABLE (sakit INT, izin INT, tanpa_keterangan INT) AS $$
DECLARE
    tahun_mulai INT;
    tahun_selesai INT;
    tgl_mulai DATE;
    tgl_selesai DATE;
BEGIN
    -- Parse "2025/2026" → Juli semester 1, Jan semester 2 (approx)
    tahun_mulai := SPLIT_PART(p_tahun_ajaran, '/', 1)::INT;
    IF p_semester = 1 THEN
        tgl_mulai := MAKE_DATE(tahun_mulai, 7, 1);
        tgl_selesai := MAKE_DATE(tahun_mulai, 12, 31);
    ELSE
        tgl_selesai := MAKE_DATE(tahun_mulai + 1, 6, 30);
        tgl_mulai := MAKE_DATE(tahun_mulai + 1, 1, 1);
    END IF;

    RETURN QUERY
    SELECT
        COUNT(*) FILTER (WHERE a.status = 'S')::INT,
        COUNT(*) FILTER (WHERE a.status = 'I')::INT,
        COUNT(*) FILTER (WHERE a.status = 'A')::INT
    FROM absensi a
    WHERE a.id_siswa = p_id_siswa
      AND a.tanggal BETWEEN tgl_mulai AND tgl_selesai;
END;
$$ LANGUAGE plpgsql STABLE;

-- -----------------------------------------------------------------------------
-- J. ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------

ALTER TABLE ref_jenjang ENABLE ROW LEVEL SECURITY;
ALTER TABLE ref_fase ENABLE ROW LEVEL SECURITY;
ALTER TABLE mata_pelajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE kelas_mata_pelajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE lingkup_materi ENABLE ROW LEVEL SECURITY;
ALTER TABLE ekstrakurikuler ENABLE ROW LEVEL SECURITY;
ALTER TABLE siswa_ekstrakurikuler ENABLE ROW LEVEL SECURITY;
ALTER TABLE rapor_kehadiran ENABLE ROW LEVEL SECURITY;
ALTER TABLE dimensi_p5 ENABLE ROW LEVEL SECURITY;
ALTER TABLE projek_p5 ENABLE ROW LEVEL SECURITY;
ALTER TABLE siswa_p5_capaian ENABLE ROW LEVEL SECURITY;
ALTER TABLE e_rapor ENABLE ROW LEVEL SECURITY;
ALTER TABLE rapor_mapel ENABLE ROW LEVEL SECURITY;
ALTER TABLE rapor_nilai_lm ENABLE ROW LEVEL SECURITY;

-- Referensi: baca semua user terautentikasi
DROP POLICY IF EXISTS ref_jenjang_read ON ref_jenjang;
CREATE POLICY ref_jenjang_read ON ref_jenjang FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS ref_fase_read ON ref_fase;
CREATE POLICY ref_fase_read ON ref_fase FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS dimensi_p5_read ON dimensi_p5;
CREATE POLICY dimensi_p5_read ON dimensi_p5 FOR SELECT USING (auth.uid() IS NOT NULL);

-- Mata pelajaran milik guru
DROP POLICY IF EXISTS mapel_select_own ON mata_pelajaran;
CREATE POLICY mapel_select_own ON mata_pelajaran
    FOR SELECT USING (id_guru = current_guru_id());
DROP POLICY IF EXISTS mapel_write_own ON mata_pelajaran;
CREATE POLICY mapel_write_own ON mata_pelajaran
    FOR INSERT WITH CHECK (id_guru = current_guru_id() AND guru_can_write());
DROP POLICY IF EXISTS mapel_update_own ON mata_pelajaran;
CREATE POLICY mapel_update_own ON mata_pelajaran
    FOR UPDATE USING (id_guru = current_guru_id() AND guru_can_write());
DROP POLICY IF EXISTS mapel_delete_own ON mata_pelajaran;
CREATE POLICY mapel_delete_own ON mata_pelajaran
    FOR DELETE USING (id_guru = current_guru_id() AND guru_can_write());

-- Kelas ↔ mapel
DROP POLICY IF EXISTS kelas_mapel_select ON kelas_mata_pelajaran;
CREATE POLICY kelas_mapel_select ON kelas_mata_pelajaran
    FOR SELECT USING (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id())
    );
DROP POLICY IF EXISTS kelas_mapel_write ON kelas_mata_pelajaran;
CREATE POLICY kelas_mapel_write ON kelas_mata_pelajaran
    FOR INSERT WITH CHECK (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id())
        AND id_guru_pengampu = current_guru_id()
        AND guru_can_write()
    );
DROP POLICY IF EXISTS kelas_mapel_update ON kelas_mata_pelajaran;
CREATE POLICY kelas_mapel_update ON kelas_mata_pelajaran
    FOR UPDATE USING (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id())
        AND guru_can_write()
    );
DROP POLICY IF EXISTS kelas_mapel_delete ON kelas_mata_pelajaran;
CREATE POLICY kelas_mapel_delete ON kelas_mata_pelajaran
    FOR DELETE USING (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id())
        AND guru_can_write()
    );

-- Lingkup materi
DROP POLICY IF EXISTS lm_select_own ON lingkup_materi;
CREATE POLICY lm_select_own ON lingkup_materi
    FOR SELECT USING (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id())
    );
DROP POLICY IF EXISTS lm_insert_own ON lingkup_materi;
CREATE POLICY lm_insert_own ON lingkup_materi
    FOR INSERT WITH CHECK (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id())
        AND guru_can_write()
    );
DROP POLICY IF EXISTS lm_update_own ON lingkup_materi;
CREATE POLICY lm_update_own ON lingkup_materi
    FOR UPDATE USING (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id())
        AND guru_can_write()
    );
DROP POLICY IF EXISTS lm_delete_own ON lingkup_materi;
CREATE POLICY lm_delete_own ON lingkup_materi
    FOR DELETE USING (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id())
        AND guru_can_write()
    );

-- Ekstrakurikuler
DROP POLICY IF EXISTS ekskul_select_own ON ekstrakurikuler;
CREATE POLICY ekskul_select_own ON ekstrakurikuler
    FOR SELECT USING (id_guru = current_guru_id());
DROP POLICY IF EXISTS ekskul_write_own ON ekstrakurikuler;
CREATE POLICY ekskul_write_own ON ekstrakurikuler
    FOR ALL USING (id_guru = current_guru_id() AND guru_can_write())
    WITH CHECK (id_guru = current_guru_id() AND guru_can_write());

DROP POLICY IF EXISTS siswa_ekskul_select ON siswa_ekstrakurikuler;
CREATE POLICY siswa_ekskul_select ON siswa_ekstrakurikuler
    FOR SELECT USING (
        id_siswa IN (
            SELECT s.id FROM siswa s
            JOIN kelas k ON k.id = s.id_kelas
            WHERE k.id_guru = current_guru_id()
        )
    );
DROP POLICY IF EXISTS siswa_ekskul_write ON siswa_ekstrakurikuler;
CREATE POLICY siswa_ekskul_write ON siswa_ekstrakurikuler
    FOR ALL USING (
        id_siswa IN (
            SELECT s.id FROM siswa s
            JOIN kelas k ON k.id = s.id_kelas
            WHERE k.id_guru = current_guru_id()
        ) AND guru_can_write()
    )
    WITH CHECK (
        id_siswa IN (
            SELECT s.id FROM siswa s
            JOIN kelas k ON k.id = s.id_kelas
            WHERE k.id_guru = current_guru_id()
        ) AND guru_can_write()
    );

-- Kehadiran rapor
DROP POLICY IF EXISTS kehadiran_rapor_select ON rapor_kehadiran;
CREATE POLICY kehadiran_rapor_select ON rapor_kehadiran
    FOR SELECT USING (
        id_siswa IN (
            SELECT s.id FROM siswa s
            JOIN kelas k ON k.id = s.id_kelas
            WHERE k.id_guru = current_guru_id()
        )
    );
DROP POLICY IF EXISTS kehadiran_rapor_write ON rapor_kehadiran;
CREATE POLICY kehadiran_rapor_write ON rapor_kehadiran
    FOR ALL USING (
        id_siswa IN (
            SELECT s.id FROM siswa s
            JOIN kelas k ON k.id = s.id_kelas
            WHERE k.id_guru = current_guru_id()
        ) AND guru_can_write()
    )
    WITH CHECK (
        id_siswa IN (
            SELECT s.id FROM siswa s
            JOIN kelas k ON k.id = s.id_kelas
            WHERE k.id_guru = current_guru_id()
        ) AND guru_can_write()
    );

-- P5
DROP POLICY IF EXISTS projek_p5_select ON projek_p5;
CREATE POLICY projek_p5_select ON projek_p5
    FOR SELECT USING (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id())
    );
DROP POLICY IF EXISTS projek_p5_write ON projek_p5;
CREATE POLICY projek_p5_write ON projek_p5
    FOR ALL USING (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id())
        AND guru_can_write()
    )
    WITH CHECK (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id())
        AND guru_can_write()
    );

DROP POLICY IF EXISTS siswa_p5_select ON siswa_p5_capaian;
CREATE POLICY siswa_p5_select ON siswa_p5_capaian
    FOR SELECT USING (
        id_siswa IN (
            SELECT s.id FROM siswa s
            JOIN kelas k ON k.id = s.id_kelas
            WHERE k.id_guru = current_guru_id()
        )
    );
DROP POLICY IF EXISTS siswa_p5_write ON siswa_p5_capaian;
CREATE POLICY siswa_p5_write ON siswa_p5_capaian
    FOR ALL USING (
        id_siswa IN (
            SELECT s.id FROM siswa s
            JOIN kelas k ON k.id = s.id_kelas
            WHERE k.id_guru = current_guru_id()
        ) AND guru_can_write()
    )
    WITH CHECK (
        id_siswa IN (
            SELECT s.id FROM siswa s
            JOIN kelas k ON k.id = s.id_kelas
            WHERE k.id_guru = current_guru_id()
        ) AND guru_can_write()
    );

-- E-Rapor header: wali kelas (pemilik kelas)
DROP POLICY IF EXISTS e_rapor_select ON e_rapor;
CREATE POLICY e_rapor_select ON e_rapor
    FOR SELECT USING (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id())
    );
DROP POLICY IF EXISTS e_rapor_write ON e_rapor;
CREATE POLICY e_rapor_write ON e_rapor
    FOR ALL USING (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id())
        AND guru_can_write()
    )
    WITH CHECK (
        id_kelas IN (SELECT id FROM kelas WHERE id_guru = current_guru_id())
        AND guru_can_write()
    );

-- Rapor mapel: guru pengampu mapel ATAU wali kelas siswa
DROP POLICY IF EXISTS rapor_mapel_select ON rapor_mapel;
CREATE POLICY rapor_mapel_select ON rapor_mapel
    FOR SELECT USING (
        id_guru = current_guru_id()
        OR id_siswa IN (
            SELECT s.id FROM siswa s
            JOIN kelas k ON k.id = s.id_kelas
            WHERE k.id_guru = current_guru_id()
        )
    );
DROP POLICY IF EXISTS rapor_mapel_write ON rapor_mapel;
CREATE POLICY rapor_mapel_write ON rapor_mapel
    FOR INSERT WITH CHECK (
        id_guru = current_guru_id() AND guru_can_write()
    );
DROP POLICY IF EXISTS rapor_mapel_update ON rapor_mapel;
CREATE POLICY rapor_mapel_update ON rapor_mapel
    FOR UPDATE USING (
        id_guru = current_guru_id() AND guru_can_write()
    );
DROP POLICY IF EXISTS rapor_mapel_delete ON rapor_mapel;
CREATE POLICY rapor_mapel_delete ON rapor_mapel
    FOR DELETE USING (
        id_guru = current_guru_id() AND guru_can_write()
    );

DROP POLICY IF EXISTS rapor_nilai_lm_select ON rapor_nilai_lm;
CREATE POLICY rapor_nilai_lm_select ON rapor_nilai_lm
    FOR SELECT USING (
        id_rapor_mapel IN (
            SELECT rm.id FROM rapor_mapel rm
            WHERE rm.id_guru = current_guru_id()
               OR rm.id_siswa IN (
                   SELECT s.id FROM siswa s
                   JOIN kelas k ON k.id = s.id_kelas
                   WHERE k.id_guru = current_guru_id()
               )
        )
    );
DROP POLICY IF EXISTS rapor_nilai_lm_write ON rapor_nilai_lm;
CREATE POLICY rapor_nilai_lm_write ON rapor_nilai_lm
    FOR ALL USING (
        id_rapor_mapel IN (
            SELECT id FROM rapor_mapel WHERE id_guru = current_guru_id()
        ) AND guru_can_write()
    )
    WITH CHECK (
        id_rapor_mapel IN (
            SELECT id FROM rapor_mapel WHERE id_guru = current_guru_id()
        ) AND guru_can_write()
    );
