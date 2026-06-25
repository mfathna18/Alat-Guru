/**
 * Data contoh otomatis untuk user baru — dipanggil saat registrasi.
 * 1 kelas demo, 8 siswa, modul, TP, nilai, absensi, rapor & sikap.
 */
import {
  batchInsert,
  batchUpsert,
  buildNilaiRowsForIndikators,
  EKSKUL_DEMO,
  EKSKUL_PREDIKAT,
  pick,
  randInt,
  randScore,
  SIKAP_SOSIAL_NOTES,
  SIKAP_SPIRITUAL_NOTES,
} from "./seed-helpers.mjs";

const DEMO_KELAS_NAME = "VII-A (Contoh)";
const DEMO_STUDENT_COUNT = 8;
const TAHUN_AJARAN = "2025/2026";
const BOBOT = { formatif: 30, sumatifLm: 40, sas: 30 };

const DEMO_MAPEL_SMP = [
  "Matematika",
  "Bahasa Indonesia",
  "Ilmu Pengetahuan Alam",
  "Bahasa Inggris",
];

const MODUL_DEMO = [
  "Bilangan Berpangkat dan Bentuk Akar",
  "Persamaan Linear Satu Variabel",
  "Relasi dan Fungsi",
  "Statistika — Penyajian Data",
];

const TP_DEMO = [
  {
    kode: "TP1",
    deskripsi:
      "Peserta didik mampu menggunakan sifat bilangan berpangkat dalam operasi hitung.",
    indikators: [
      { kode: "1.1", deskripsi: "Menyederhanakan bentuk bilangan berpangkat bulat." },
      { kode: "1.2", deskripsi: "Menentukan nilai bilangan berpangkat rasional sederhana." },
    ],
    lm: 0,
  },
  {
    kode: "TP2",
    deskripsi:
      "Peserta didik mampu menyelesaikan persamaan linear satu variabel.",
    indikators: [
      { kode: "2.1", deskripsi: "Menyelesaikan persamaan linear satu variabel." },
      { kode: "2.2", deskripsi: "Menyelesaikan masalah kontekstual berbentuk persamaan linear." },
    ],
    lm: 0,
  },
];

const LM_DEMO = [
  { kode: "LM1", judul: "Bilangan dan Aljabar" },
  { kode: "LM2", judul: "Geometri dan Statistika" },
];

const DEPAN = [
  "Ahmad", "Budi", "Citra", "Dewi", "Eko", "Fitri", "Gita", "Hadi",
];

const BELAKANG = [
  "Saputra", "Wijaya", "Pratama", "Santoso", "Hidayat", "Nugroho", "Setiawan", "Kusuma",
];

function randomNisn() {
  return String(randInt(1000000000, 9999999999));
}

function computeRaporScores() {
  const fmt = randScore();
  const sts = randScore();
  const sas = randScore();
  const nilai_akhir = Math.round(
    (fmt * BOBOT.formatif + sts * BOBOT.sumatifLm + sas * BOBOT.sas) / 100,
  );
  return {
    nilai_formatif: fmt,
    nilai_sumatif_lm: sts,
    nilai_sas: sas,
    nilai_akhir,
    nilai_pengetahuan: Math.round((fmt + sas) / 2),
    nilai_keterampilan: Math.round((sts + sas) / 2),
    deskripsi_capaian: `Menunjukkan penguasaan ${nilai_akhir >= 85 ? "sangat baik" : nilai_akhir >= 70 ? "baik" : "cukup"} pada materi semester ini.`,
  };
}

async function ensureMapelSmp(supabase, guruId) {
  const mapelByName = new Map();

  for (const nama of DEMO_MAPEL_SMP) {
    const { data: existing } = await supabase
      .from("mata_pelajaran")
      .select("id,nama_mapel")
      .eq("id_guru", guruId)
      .ilike("nama_mapel", nama)
      .maybeSingle();

    if (existing) {
      mapelByName.set(nama, existing.id);
      continue;
    }

    const { data: created, error } = await supabase
      .from("mata_pelajaran")
      .insert({
        id_guru: guruId,
        nama_mapel: nama,
        is_default: nama === "Matematika",
        is_active: true,
      })
      .select("id")
      .single();

    if (error) throw error;
    mapelByName.set(nama, created.id);
  }

  return {
    matematikaId: mapelByName.get("Matematika"),
    allMapel: DEMO_MAPEL_SMP.map((nama) => ({
      id: mapelByName.get(nama),
      nama_mapel: nama,
    })),
  };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} authUserId
 */
