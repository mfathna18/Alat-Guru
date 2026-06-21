/**
 * Isi / refresh nilai acak untuk semua siswa guru (tanpa hapus kelas).
 * Jalankan: npm run seed:fill-nilai
 * Opsional: SEED_GURU_EMAIL=you@mail.com npm run seed:fill-nilai
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import {
  batchInsert,
  batchUpsert,
  buildNilaiRowsForIndikators,
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
  let guruQuery = supabase.from("guru").select("id,email,nama_guru");
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

  const guru = gurus[0];
  const guruId = guru.id;
  console.log(`\n🎲 Isi nilai acak untuk: ${guru.nama_guru} (${guru.email})\n`);

  const { data: pengaturan } = await supabase
    .from("pengaturan_sekolah")
    .select("*")
    .eq("id_guru", guruId)
    .maybeSingle();

  const tahunAjaran = pengaturan?.tahun_ajaran ?? "2025/2026";
  const semester = 1;
  const bobot = {
    formatif: pengaturan?.bobot_formatif ?? 30,
    sumatifLm: pengaturan?.bobot_sumatif_lm ?? 40,
    sas: pengaturan?.bobot_sas ?? 30,
  };

  const { data: kelasList, error: kelasErr } = await supabase
    .from("kelas")
    .select("id,nama_kelas")
    .eq("id_guru", guruId)
    .order("nama_kelas");

  if (kelasErr) throw kelasErr;
  if (!kelasList?.length) {
    console.error("Belum ada kelas. Jalankan npm run seed:demo terlebih dahulu.");
    process.exit(1);
  }

  const kelasIds = kelasList.map((k) => k.id);
  const { data: allSiswa, error: siswaErr } = await supabase
    .from("siswa")
    .select("id,id_kelas")
    .in("id_kelas", kelasIds)
    .eq("is_deleted", false);

  if (siswaErr) throw siswaErr;
  if (!allSiswa?.length) {
    console.error("Belum ada siswa. Jalankan npm run seed:demo terlebih dahulu.");
    process.exit(1);
  }

  console.log(`Ditemukan ${kelasList.length} kelas, ${allSiswa.length} siswa.`);

  const indikatorByKelas = new Map();
  for (const kelas of kelasList) {
    const { data: tpList } = await supabase
      .from("tujuan_pembelajaran")
      .select("id, id_lingkup_materi")
      .eq("id_kelas", kelas.id)
      .eq("semester", semester);

    const kelasIndikators = [];
    for (const tp of tpList ?? []) {
      const lmId = tp.id_lingkup_materi;
      const { data: inds } = await supabase
        .from("indikator")
        .select("id")
        .eq("id_tp", tp.id);

      for (const ind of inds ?? []) {
        kelasIndikators.push({ id: ind.id, lmId });
      }
    }
    indikatorByKelas.set(kelas.id, kelasIndikators);
  }

  const totalInd = [...indikatorByKelas.values()].reduce((n, arr) => n + arr.length, 0);
  if (totalInd === 0) {
    console.error(
      "Belum ada TP/indikator. Jalankan npm run seed:demo untuk membuat struktur penilaian.",
    );
    process.exit(1);
  }

  const siswaIds = allSiswa.map((s) => s.id);
  console.log("Menghapus nilai lama siswa...");
  const { error: delNilaiErr } = await supabase.from("nilai").delete().in("id_siswa", siswaIds);
  if (delNilaiErr) throw delNilaiErr;

  console.log("Mengisi penilaian acak (formatif, sumatif, remedial, pengayaan)...");
  const nilaiRows = buildNilaiRowsForIndikators(allSiswa, indikatorByKelas);
  await batchInsert(supabase, "nilai", nilaiRows, 100);

  const eRaporStats = await seedERaporDemoData(supabase, {
    guruId,
    kelasList,
    allSiswa,
    tahunAjaran,
    semester,
    bobot,
  });

  console.log("\n✅ Isi nilai acak selesai!\n");
  console.log(`   Guru         : ${guru.email}`);
  console.log(`   Kelas        : ${kelasList.length}`);
  console.log(`   Siswa        : ${allSiswa.length}`);
  console.log(`   Nilai        : ${nilaiRows.length} baris`);
  console.log(`   Rapor mapel  : ${eRaporStats.raporMapelCount} baris (${eRaporStats.mapelCount} mapel)`);
  console.log(`   Ekskul       : ${eRaporStats.ekskulCount} kegiatan`);
  console.log("\n   Buka /nilai dan /e-rapor untuk uji fitur.\n");
}

main().catch((err) => {
  console.error("\n❌ Gagal:", err.message ?? err);
  process.exit(1);
});
