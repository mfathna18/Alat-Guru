/** Util bersama seed demo & isi nilai acak. */

export const MAN_SMA_IPS_MAPEL_SEED = [
  { key: "pai", nama_mapel: "Pendidikan Agama Islam", kelompok_mapel: "A", urutan: 10, is_group_header: true },
  { key: "quran", nama_mapel: "Al Qur'an Hadis", kelompok_mapel: "A", urutan: 11, parent_key: "pai" },
  { key: "akidah", nama_mapel: "Akidah Akhlak", kelompok_mapel: "A", urutan: 12, parent_key: "pai" },
  { key: "fikih", nama_mapel: "Fikih", kelompok_mapel: "A", urutan: 13, parent_key: "pai" },
  { key: "ski", nama_mapel: "Sejarah Kebudayaan Islam", kelompok_mapel: "A", urutan: 14, parent_key: "pai" },
  { key: "ppkn", nama_mapel: "PPKn", kelompok_mapel: "A", urutan: 20 },
  { key: "bindo", nama_mapel: "Bahasa Indonesia", kelompok_mapel: "A", urutan: 30 },
  { key: "barab", nama_mapel: "Bahasa Arab", kelompok_mapel: "A", urutan: 40 },
  { key: "mtk", nama_mapel: "Matematika", kelompok_mapel: "A", urutan: 50 },
  { key: "sejindo", nama_mapel: "Sejarah Indonesia", kelompok_mapel: "A", urutan: 60 },
  { key: "bing", nama_mapel: "Bahasa Inggris", kelompok_mapel: "A", urutan: 70 },
  { key: "senbud", nama_mapel: "Seni Budaya", kelompok_mapel: "B", urutan: 10 },
  { key: "pjok", nama_mapel: "PJOK", kelompok_mapel: "B", urutan: 20 },
  { key: "prakarya", nama_mapel: "Prakarya dan Kewirausahaan", kelompok_mapel: "B", urutan: 30 },
  { key: "geo", nama_mapel: "Geografi", kelompok_mapel: "C", urutan: 10 },
  { key: "sejarah", nama_mapel: "Sejarah", kelompok_mapel: "C", urutan: 20 },
  { key: "sosiologi", nama_mapel: "Sosiologi", kelompok_mapel: "C", urutan: 30 },
  { key: "ekonomi", nama_mapel: "Ekonomi", kelompok_mapel: "C", urutan: 40 },
  { key: "bing_sastra", nama_mapel: "Bahasa dan Sastra Inggris", kelompok_mapel: "C", urutan: 50 },
];

export const EKSKUL_DEMO = [
  { nama: "Pramuka", pembina: "Pak Ahmad, S.Pd." },
  { nama: "Basket", pembina: "Bu Fitri, S.Pd." },
  { nama: "Hadroh", pembina: "Ust. Hadi, S.Ag." },
];

export const SIKAP_SPIRITUAL_NOTES = [
  "Menunjukkan sikap religius, menghargai keberagaman, dan berdoa sebelum serta sesudah kegiatan belajar.",
  "Taat beribadah, menghormati guru dan teman, serta menjaga kebersihan lingkungan sekolah.",
  "Memiliki integritas tinggi dan konsisten menunjukkan perilaku yang sesuai nilai agama.",
];

export const SIKAP_SOSIAL_NOTES = [
  "Sopan, jujur, disiplin, bertanggung jawab, dan mampu bekerja sama dalam kelompok.",
  "Aktif berpartisipasi dalam diskusi kelas, menghargai pendapat teman, dan komunikatif.",
  "Menunjukkan kepemimpinan, empati, dan kerja sama yang baik dalam kegiatan sekolah.",
];

export const SIKAP_NOTES = [...SIKAP_SPIRITUAL_NOTES, ...SIKAP_SOSIAL_NOTES];

export const EKSKUL_PREDIKAT = ["Sangat Baik", "Baik", "Cukup", "Kurang"];

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randScore(min = 55, max = 98) {
  return randInt(min, max);
}