export async function seedSignupDemoForAuthUser(supabase, authUserId) {
  const { data: guru, error: guruErr } = await supabase
    .from("guru")
    .select("id,email,nama_guru,nip_guru")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (guruErr) throw guruErr;
  if (!guru) return { seeded: false, reason: "guru_not_found" };

  const { count: kelasCount, error: kelasCountErr } = await supabase
    .from("kelas")
    .select("id", { count: "exact", head: true })
    .eq("id_guru", guru.id);

  if (kelasCountErr) throw kelasCountErr;
  if ((kelasCount ?? 0) > 0) {
    return { seeded: false, reason: "already_has_data" };
  }

  const guruId = guru.id;

  const pengaturanBase = {
    id_guru: guruId,
    nama_sekolah: "SMP Negeri 1 Contoh (Data Demo)",
    tahun_ajaran: TAHUN_AJARAN,
    nama_kepsek: "Dr. Siti Aminah, M.Pd.",
    nip_kepsek: "196801011990031001",
    jenjang: "SMP",
    alamat_sekolah: "Jl. Pendidikan No. 45, Kota Demo",
    kabupaten_kota: "Kota Demo",
    provinsi: "Jawa Tengah",
    nama_wali_kelas: guru.nama_guru,
    nip_wali_kelas: guru.nip_guru ?? "198501012010011001",
    bobot_formatif: BOBOT.formatif,
    bobot_sumatif_lm: BOBOT.sumatifLm,
    bobot_sas: BOBOT.sas,
    rapor_tampilkan_angka: true,
    rapor_tampilkan_predikat: true,
    kkm_angka: 70,
    ambang_pengayaan_angka: 85,
    rapor_template_id: "semester-ganjil-man",
    rapor_watermark_logo: true,
    rapor_slogan: "Data contoh — silakan edit atau hapus",
  };

  const { data: existingPengaturan } = await supabase
    .from("pengaturan_sekolah")
    .select("id")
    .eq("id_guru", guruId)
    .maybeSingle();

  if (existingPengaturan) {
    await supabase
      .from("pengaturan_sekolah")
      .update(pengaturanBase)
      .eq("id", existingPengaturan.id);
  } else {
    await supabase.from("pengaturan_sekolah").insert(pengaturanBase);
  }

  const { matematikaId, allMapel } = await ensureMapelSmp(supabase, guruId);
  if (!matematikaId) throw new Error("Mapel Matematika gagal dibuat");

  const { data: kelas, error: kelasErr } = await supabase
    .from("kelas")
    .insert({
      id_guru: guruId,
      nama_kelas: DEMO_KELAS_NAME,
      jenjang: "SMP",
      fase: "D",
      tingkat: "7",
      rombel: "A",
    })
    .select("id,nama_kelas,tingkat")
    .single();

  if (kelasErr) throw kelasErr;

  const modulRows = MODUL_DEMO.map((judul, i) => ({
    id_guru: guruId,
    id_kelas: kelas.id,
    urutan: i + 1,
    judul,
  }));
  const { data: modulList, error: modulErr } = await supabase
    .from("modul_ajar")
    .insert(modulRows)
    .select("id,urutan");
  if (modulErr) throw modulErr;

  const progressRows = (modulList ?? []).map((modul, i) => ({
    id_kelas: kelas.id,
    id_modul: modul.id,
    selesai: i < 2,
  }));
  await batchInsert(supabase, "kelas_modul_progress", progressRows);

  for (const mapel of allMapel) {
    await supabase.from("kelas_mata_pelajaran").upsert(
      {
        id_kelas: kelas.id,
        id_mata_pelajaran: mapel.id,
        id_guru_pengampu: guruId,
      },
      { onConflict: "id_kelas,id_mata_pelajaran" },
    );
  }

  const siswaRows = [];
  for (let i = 1; i <= DEMO_STUDENT_COUNT; i++) {
    const jk = Math.random() < 0.5 ? "L" : "P";
    siswaRows.push({
      id_kelas: kelas.id,
      nisn: randomNisn(),
      nis: `7${String(i).padStart(2, "0")}${i}`,
      nama_siswa: `${DEPAN[i - 1]} ${pick(BELAKANG)}`,
      jenis_kelamin: jk,
      tempat_lahir: pick(["Jakarta", "Bandung", "Semarang"]),
      tanggal_lahir: `2012-${String(randInt(1, 12)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`,
      nama_ayah: `Bapak ${pick(BELAKANG)}`,
      nama_ibu: `Ibu ${pick(BELAKANG)}`,
      alamat: `Jl. Merdeka No. ${randInt(1, 50)}, Kota Demo`,
      anak_ke: 1,
      jumlah_saudara: randInt(0, 3),
      is_deleted: false,
    });
  }

  const { data: allSiswa, error: siswaErr } = await supabase
    .from("siswa")
    .insert(siswaRows)
    .select("id,id_kelas");
  if (siswaErr) throw siswaErr;

  const lmInserts = LM_DEMO.map((lm, idx) => ({
    id_kelas: kelas.id,
    id_mata_pelajaran: matematikaId,
    semester: 1,
    kode_lm: lm.kode,
    judul_lm: lm.judul,
    urutan: idx + 1,
  }));
  const { data: lmList, error: lmErr } = await supabase
    .from("lingkup_materi")
    .insert(lmInserts)
    .select("id,kode_lm");
  if (lmErr) throw lmErr;

  const kelasIndikators = [];
  for (const tpDef of TP_DEMO) {
    const lmId = lmList[tpDef.lm].id;
    const { data: tp, error: tpErr } = await supabase
      .from("tujuan_pembelajaran")
      .insert({
        id_kelas: kelas.id,
        id_mata_pelajaran: matematikaId,
        id_lingkup_materi: lmId,
        semester: 1,
        kode_tp: tpDef.kode,
        deskripsi_tp: tpDef.deskripsi,
      })
      .select("id")
      .single();
    if (tpErr) throw tpErr;

    await supabase.from("rubrik").insert({
      id_tp: tp.id,
      skala_penilaian: "ANGKA",
    });

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
      kelasIndikators.push({ id: indRow.id, lmId });
    }
  }

  const semester2Tp = TP_DEMO.slice(0, 1).map((tpDef) => ({
    id_kelas: kelas.id,
    id_mata_pelajaran: matematikaId,
    semester: 2,
    kode_tp: `S2-${tpDef.kode}`,
    deskripsi_tp: `[Semester 2] ${tpDef.deskripsi}`,
  }));
  const { data: tpS2, error: tpS2Err } = await supabase
    .from("tujuan_pembelajaran")
    .insert(semester2Tp)
    .select("id");
  if (tpS2Err) throw tpS2Err;

  for (const tp of tpS2 ?? []) {
    await supabase.from("rubrik").insert({ id_tp: tp.id, skala_penilaian: "ANGKA" });
    const { data: indRow } = await supabase
      .from("indikator")
      .insert({
        id_tp: tp.id,
        kode_indikator: "1",
        deskripsi_indikator: "Indikator capaian semester 2.",
      })
      .select("id")
      .single();
    if (indRow) kelasIndikators.push({ id: indRow.id, lmId: null });
  }

  const indikatorByKelas = new Map([[kelas.id, kelasIndikators]]);
  const nilaiRows = buildNilaiRowsForIndikators(allSiswa, indikatorByKelas);
  await batchInsert(supabase, "nilai", nilaiRows, 100);

  const absensiRows = [];
  const today = new Date();
  for (const siswa of allSiswa) {
    for (let d = 0; d < 12; d++) {
      const dt = new Date(today);
      dt.setDate(dt.getDate() - d);
      if (dt.getDay() === 0 || dt.getDay() === 6) continue;
      const r = Math.random();
      let status = "H";
      if (r > 0.9) status = "A";
      else if (r > 0.84) status = "S";
      else if (r > 0.78) status = "I";
      absensiRows.push({
        id_siswa: siswa.id,
        tanggal: dt.toISOString().slice(0, 10),
        status,
      });
    }
  }
  await batchInsert(supabase, "absensi", absensiRows, 100);

  const raporMapelRows = [];
  for (const semester of [1, 2]) {
    for (const siswa of allSiswa) {
      for (const mapel of allMapel) {
        raporMapelRows.push({
          id_siswa: siswa.id,
          id_kelas: siswa.id_kelas,
          id_mata_pelajaran: mapel.id,
          id_guru: guruId,
          semester,
          tahun_ajaran: TAHUN_AJARAN,
          deskripsi_sumber: "auto",
          ...computeRaporScores(),
        });
      }
    }
  }
  await batchUpsert(
    supabase,
    "rapor_mapel",
    raporMapelRows,
    "id_siswa,id_mata_pelajaran,semester,tahun_ajaran",
    80,
  );

  const eRaporRows = [];
  for (const semester of [1, 2]) {
    for (const siswa of allSiswa) {
      eRaporRows.push({
        id_siswa: siswa.id,
        id_kelas: siswa.id_kelas,
        semester,
        tahun_ajaran: TAHUN_AJARAN,
        status: "draft",
        sikap_spiritual: pick(SIKAP_SPIRITUAL_NOTES),
        sikap_sosial: pick(SIKAP_SOSIAL_NOTES),
        catatan_wali_kelas:
          "Contoh catatan wali kelas — siswa menunjukkan perkembangan positif.",
      });
    }
  }
  await batchUpsert(
    supabase,
    "e_rapor",
    eRaporRows,
    "id_siswa,semester,tahun_ajaran",
    80,
  );

  const ekskulIds = [];
  for (const def of EKSKUL_DEMO.slice(0, 2)) {
    const { data, error } = await supabase
      .from("ekstrakurikuler")
      .upsert(
        {
          id_guru: guruId,
          nama_ekskul: def.nama,
          pembina: def.pembina,
          is_active: true,
        },
        { onConflict: "id_guru,nama_ekskul" },
      )
      .select("id")
      .single();
    if (error) throw error;
    ekskulIds.push(data.id);
  }

  const siswaEkskulRows = [];
  for (const siswa of allSiswa) {
    for (const ekskulId of ekskulIds.slice(0, 1)) {
      siswaEkskulRows.push({
        id_siswa: siswa.id,
        id_ekstrakurikuler: ekskulId,
        semester: 1,
        tahun_ajaran: TAHUN_AJARAN,
        predikat: pick(EKSKUL_PREDIKAT),
        deskripsi_capaian: "Aktif dalam kegiatan ekstrakurikuler sekolah.",
      });
    }
  }
  await batchUpsert(
    supabase,
    "siswa_ekstrakurikuler",
    siswaEkskulRows,
    "id_siswa,id_ekstrakurikuler,semester,tahun_ajaran",
    80,
  );

  const kehadiranRows = allSiswa.map((siswa) => ({
    id_siswa: siswa.id,
    semester: 1,
    tahun_ajaran: TAHUN_AJARAN,
    sakit: randInt(0, 2),
    izin: randInt(0, 2),
    tanpa_keterangan: 0,
    hari_efektif: 110,
    sumber: "manual",
  }));
  await batchUpsert(
    supabase,
    "rapor_kehadiran",
    kehadiranRows,
    "id_siswa,semester,tahun_ajaran",
    80,
  );

  return {
    seeded: true,
    kelas: DEMO_KELAS_NAME,
    siswa: allSiswa.length,
    mapel: allMapel.length,
    nilai: nilaiRows.length,
  };
}
