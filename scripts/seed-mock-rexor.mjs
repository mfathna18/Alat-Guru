/**
 * Mock data lengkap SMA Kelas 10 untuk akun rexorfathan@gmail.com
 * - 3 kelas (X-A, X-B, X-C), 40 siswa/kelas
 * - Semua mapel MAN SMA IPS: TP + rubrik + indikator (semester 1 & 2)
 * - Nilai formatif, STS, SAS, remedial, pengayaan
 * - Rapor mapel + sikap spiritual/sosial (semester 1 & 2)
 *
 * Jalankan: npm run seed:rexor
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import {
  batchInsert,
  batchUpsert,
  pick,
  randInt,
  randScore,
  seedManMapel,
  SIKAP_SPIRITUAL_NOTES,
  SIKAP_SOSIAL_NOTES,
  EKSKUL_DEMO,
  EKSKUL_PREDIKAT,
} from "./seed-helpers.mjs";

const TARGET_EMAIL = "rexorfathan@gmail.com";

const DEMO_KELAS = [
  { nama: "X-A", tingkat: "10", rombel: "A" },
  { nama: "X-B", tingkat: "10", rombel: "B" },
  { nama: "X-C", tingkat: "10", rombel: "C" },
];

const DEPAN = [
  "Ahmad", "Budi", "Citra", "Dewi", "Eko", "Fitri", "Gita", "Hadi", "Indra", "Joko",
  "Kartika", "Lina", "Maya", "Nadia", "Oki", "Putri", "Rafi", "Sari", "Taufik", "Umar",
  "Vina", "Wulan", "Yoga", "Zahra", "Agus", "Bayu", "Candra", "Dian", "Eka", "Farhan",
];

const BELAKANG = [
  "Saputra", "Wijaya", "Pratama", "Santoso", "Hidayat", "Nugroho", "Setiawan", "Kusuma",
  "Permata", "Lestari", "Anggraini", "Mahardika", "Ramadhan", "Susanto", "Wibowo", "Utami",
  "Purnama", "Cahyono", "Maulana", "Rizki",
];

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

function randomNisn() {
  return String(randInt(1000000000, 9999999999));
}

function tpDefsForMapel(namaMapel, semester, mapelId) {
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

function buildNilaiRows(siswaList, indikatorByKelas) {
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
      nilaiRows.push({
        id_siswa: siswa.id,
        id_indikator: indId,
        jenis_asesmen: "REMEDIAL",
        skor_angka: randInt(base < 70 ? 68 : 72, 85),
        skor_kualitatif: null,
        tipe_sumatif: null,
        id_lingkup_materi: null,
      });
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
  return nilaiRows;
}

function computeRaporScores(bobot, includeDual = true) {
  const fmt = randScore();
  const sts = randScore();
  const sas = randScore();
  const nilai_akhir = Math.round(
    (fmt * bobot.formatif + sts * bobot.sumatifLm + sas * bobot.sas) / 100,
  );
  const scores = {
    nilai_formatif: fmt,
    nilai_sumatif_lm: sts,
    nilai_sas: sas,
    nilai_akhir,
    deskripsi_capaian: `Menunjukkan penguasaan ${nilai_akhir >= 85 ? "sangat baik" : nilai_akhir >= 70 ? "baik" : "cukup"} pada materi semester ini.`,
  };
  if (includeDual) {
    scores.nilai_pengetahuan = Math.round((fmt + sas) / 2);
    scores.nilai_keterampilan = Math.round((sts + sas) / 2);
  }
  return scores;
}

async function seedTpForKelas(supabase, kelasId, scorableMapel) {
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
          indikatorIds.push(indRow.id);
        }
      }
    }
  }

  return indikatorIds;
}

async function seedRaporAndSikap(supabase, {
  guruId,
  kelasList,
  allSiswa,
  scorableMapel,
  tahunAjaran,
  bobot,
  includeDual,
}) {
  const kmpRows = [];
  for (const kelas of kelasList) {
    for (const mapel of scorableMapel) {
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

  const targetEmail = process.env.SEED_GURU_EMAIL?.trim() || TARGET_EMAIL;

  const { data: guru, error: guruErr } = await supabase
    .from("guru")
    .select("id,email,nama_guru,nip_guru")
    .eq("email", targetEmail)
    .maybeSingle();

  if (guruErr) throw guruErr;
  if (!guru) {
    console.error(`Guru dengan email ${targetEmail} tidak ditemukan. Login/register dulu.`);
    process.exit(1);
  }

  const guruId = guru.id;
  console.log(`\n🌱 Seed mock SMA Kelas 10 untuk: ${guru.nama_guru} (${guru.email})\n`);

  const tahunAjaran = "2025/2026";
  const bobot = { formatif: 30, sumatifLm: 40, sas: 30 };

  const { data: existingPengaturan } = await supabase
    .from("pengaturan_sekolah")
    .select("id")
    .eq("id_guru", guruId)
    .maybeSingle();

  const pengaturanPayload = {
    id_guru: guruId,
    nama_sekolah: "MAN 1 Demo Kurikulum Merdeka",
    tahun_ajaran: tahunAjaran,
    nama_kepsek: "Dr. Ahmad Fauzi, M.Pd.",
    nip_kepsek: "196801011990031001",
    jenjang: "SMA",
    alamat_sekolah: "Jl. Pendidikan No. 12, Kota Demo",
    kabupaten_kota: "Kota Demo",
    provinsi: "Jawa Tengah",
    nama_wali_kelas: guru.nama_guru,
    nip_wali_kelas: guru.nip_guru ?? "198501012010011001",
    bobot_formatif: bobot.formatif,
    bobot_sumatif_lm: bobot.sumatifLm,
    bobot_sas: bobot.sas,
    rapor_tampilkan_angka: true,
    rapor_tampilkan_predikat: true,
    kkm_angka: 70,
    ambang_pengayaan_angka: 85,
    rapor_template_id: "semester-ganjil-man",
    rapor_watermark_logo: true,
    rapor_slogan: "Belajar adalah Ibadah. Prestasi untuk Dakwah",
  };

  if (existingPengaturan) {
    await supabase.from("pengaturan_sekolah").update(pengaturanPayload).eq("id", existingPengaturan.id);
  } else {
    await supabase.from("pengaturan_sekolah").insert(pengaturanPayload);
  }

  console.log("Menyusun struktur mapel MAN SMA IPS...");
  await seedManMapel(supabase, guruId);
  const { data: mapelFull, error: mapelErr } = await supabase
    .from("mata_pelajaran")
    .select("id, nama_mapel, is_group_header")
    .eq("id_guru", guruId)
    .eq("is_active", true);
  if (mapelErr) throw mapelErr;
  const scorableMapel = (mapelFull ?? []).filter((m) => !m.is_group_header);
  console.log(`   ${scorableMapel.length} mapel penilaian`);

  const demoNames = DEMO_KELAS.map((k) => k.nama);
  const { data: oldKelas } = await supabase
    .from("kelas")
    .select("id")
    .eq("id_guru", guruId)
    .in("nama_kelas", demoNames);

  if (oldKelas?.length) {
    console.log(`Menghapus ${oldKelas.length} kelas demo lama (cascade)...`);
    await supabase.from("kelas").delete().in("id", oldKelas.map((k) => k.id));
  }

  console.log("Membuat 3 kelas SMA Kelas 10...");
  const kelasInserts = DEMO_KELAS.map((k) => ({
    id_guru: guruId,
    nama_kelas: k.nama,
    jenjang: "SMA",
    fase: "F",
    tingkat: k.tingkat,
    rombel: k.rombel,
  }));
  const { data: kelasList, error: kelasErr } = await supabase
    .from("kelas")
    .insert(kelasInserts)
    .select("id,nama_kelas,tingkat");
  if (kelasErr) throw kelasErr;

  console.log("Membuat 120 siswa (40 per kelas)...");
  const allSiswa = [];
  let globalIdx = 0;
  for (const kelas of kelasList) {
    const siswaRows = [];
    for (let i = 1; i <= 40; i++) {
      globalIdx++;
      const jk = Math.random() < 0.5 ? "L" : "P";
      siswaRows.push({
        id_kelas: kelas.id,
        nisn: randomNisn(),
        nis: `10${String(i).padStart(2, "0")}${globalIdx}`,
        nama_siswa: `${pick(DEPAN)} ${pick(BELAKANG)}`,
        jenis_kelamin: jk,
        tempat_lahir: pick(["Jakarta", "Bandung", "Surabaya", "Semarang", "Yogyakarta"]),
        tanggal_lahir: `${randInt(2008, 2009)}-${String(randInt(1, 12)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`,
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

  console.log("Membuat TP, lingkup materi, rubrik, dan indikator (semua mapel × 2 semester)...");
  const indikatorByKelas = new Map();
  for (const kelas of kelasList) {
    const ids = await seedTpForKelas(supabase, kelas.id, scorableMapel);
    indikatorByKelas.set(
      kelas.id,
      ids.map((id) => ({ id })),
    );
    console.log(`   ${kelas.nama_kelas}: ${ids.length} indikator`);
  }

  console.log("Mengisi nilai (formatif, STS, SAS, remedial, pengayaan)...");
  const nilaiRows = buildNilaiRows(allSiswa, indikatorByKelas);
  await batchInsert(supabase, "nilai", nilaiRows, 150);

  console.log("Mengisi rapor mapel dan sikap spiritual-sosial (semester 1 & 2)...");
  const { raporMapelCount } = await seedRaporAndSikap(supabase, {
    guruId,
    kelasList,
    allSiswa,
    scorableMapel,
    tahunAjaran,
    bobot,
    includeDual: true,
  });

  const totalTp = scorableMapel.length * 2 * 2 * kelasList.length;
  const totalInd = [...indikatorByKelas.values()].reduce((n, arr) => n + arr.length, 0);

  console.log("\n✅ Seed mock selesai!\n");
  console.log(`   Guru         : ${guru.email}`);
  console.log(`   Kelas        : ${kelasList.length} (${demoNames.join(", ")})`);
  console.log(`   Siswa        : ${allSiswa.length} (40/kelas)`);
  console.log(`   Mapel        : ${scorableMapel.length} mapel MAN SMA IPS`);
  console.log(`   TP           : ~${totalTp} (2 TP/mapel/semester/kelas)`);
  console.log(`   Indikator    : ${totalInd}`);
  console.log(`   Nilai        : ${nilaiRows.length} baris`);
  console.log(`   Rapor mapel  : ${raporMapelCount} baris (2 semester)`);
  console.log(`   Sikap        : ${allSiswa.length * 2} baris e_rapor (spiritual + sosial)`);
  console.log("\n   Buka /kelas, /tp, /nilai, /sikap-rapor, /e-rapor untuk uji fitur.\n");
}

main().catch((err) => {
  console.error("\n❌ Seed gagal:", err.message ?? err);
  process.exit(1);
});
