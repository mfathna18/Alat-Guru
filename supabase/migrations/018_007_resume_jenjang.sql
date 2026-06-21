-- Lanjutan aman jika 007 gagal di tengah jalan (mis. ref_jenjang sudah ada).
-- Jalankan file ini ATAU jalankan ulang 007_e_rapor_km.sql versi terbaru (sudah idempotent).

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

ALTER TABLE pengaturan_sekolah
    ADD COLUMN IF NOT EXISTS jenjang VARCHAR(5) REFERENCES ref_jenjang(kode),
    ADD COLUMN IF NOT EXISTS nama_wali_kelas VARCHAR(150),
    ADD COLUMN IF NOT EXISTS nip_wali_kelas VARCHAR(50);

ALTER TABLE kelas
    ADD COLUMN IF NOT EXISTS jenjang VARCHAR(5) REFERENCES ref_jenjang(kode);

ALTER TABLE siswa
    ADD COLUMN IF NOT EXISTS nis VARCHAR(30);
