/**
 * Seed data demo SMP — 6 kelas, 40 siswa/kelas, modul ajar, TP, penilaian acak + E-Rapor.
 * Jalankan: npm run seed:demo
 * Opsional: SEED_GURU_EMAIL=you@mail.com npm run seed:demo
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import {
  batchInsert,
  buildNilaiRowsForIndikators,
  pick,
  randInt,
  seedERaporDemoData,
} from "./seed-helpers.mjs";

function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  const text = readFileSync(path, "utf8");
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    env[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
  }
  return env;
}

const HURUF = ["A", "B", "C", "D", "E"];
const DEMO_KELAS = [
  { nama: "VII-A", tingkat: "7", rombel: "A" },
  { nama: "VII-B", tingkat: "7", rombel: "B" },
  { nama: "VIII-A", tingkat: "8", rombel: "A" },
  { nama: "VIII-B", tingkat: "8", rombel: "B" },
  { nama: "IX-A", tingkat: "9", rombel: "A" },
  { nama: "IX-B", tingkat: "9", rombel: "B" },
];

const MODUL_SMP = [
  "Bilangan Berpangkat dan Bentuk Akar",
  "Persamaan dan Pertidaksamaan Linear",
  "Relasi dan Fungsi",
  "Sistem Persamaan Linear Dua Variabel",
  "Teorema Pythagoras",
  "Statistika — Penyajian Data",
  "Peluang Kejadian Sederhana",
  "Bangun Ruang (Kubus dan Balok)",
];

const TP_SMP = [
  {
    kode: "TP1",
    deskripsi:
      "Peserta didik mampu menganalisis dan menggunakan sifat bilangan berpangkat bulat dalam operasi hitung.",
    indikators: [
      {
        kode: "1.1",
        deskripsi: "Menyederhanakan bentuk bilangan berpangkat bulat positif dan negatif.",
      },
      {
        kode: "1.2",
        deskripsi: "Menentukan nilai suatu bilangan berpangkat rasional sederhana.",
      },
    ],
    lm: 0,
  },
  {
    kode: "TP2",
    deskripsi:
      "Peserta didik mampu menyelesaikan masalah yang berkaitan dengan persamaan linear satu variabel.",
    indikators: [
      {
        kode: "2.1",
        deskripsi: "Menyelesaikan persamaan linear satu variabel dengan benar.",
      },
      {
        kode: "2.2",
        deskripsi: "Menyelesaikan masalah kontekstual berbentuk persamaan linear.",
      },
    ],
    lm: 0,
  },
  {
    kode: "TP3",
    deskripsi:
      "Peserta didik mampu menganalisis relasi dan fungsi dalam berbagai situasi.",
    indikators: [
      {
        kode: "3.1",
        deskripsi: "Menentukan domain dan kodomain relasi pada masalah sehari-hari.",
      },
      {
        kode: "3.2",
        deskripsi: "Menyajikan fungsi dalam bentuk tabel, grafik, dan persamaan.",
      },
    ],
    lm: 1,
  },
  {
    kode: "TP4",
    deskripsi:
      "Peserta didik mampu menghitung luas permukaan dan volume bangun ruang sederhana.",
    indikators: [
      {
        kode: "4.1",
        deskripsi: "Menghitung luas permukaan kubus dan balok.",
      },
      {
        kode: "4.2",
        deskripsi: "Menghitung volume kubus dan balok dalam masalah kontekstual.",
      },
    ],
    lm: 1,
  },
];

const LM_SMP = [
  { kode: "LM1", judul: "Bilangan dan Aljabar" },
  { kode: "LM2", judul: "Geometri dan Statistika" },
];

const DEPAN = [
  "Ahmad",
  "Budi",
  "Citra",
  "Dewi",
  "Eko",
  "Fitri",
  "Gita",
  "Hadi",
  "Indra",
  "Joko",
  "Kartika",
  "Lina",
  "Maya",
  "Nadia",
  "Oki",
  "Putri",
  "Rafi",
  "Sari",
  "Taufik",
  "Umar",
  "Vina",
  "Wulan",
  "Yoga",
  "Zahra",
  "Agus",
  "Bayu",
  "Candra",
  "Dian",
  "Eka",
  "Farhan",
];

const BELAKANG = [
  "Saputra",
  "Wijaya",
  "Pratama",
  "Santoso",
  "Hidayat",
  "Nugroho",
  "Setiawan",
  "Kusuma",
  "Permata",
  "Lestari",
  "Anggraini",
  "Mahardika",
  "Ramadhan",
  "Susanto",
  "Wibowo",
  "Utami",
  "Purnama",
  "Cahyono",
  "Maulana",
  "Rizki",
];

function randomNisn() {
  return String(randInt(1000000000, 9999999999));
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const targetEmail = process.env.SEED_GURU_EMAIL?.trim();

  let guruQuery = supabase.from("guru").select("id,email,nama_guru,mata_pelajaran");
  if (targetEmail) guruQuery = guruQuery.eq("email", targetEmail);

  const { data: gurus, error: guruErr } = await guruQuery;
  if (guruErr) throw guruErr;
  if (!gurus?.length) {
    console.error(
      targetEmail
        ? `Guru dengan email ${targetEmail} tidak ditemukan.`
        : "Tidak ada akun guru. Login/register dulu.",
    );
    process.exit(1);
  }

  const guru = gurus.length > 1 && !targetEmail ? gurus[0] : gurus[0];
  if (gurus.length > 1 && !targetEmail) {
    console.log(
      `Beberapa guru ditemukan — memakai: ${guru.email} (set SEED_GURU_EMAIL untuk memilih lain)`,
    );
  }

  const guruId = guru.id;
  console.log(`\n🌱 Seed demo SMP untuk: ${guru.nama_guru} (${guru.email})\n`);

  await supabase
    .from("guru")
    .update({ mata_pelajaran: "Matematika" })
    .eq("id", guruId);

  let { data: mapel } = await supabase
    .from("mata_pelajaran")
    .select("id")
    .eq("id_guru", guruId)
    .eq("nama_mapel", "Matematika")
    .maybeSingle();

  if (!mapel) {
    const { data: created, error } = await supabase
      .from("mata_pelajaran")
      .insert({
        id_guru: guruId,
        kode_mapel: "MTK",
        nama_mapel: "Matematika",
        is_default: true,
        is_active: true,
      })
      .select("id")
      .single();
    if (error) throw error;
    mapel = created;
  } else {
    await supabase
      .from("mata_pelajaran")
      .update({ is_default: true, is_active: true })
      .eq("id", mapel.id);
  }

  const mapelId = mapel.id;

  const { data: existingPengaturan } = await supabase
    .from("pengaturan_sekolah")
    .select("id")
    .eq("id_guru", guruId)
    .maybeSingle();

  const pengaturanBase = {
    id_guru: guruId,
    nama_sekolah: "SMP Negeri 1 Demo Kurikulum Merdeka",
    tahun_ajaran: "2025/2026",
    nama_kepsek: "Dr. Siti Aminah, M.Pd.",
    nip_kepsek: "196801011990031001",
    jenjang: "SMP",
    alamat_sekolah: "Jl. Pendidikan No. 45, Kota Demo",
    kabupaten_kota: "Kota Demo",
    provinsi: "Jawa Tengah",
    nama_wali_kelas: guru.nama_guru,
    nip_wali_kelas: guru.nip_guru ?? "198501012010011001",
    bobot_formatif: 30,
    bobot_sumatif_lm: 40,
    bobot_sas: 30,
    rapor_tampilkan_angka: true,
    rapor_tampilkan_predikat: true,
    kkm_angka: 70,
    ambang_pengayaan_angka: 85,
  };

  const pengaturanPayload = {
    ...pengaturanBase,
    rapor_template_id: "semester-ganjil-man",
    rapor_watermark_logo: true,
    rapor_slogan: "Belajar adalah Ibadah. Prestasi untuk Dakwah",
  };

  async function savePengaturan(payload) {
    if (existingPengaturan) {
      const { error } = await supabase
        .from("pengaturan_sekolah")
        .update(payload)
        .eq("id", existingPengaturan.id);
      return error;
    }
    const { error } = await supabase.from("pengaturan_sekolah").insert(payload);
    return error;
  }

  let pengErr = await savePengaturan(pengaturanPayload);
  if (pengErr?.message?.includes("Could not find the")) {
    pengErr = await savePengaturan(pengaturanBase);
  }
  if (pengErr) throw pengErr;

  const demoNames = DEMO_KELAS.map((k) => k.nama);
  const { data: oldKelas } = await supabase
    .from("kelas")
    .select("id")
    .eq("id_guru", guruId)
    .in("nama_kelas", demoNames);

  if (oldKelas?.length) {
    console.log(`Menghapus ${oldKelas.length} kelas demo lama (cascade)...`);
    await supabase
      .from("kelas")
      .delete()
      .in(
        "id",
        oldKelas.map((k) => k.id),
      );
  }

  const { data: oldModul } = await supabase
    .from("modul_ajar")
    .select("id")
    .eq("id_guru", guruId);

  if (oldModul?.length) {
    await supabase
      .from("modul_ajar")
      .delete()
      .in(
        "id",
        oldModul.map((m) => m.id),
      );
  }

  console.log("Membuat 6 kelas SMP Fase D...");
  const kelasInserts = DEMO_KELAS.map((k) => ({
    id_guru: guruId,
    nama_kelas: k.nama,
    jenjang: "SMP",
    fase: "D",
    tingkat: k.tingkat,
    rombel: k.rombel,
  }));
  const { data: kelasList, error: kelasErr } = await supabase
    .from("kelas")
    .insert(kelasInserts)
    .select("id,nama_kelas,tingkat");
  if (kelasErr) throw kelasErr;

  console.log("Membuat 8 modul ajar per kelas...");
  const allModul = [];
  for (const kelas of kelasList) {
    const modulRows = MODUL_SMP.map((judul, i) => ({
      id_guru: guruId,
      id_kelas: kelas.id,
      urutan: i + 1,
      judul,
    }));
    const { data: modulList, error: modulErr } = await supabase
      .from("modul_ajar")
      .insert(modulRows)
      .select("id,urutan,id_kelas");
    if (modulErr) throw modulErr;
    allModul.push(...(modulList ?? []));
  }

  const progressRows = [];
  for (const kelas of kelasList) {
    await supabase.from("kelas_mata_pelajaran").insert({
      id_kelas: kelas.id,
      id_mata_pelajaran: mapelId,
      id_guru_pengampu: guruId,
    });

    const modulForKelas = allModul.filter((m) => m.id_kelas === kelas.id);
    for (const modul of modulForKelas) {
      progressRows.push({
        id_kelas: kelas.id,
        id_modul: modul.id,
        selesai: Math.random() < 0.45,
      });
    }
  }
  await batchInsert(supabase, "kelas_modul_progress", progressRows);

  console.log("Membuat 240 siswa (40 per kelas)...");
  const allSiswa = [];
  let globalIdx = 0;
  for (const kelas of kelasList) {
    const siswaRows = [];
    for (let i = 1; i <= 40; i++) {
      globalIdx++;
      const jk = Math.random() < 0.5 ? "L" : "P";
      const nama = `${pick(DEPAN)} ${pick(BELAKANG)}`;
      siswaRows.push({
        id_kelas: kelas.id,
        nisn: randomNisn(),
        nis: `${kelas.tingkat}${String(i).padStart(2, "0")}${globalIdx}`,
        nama_siswa: nama,
        jenis_kelamin: jk,
        tempat_lahir: pick(["Jakarta", "Bandung", "Surabaya", "Semarang", "Yogyakarta"]),
        tanggal_lahir: `${randInt(2010, 2013)}-${String(randInt(1, 12)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`,
        nama_ayah: `Bapak ${pick(BELAKANG)}`,
        nama_ibu: `Ibu ${pick(BELAKANG)}`,
        alamat: `Jl. Merdeka No. ${randInt(1, 200)}, Kota Demo`,
        anak_ke: randInt(1, 3),
        jumlah_saudara: randInt(0, 4),
        is_deleted: false,
      });
    }
    const { data: inserted, error: siswaErr } = await supabase
      .from("siswa")
      .insert(siswaRows)
      .select("id,id_kelas");
    if (siswaErr) throw siswaErr;
    allSiswa.push(...inserted);
  }

  console.log("Membuat TP, lingkup materi, indikator, rubrik...");
  /** kelasId → { indikatorId, lmId }[] */
  const indikatorByKelas = new Map();

  for (const kelas of kelasList) {
    const kelasIndikators = [];
    const lmInserts = LM_SMP.map((lm, idx) => ({
      id_kelas: kelas.id,
      id_mata_pelajaran: mapelId,
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

    for (const tpDef of TP_SMP) {
      const lmId = lmList[tpDef.lm].id;
      const { data: tp, error: tpErr } = await supabase
        .from("tujuan_pembelajaran")
        .insert({
          id_kelas: kelas.id,
          id_mata_pelajaran: mapelId,
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
        kriteria_json: null,
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

    indikatorByKelas.set(kelas.id, kelasIndikators);

    const semester2Tp = TP_SMP.slice(0, 2).map((tpDef, idx) => ({
      id_kelas: kelas.id,
      id_mata_pelajaran: mapelId,
      semester: 2,
      kode_tp: `S2-${tpDef.kode}`,
      deskripsi_tp: `[Semester 2] ${tpDef.deskripsi}`,
    }));
    const { data: tpS2, error: tpS2Err } = await supabase
      .from("tujuan_pembelajaran")
      .insert(semester2Tp)
      .select("id");
    if (tpS2Err) throw tpS2Err;

    for (const tp of tpS2) {
      await supabase.from("rubrik").insert({
        id_tp: tp.id,
        skala_penilaian: "ANGKA",
      });
      await supabase.from("indikator").insert({
        id_tp: tp.id,
        kode_indikator: "1",
        deskripsi_indikator: "Indikator capaian semester 2.",
      });
    }
  }

  console.log("Mengisi penilaian acak (formatif, sumatif LM/SAS, remedial, pengayaan)...");
  const nilaiRows = buildNilaiRowsForIndikators(allSiswa, indikatorByKelas);
  await batchInsert(supabase, "nilai", nilaiRows, 100);

  console.log("Mengisi absensi acak (20 hari terakhir)...");
  const absensiRows = [];
  const today = new Date();
  for (const siswa of allSiswa) {
    for (let d = 0; d < 20; d++) {
      const dt = new Date(today);
      dt.setDate(dt.getDate() - d);
      if (dt.getDay() === 0 || dt.getDay() === 6) continue;
      const r = Math.random();
      let status = "H";
      if (r > 0.92) status = "A";
      else if (r > 0.85) status = "S";
      else if (r > 0.78) status = "I";
      absensiRows.push({
        id_siswa: siswa.id,
        tanggal: dt.toISOString().slice(0, 10),
        status,
      });
    }
  }
  await batchInsert(supabase, "absensi", absensiRows, 150);

  const eRaporStats = await seedERaporDemoData(supabase, {
    guruId,
    kelasList,
    allSiswa,
    tahunAjaran: pengaturanBase.tahun_ajaran,
    semester: 1,
    bobot: {
      formatif: pengaturanBase.bobot_formatif,
      sumatifLm: pengaturanBase.bobot_sumatif_lm,
      sas: pengaturanBase.bobot_sas,
    },
  });

  console.log("\n✅ Seed selesai!\n");
  console.log(`   Guru      : ${guru.email}`);
  console.log(`   Kelas     : ${kelasList.length} (${demoNames.join(", ")})`);
  console.log(`   Siswa     : ${allSiswa.length} (40/kelas)`);
  console.log(`   Modul     : ${modulList.length} modul ajar SMP`);
  console.log(`   TP        : 4 TP + 2 indikator/kelas (Semester 1)`);
  console.log(`   Nilai     : ${nilaiRows.length} baris penilaian acak`);
  console.log(`   Absensi   : ${absensiRows.length} baris`);
  console.log(`   Rapor     : ${eRaporStats.raporMapelCount} baris mapel (${eRaporStats.mapelCount} mapel MAN)`);
  console.log("\n   Buka /kelas, /siswa, /tp, /nilai, /absensi, /e-rapor untuk uji fitur.\n");
}

main().catch((err) => {
  console.error("\n❌ Seed gagal:", err.message ?? err);
  process.exit(1);
});