export async function batchInsert(supabase, table, rows, size = 80) {
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

export async function batchUpsert(supabase, table, rows, onConflict, size = 80) {
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

async function detectManSchema(supabase) {
  const { error: mapelErr } = await supabase
    .from("mata_pelajaran")
    .select("kelompok_mapel, is_group_header")
    .limit(1);
  const { error: raporErr } = await supabase
    .from("rapor_mapel")
    .select("nilai_pengetahuan, nilai_keterampilan")
    .limit(1);

  const missing = (err) =>
    !!err &&
    (err.message.includes("Could not find") ||
      err.message.includes("does not exist"));

  return {
    mapelMan: !missing(mapelErr),
    raporDual: !missing(raporErr),
  };
}

/** @returns {Promise<{ id: number, is_group_header?: boolean }[]>} */
export async function seedManMapel(supabase, guruId) {
  const schema = await detectManSchema(supabase);

  const { data: existing, error: fetchErr } = await supabase
    .from("mata_pelajaran")
    .select("*")
    .eq("id_guru", guruId);

  if (fetchErr) throw fetchErr;

  const byName = new Map(
    (existing ?? []).map((m) => [m.nama_mapel.toLowerCase().trim(), m]),
  );
  const idByKey = new Map();

  for (const item of MAN_SMA_IPS_MAPEL_SEED) {
    const parentId = schema.mapelMan && item.parent_key
      ? (idByKey.get(item.parent_key) ?? null)
      : null;
    const normalized = item.nama_mapel.toLowerCase().trim();
    const found = byName.get(normalized);

    const meta = schema.mapelMan
      ? {
          kelompok_mapel: item.kelompok_mapel,
          urutan: item.urutan,
          parent_id: parentId,
          is_group_header: item.is_group_header ?? false,
          is_active: true,
        }
      : { is_active: true };

    if (found) {
      const { error } = await supabase
        .from("mata_pelajaran")
        .update(meta)
        .eq("id", found.id);
      if (error) throw error;
      idByKey.set(item.key, found.id);
    } else {
      const { data: inserted, error } = await supabase
        .from("mata_pelajaran")
        .insert({
          id_guru: guruId,
          nama_mapel: item.nama_mapel,
          is_default: item.key === "mtk",
          ...meta,
        })
        .select(schema.mapelMan ? "id, is_group_header" : "id")
        .single();
      if (error) throw error;
      idByKey.set(item.key, inserted.id);
      byName.set(normalized, inserted);
    }
  }

  const { data: allMapel, error } = await supabase
    .from("mata_pelajaran")
    .select(schema.mapelMan ? "id, is_group_header" : "id")
    .eq("id_guru", guruId)
    .eq("is_active", true);

  if (error) throw error;

  if (!schema.mapelMan) {
    console.warn(
      "⚠️  Migration 012 belum dijalankan — mapel MAN tanpa kelompok A/B/C. Jalankan supabase/migrations/012_rapor_mapel_struktur.sql",
    );
    return (allMapel ?? []).map((m) => ({ ...m, is_group_header: false }));
  }

  return allMapel ?? [];
}

export function buildNilaiRowsForIndikators(siswaList, indikatorByKelas) {
  const nilaiRows = [];
  for (const siswa of siswaList) {
    const indikators = indikatorByKelas.get(siswa.id_kelas) ?? [];
    for (const { id: indId, lmId } of indikators) {
      const base = randScore();
      nilaiRows.push({
        id_siswa: siswa.id,
        id_indikator: indId,
        jenis_asesmen: "FORMATIF",
        skor_angka: base,
        skor_kualitatif: null,
        tipe_sumatif: null,
        id_lingkup_materi: null,
      });
      nilaiRows.push({
        id_siswa: siswa.id,
        id_indikator: indId,
        jenis_asesmen: "SUMATIF",
        tipe_sumatif: "STS",
        id_lingkup_materi: null,
        skor_angka: randScore(),
        skor_kualitatif: null,
      });
      nilaiRows.push({
        id_siswa: siswa.id,
        id_indikator: indId,
        jenis_asesmen: "SUMATIF",
        tipe_sumatif: "SAS",
        skor_angka: randScore(),
        skor_kualitatif: null,
        id_lingkup_materi: null,
      });
      if (base < 70 && Math.random() < 0.6) {
        nilaiRows.push({
          id_siswa: siswa.id,
          id_indikator: indId,
          jenis_asesmen: "REMEDIAL",
          skor_angka: randInt(65, 78),
          skor_kualitatif: null,
          tipe_sumatif: null,
          id_lingkup_materi: null,
        });
      }
      if (base >= 90 && Math.random() < 0.35) {
        nilaiRows.push({
          id_siswa: siswa.id,
          id_indikator: indId,
          jenis_asesmen: "PENGAYAAN",
          skor_angka: randInt(90, 100),
          skor_kualitatif: null,
          tipe_sumatif: null,
          id_lingkup_materi: null,
        });
      }
    }
  }
  return nilaiRows;
}

export function computeRaporScores(
  bobot = { formatif: 30, sumatifLm: 40, sas: 30 },
  includeDual = true,
) {
  const fmt = randScore();
  const lm = randScore();
  const sas = randScore();
  const nilai_akhir = Math.round(
    (fmt * bobot.formatif + lm * bobot.sumatifLm + sas * bobot.sas) / 100,
  );
  const scores = {
    nilai_formatif: fmt,
    nilai_sumatif_lm: lm,
    nilai_sas: sas,
    nilai_akhir,
    deskripsi_capaian: `Menunjukkan penguasaan ${nilai_akhir >= 85 ? "sangat baik" : nilai_akhir >= 70 ? "baik" : "cukup"} pada materi semester ini.`,
  };
  if (includeDual) {
    scores.nilai_pengetahuan = Math.round((fmt + sas) / 2);
    scores.nilai_keterampilan = Math.round((lm + sas) / 2);
  }
  return scores;
}

export function tpDefsForMapel(namaMapel, semester, mapelId) {
  const prefix = semester === 1 ? "" : "S2-";
  const slug = `M${mapelId}`;
  return [
    {
      kode: `${prefix}${slug}-TP1`,
      deskripsi: `Peserta didik mampu memahami konsep dasar ${namaMapel} pada semester ${semester}.`,
      indikators: [
        {
          kode: "1.1",
          deskripsi: `Menjelaskan materi pokok ${namaMapel} dengan benar.`,
        },
        {
          kode: "1.2",
          deskripsi: `Menerapkan konsep ${namaMapel} dalam latihan terbimbing.`,
        },
      ],
    },
    {
      kode: `${prefix}${slug}-TP2`,
      deskripsi: `Peserta didik mampu menganalisis dan menyelesaikan masalah ${namaMapel}.`,
      indikators: [
        {
          kode: "2.1",
          deskripsi: `Menganalisis masalah kontekstual berkaitan dengan ${namaMapel}.`,
        },
        {
          kode: "2.2",
          deskripsi: `Menyelesaikan soal ${namaMapel} tingkat menengah dengan tepat.`,
        },
      ],
    },
  ];
}

/** @returns {Promise<{ id: number }[]>} */
export async function seedTpForKelas(supabase, kelasId, scorableMapel) {
  const indikatorIds = [];

  for (const semester of [1, 2]) {
    const lmRows = scorableMapel.map((mapel, idx) => ({
      id_kelas: kelasId,
      id_mata_pelajaran: mapel.id,
      semester,
      kode_lm: "LM1",
      judul_lm: `${mapel.nama_mapel} — Semester ${semester}`,
      urutan: idx + 1,
    }));
    const { data: lmList, error: lmErr } = await supabase
      .from("lingkup_materi")
      .insert(lmRows)
      .select("id,id_mata_pelajaran");
    if (lmErr) throw lmErr;

    const lmByMapel = new Map(lmList.map((lm) => [lm.id_mata_pelajaran, lm.id]));

    for (const mapel of scorableMapel) {
      const defs = tpDefsForMapel(mapel.nama_mapel, semester, mapel.id);
      for (const tpDef of defs) {
        const { data: tp, error: tpErr } = await supabase
          .from("tujuan_pembelajaran")
          .insert({
            id_kelas: kelasId,
            id_mata_pelajaran: mapel.id,
            id_lingkup_materi: lmByMapel.get(mapel.id),
            semester,
            kode_tp: tpDef.kode,
            deskripsi_tp: tpDef.deskripsi,
          })
          .select("id")
          .single();
        if (tpErr) throw tpErr;

        const { error: rubErr } = await supabase.from("rubrik").insert({
          id_tp: tp.id,
          skala_penilaian: "ANGKA",
          kriteria_json: null,
        });
        if (rubErr) throw rubErr;

        for (const ind of tpDef.indikators) {
          const { data: indRow, error: indErr } = await supabase
            .from("indikator")
            .insert({
              id_tp: tp.id,
              kode_indikator: ind.kode,
              deskripsi_indikator: ind.deskripsi,
            })
            .select("id")
            .single();
          if (indErr) throw indErr;
          indikatorIds.push({ id: indRow.id });
        }
      }
    }
  }

  return indikatorIds;
}

export function buildNilaiRowsFull(siswaList, indikatorByKelas) {
  const nilaiRows = [];
  for (const siswa of siswaList) {
    const indikators = indikatorByKelas.get(siswa.id_kelas) ?? [];
    for (const { id: indId } of indikators) {
      const base = randScore();
      nilaiRows.push({
        id_siswa: siswa.id,
        id_indikator: indId,
        jenis_asesmen: "FORMATIF",
        skor_angka: base,
        skor_kualitatif: null,
        tipe_sumatif: null,
        id_lingkup_materi: null,
      });
      nilaiRows.push({
        id_siswa: siswa.id,
        id_indikator: indId,
        jenis_asesmen: "SUMATIF",
        tipe_sumatif: "STS",
        id_lingkup_materi: null,
        skor_angka: randScore(),
        skor_kualitatif: null,
      });
      nilaiRows.push({
        id_siswa: siswa.id,
        id_indikator: indId,
        jenis_asesmen: "SUMATIF",
        tipe_sumatif: "SAS",
        id_lingkup_materi: null,
        skor_angka: randScore(),
        skor_kualitatif: null,
      });
      if (base < 70 && Math.random() < 0.65) {
        nilaiRows.push({
          id_siswa: siswa.id,
          id_indikator: indId,
          jenis_asesmen: "REMEDIAL",
          skor_angka: randInt(65, 78),
          skor_kualitatif: null,
          tipe_sumatif: null,
          id_lingkup_materi: null,
        });
      }
      if (base >= 88 && Math.random() < 0.4) {
        nilaiRows.push({
          id_siswa: siswa.id,
          id_indikator: indId,
          jenis_asesmen: "PENGAYAAN",
          skor_angka: randInt(88, 100),
          skor_kualitatif: null,
          tipe_sumatif: null,
          id_lingkup_materi: null,
        });
      }
    }
  }
  return nilaiRows;
}

/** Hari kerja dalam bulan tertentu (format YYYY-MM-DD, tanpa geser timezone). */
export function getWeekdaysInMonth(year, monthIndex) {
  const dates = [];
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, monthIndex, day);
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      dates.push(
        `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      );
    }
  }
  return dates;
}

export function buildJuneAbsensiRows(siswaList, year = new Date().getFullYear()) {
  const dates = getWeekdaysInMonth(year, 5);
  const absensiRows = [];
  for (const siswa of siswaList) {
    for (const tanggal of dates) {
      const r = Math.random();
      let status = "H";
      if (r > 0.92) status = "A";
      else if (r > 0.86) status = "S";
      else if (r > 0.8) status = "I";
      absensiRows.push({
        id_siswa: siswa.id,
        tanggal,
        status,
      });
    }
  }
  return absensiRows;
}

export async function seedFullRaporAndSikap(supabase, {
  guruId,
  kelasList,
  allSiswa,
  scorableMapel,
  mapelList,
  tahunAjaran = "2025/2026",
  bobot = { formatif: 30, sumatifLm: 40, sas: 30 },
  includeDual = true,
}) {
  const kmpRows = [];
  for (const kelas of kelasList) {
    for (const mapel of mapelList) {
      kmpRows.push({
        id_kelas: kelas.id,
        id_mata_pelajaran: mapel.id,
        id_guru_pengampu: guruId,
      });
    }
  }
  await batchUpsert(supabase, "kelas_mata_pelajaran", kmpRows, "id_kelas,id_mata_pelajaran", 100);

  const raporMapelRows = [];
  for (const semester of [1, 2]) {
    for (const siswa of allSiswa) {
      for (const mapel of scorableMapel) {
        raporMapelRows.push({
          id_siswa: siswa.id,
          id_kelas: siswa.id_kelas,
          id_mata_pelajaran: mapel.id,
          id_guru: guruId,
          semester,
          tahun_ajaran: tahunAjaran,
          deskripsi_sumber: "auto",
          ...computeRaporScores(bobot, includeDual),
        });
      }
    }
  }
  await batchUpsert(
    supabase,
    "rapor_mapel",
    raporMapelRows,
    "id_siswa,id_mata_pelajaran,semester,tahun_ajaran",
    100,
  );

  const eRaporRows = [];
  for (const semester of [1, 2]) {
    for (const siswa of allSiswa) {
      eRaporRows.push({
        id_siswa: siswa.id,
        id_kelas: siswa.id_kelas,
        semester,
        tahun_ajaran: tahunAjaran,
        status: "draft",
        sikap_spiritual: pick(SIKAP_SPIRITUAL_NOTES),
        sikap_sosial: pick(SIKAP_SOSIAL_NOTES),
        catatan_wali_kelas: `Semester ${semester}: ${pick(SIKAP_SOSIAL_NOTES)} Perlu dipertahankan dan ditingkatkan.`,
      });
    }
  }
  await batchUpsert(supabase, "e_rapor", eRaporRows, "id_siswa,semester,tahun_ajaran", 100);

  const ekskulIds = [];
  for (const def of EKSKUL_DEMO) {
    const { data, error } = await supabase
      .from("ekstrakurikuler")
      .upsert(
        { id_guru: guruId, nama_ekskul: def.nama, pembina: def.pembina, is_active: true },
        { onConflict: "id_guru,nama_ekskul" },
      )
      .select("id")
      .single();
    if (error) throw error;
    ekskulIds.push(data.id);
  }

  const siswaEkskulRows = [];
  for (const semester of [1, 2]) {
    for (const siswa of allSiswa) {
      const chosen = [...ekskulIds].sort(() => Math.random() - 0.5).slice(0, randInt(1, 2));
      for (const ekskulId of chosen) {
        siswaEkskulRows.push({
          id_siswa: siswa.id,
          id_ekstrakurikuler: ekskulId,
          semester,
          tahun_ajaran: tahunAjaran,
          predikat: pick(EKSKUL_PREDIKAT),
          deskripsi_capaian: "Aktif dan menunjukkan perkembangan positif.",
        });
      }
    }
  }
  await batchUpsert(
    supabase,
    "siswa_ekstrakurikuler",
    siswaEkskulRows,
    "id_siswa,id_ekstrakurikuler,semester,tahun_ajaran",
    100,
  );

  const kehadiranRows = [];
  for (const semester of [1, 2]) {
    for (const siswa of allSiswa) {
      kehadiranRows.push({
        id_siswa: siswa.id,
        semester,
        tahun_ajaran: tahunAjaran,
        sakit: randInt(0, 4),
        izin: randInt(0, 3),
        tanpa_keterangan: randInt(0, 2),
        hari_efektif: 110,
        sumber: "manual",
      });
    }
  }
  await batchUpsert(
    supabase,
    "rapor_kehadiran",
    kehadiranRows,
    "id_siswa,semester,tahun_ajaran",
    100,
  );

  return { raporMapelCount: raporMapelRows.length };
}

/**
 * Isi data E-Rapor: mapel MAN, rapor_mapel, e_rapor, ekskul, kehadiran rapor.
 */
export async function seedERaporDemoData(supabase, {
  guruId,
  kelasList,
  allSiswa,
  tahunAjaran = "2025/2026",
  semester = 1,
  bobot = { formatif: 30, sumatifLm: 40, sas: 30 },
}) {
  console.log("Menyusun struktur mapel MAN (SMA IPS)...");
  const schema = await detectManSchema(supabase);
  const mapelList = await seedManMapel(supabase, guruId);
  const scorableMapel = mapelList.filter((m) => !m.is_group_header);

  if (!schema.raporDual) {
    console.warn(
      "⚠️  Kolom nilai_pengetahuan/keterampilan belum ada — rapor_mapel tanpa KI-3/KI-4.",
    );
  }

  console.log("Menghubungkan mapel ke kelas...");
  const kmpRows = [];
  for (const kelas of kelasList) {
    for (const mapel of mapelList) {
      kmpRows.push({
        id_kelas: kelas.id,
        id_mata_pelajaran: mapel.id,
        id_guru_pengampu: guruId,
      });
    }
  }
  await batchUpsert(supabase, "kelas_mata_pelajaran", kmpRows, "id_kelas,id_mata_pelajaran", 100);

  console.log("Mengisi rapor_mapel acak (semua mapel × semua siswa)...");
  const raporMapelRows = [];
  for (const siswa of allSiswa) {
    for (const mapel of scorableMapel) {
      raporMapelRows.push({
        id_siswa: siswa.id,
        id_kelas: siswa.id_kelas,
        id_mata_pelajaran: mapel.id,
        id_guru: guruId,
        semester,
        tahun_ajaran: tahunAjaran,
        deskripsi_sumber: "auto",
        ...computeRaporScores(bobot, schema.raporDual),
      });
    }
  }
  await batchUpsert(
    supabase,
    "rapor_mapel",
    raporMapelRows,
    "id_siswa,id_mata_pelajaran,semester,tahun_ajaran",
    100,
  );

  console.log("Mengisi e_rapor (sikap / catatan wali kelas)...");
  const eRaporRows = allSiswa.map((siswa) => ({
    id_siswa: siswa.id,
    id_kelas: siswa.id_kelas,
    semester,
    tahun_ajaran: tahunAjaran,
    status: "draft",
    catatan_wali_kelas: pick(SIKAP_NOTES),
  }));
  await batchUpsert(supabase, "e_rapor", eRaporRows, "id_siswa,semester,tahun_ajaran", 100);

  console.log("Mengisi ekstrakurikuler...");
  const ekskulIds = [];
  for (const def of EKSKUL_DEMO) {
    const { data, error } = await supabase
      .from("ekstrakurikuler")
      .upsert(
        { id_guru: guruId, nama_ekskul: def.nama, pembina: def.pembina, is_active: true },
        { onConflict: "id_guru,nama_ekskul" },
      )
      .select("id")
      .single();
    if (error) throw error;
    ekskulIds.push(data.id);
  }

  const siswaEkskulRows = [];
  for (const siswa of allSiswa) {
    const count = randInt(1, 2);
    const chosen = [...ekskulIds].sort(() => Math.random() - 0.5).slice(0, count);
    for (const ekskulId of chosen) {
      siswaEkskulRows.push({
        id_siswa: siswa.id,
        id_ekstrakurikuler: ekskulId,
        semester,
        tahun_ajaran: tahunAjaran,
        predikat: pick(EKSKUL_PREDIKAT),
        deskripsi_capaian: "Aktif dan menunjukkan perkembangan positif.",
      });
    }
  }
  await batchUpsert(
    supabase,
    "siswa_ekstrakurikuler",
    siswaEkskulRows,
    "id_siswa,id_ekstrakurikuler,semester,tahun_ajaran",
    100,
  );

  console.log("Mengisi rapor_kehadiran (agregat semester)...");
  const kehadiranRows = allSiswa.map((siswa) => ({
    id_siswa: siswa.id,
    semester,
    tahun_ajaran: tahunAjaran,
    sakit: randInt(0, 4),
    izin: randInt(0, 3),
    tanpa_keterangan: randInt(0, 2),
    hari_efektif: 110,
    sumber: "manual",
  }));
  await batchUpsert(
    supabase,
    "rapor_kehadiran",
    kehadiranRows,
    "id_siswa,semester,tahun_ajaran",
    100,
  );

  return {
    mapelCount: mapelList.length,
    raporMapelCount: raporMapelRows.length,
    ekskulCount: ekskulIds.length,
  };
}
