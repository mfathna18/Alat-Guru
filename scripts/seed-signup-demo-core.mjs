/**
 * Data contoh otomatis untuk user baru — dipanggil saat registrasi.
 * 1 kelas SMA X-A (Contoh), 40 siswa, mapel MAN IPS, TP + nilai,
 * absensi Juni, sikap spiritual/sosial, dan e-rapor lengkap.
 */
import {
  batchInsert,
  batchUpsert,
  buildJuneAbsensiRows,
  buildNilaiRowsFull,
  pick,
  randInt,
  seedFullRaporAndSikap,
  seedManMapel,
  seedTpForKelas,
} from "./seed-helpers.mjs";

const DEMO_KELAS_NAME = "X-A (Contoh)";
const DEMO_STUDENT_COUNT = 40;
const TAHUN_AJARAN = "2025/2026";
const BOBOT = { formatif: 30, sumatifLm: 40, sas: 30 };
const MIN_DEMO_STUDENTS = 40;

const DEPAN = [
  "Ahmad", "Budi", "Citra", "Dewi", "Eko", "Fitri", "Gita", "Hadi", "Indra", "Joko",
  "Kartika", "Lina", "Maya", "Nadia", "Oki", "Putri", "Rafi", "Sari", "Taufik", "Umar",
  "Vina", "Wulan", "Yoga", "Zahra", "Agus", "Bayu", "Candra", "Dian", "Eka", "Farhan",
  "Galih", "Hana", "Irfan", "Jihan", "Kevin", "Laras", "Mirza", "Nisa", "Omar", "Prita",
];

const BELAKANG = [
  "Saputra", "Wijaya", "Pratama", "Santoso", "Hidayat", "Nugroho", "Setiawan", "Kusuma",
  "Permata", "Lestari", "Anggraini", "Mahardika", "Ramadhan", "Susanto", "Wibowo", "Utami",
  "Purnama", "Cahyono", "Maulana", "Rizki",
];

function randomNisn() {
  return String(randInt(1000000000, 9999999999));
}

async function clearIncompleteDemoKelas(supabase, guruId) {
  const { data: kelasRows, error } = await supabase
    .from("kelas")
    .select("id, nama_kelas")
    .eq("id_guru", guruId);

  if (error) throw error;
  if (!kelasRows?.length) return false;

  const demoKelas = kelasRows.filter((k) => k.nama_kelas.includes("(Contoh)"));
  const hasRealKelas = kelasRows.some((k) => !k.nama_kelas.includes("(Contoh)"));

  if (hasRealKelas) {
    return true;
  }

  if (demoKelas.length !== kelasRows.length) {
    return true;
  }

  for (const kelas of demoKelas) {
    const { count, error: countErr } = await supabase
      .from("siswa")
      .select("id", { count: "exact", head: true })
      .eq("id_kelas", kelas.id)
      .eq("is_deleted", false);

    if (countErr) throw countErr;
    if ((count ?? 0) >= MIN_DEMO_STUDENTS) {
      return true;
    }

    await supabase.from("kelas").delete().eq("id", kelas.id);
  }

  return false;
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

  const alreadyHasData = await clearIncompleteDemoKelas(supabase, guru.id);
  if (alreadyHasData) {
    return { seeded: false, reason: "already_has_data" };
  }

  const guruId = guru.id;

  const pengaturanBase = {
    id_guru: guruId,
    nama_sekolah: "MAN 1 Demo Kurikulum Merdeka (Data Contoh)",
    tahun_ajaran: TAHUN_AJARAN,
    nama_kepsek: "Dr. Ahmad Fauzi, M.Pd.",
    nip_kepsek: "196801011990031001",
    jenjang: "SMA",
    alamat_sekolah: "Jl. Pendidikan No. 12, Kota Demo",
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

  await seedManMapel(supabase, guruId);
  const { data: mapelFull, error: mapelErr } = await supabase
    .from("mata_pelajaran")
    .select("id, nama_mapel, is_group_header")
    .eq("id_guru", guruId)
    .eq("is_active", true);
  if (mapelErr) throw mapelErr;

  const mapelList = mapelFull ?? [];
  const scorableMapel = mapelList.filter((m) => !m.is_group_header);

  const { data: kelas, error: kelasErr } = await supabase
    .from("kelas")
    .insert({
      id_guru: guruId,
      nama_kelas: DEMO_KELAS_NAME,
      jenjang: "SMA",
      fase: "F",
      tingkat: "10",
      rombel: "A",
    })
    .select("id,nama_kelas,tingkat")
    .single();

  if (kelasErr) throw kelasErr;

  const siswaRows = [];
  for (let i = 1; i <= DEMO_STUDENT_COUNT; i++) {
    const jk = Math.random() < 0.5 ? "L" : "P";
    siswaRows.push({
      id_kelas: kelas.id,
      nisn: randomNisn(),
      nis: `10${String(i).padStart(2, "0")}${i}`,
      nama_siswa: `${DEPAN[i - 1]} ${pick(BELAKANG)}`,
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

  const { data: allSiswa, error: siswaErr } = await supabase
    .from("siswa")
    .insert(siswaRows)
    .select("id,id_kelas");
  if (siswaErr) throw siswaErr;

  const indikators = await seedTpForKelas(supabase, kelas.id, scorableMapel);
  const indikatorByKelas = new Map([[kelas.id, indikators]]);

  const nilaiRows = buildNilaiRowsFull(allSiswa, indikatorByKelas);
  await batchInsert(supabase, "nilai", nilaiRows, 150);

  const absensiRows = buildJuneAbsensiRows(allSiswa);
  await batchInsert(supabase, "absensi", absensiRows, 150);

  const { raporMapelCount } = await seedFullRaporAndSikap(supabase, {
    guruId,
    kelasList: [kelas],
    allSiswa,
    scorableMapel,
    mapelList,
    tahunAjaran: TAHUN_AJARAN,
    bobot: BOBOT,
    includeDual: true,
  });

  return {
    seeded: true,
    kelas: DEMO_KELAS_NAME,
    siswa: allSiswa.length,
    mapel: scorableMapel.length,
    indikator: indikators.length,
    nilai: nilaiRows.length,
    absensi: absensiRows.length,
    raporMapel: raporMapelCount,
  };
}
