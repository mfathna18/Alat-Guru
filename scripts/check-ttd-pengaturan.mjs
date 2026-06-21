/**
 * Cek kolom TTD & data pengaturan per email.
 * Usage: node scripts/check-ttd-pengaturan.mjs [email]
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

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

const email = (process.argv[2] ?? "rexorfathan@gmail.com").trim().toLowerCase();
const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase env in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: guru, error: guruErr } = await supabase
  .from("guru")
  .select("id, email, nama_guru")
  .ilike("email", email)
  .maybeSingle();

if (guruErr) {
  console.error("Guru lookup failed:", guruErr.message);
  process.exit(1);
}

if (!guru) {
  console.error(`Guru tidak ditemukan: ${email}`);
  process.exit(1);
}

const { data: pengaturan, error: pengErr } = await supabase
  .from("pengaturan_sekolah")
  .select(
    "id, nama_sekolah, nama_wali_kelas, ttd_wali_kelas_url, ttd_kepsek_url, updated_at",
  )
  .eq("id_guru", guru.id)
  .maybeSingle();

if (pengErr) {
  console.error("Pengaturan lookup failed:", pengErr.message);
  if (pengErr.message.includes("ttd_")) {
    console.error("\nKolom TTD belum terdeteksi. Pastikan migrasi 016 sudah benar.");
  }
  process.exit(1);
}

console.log("Migrasi TTD: OK (kolom dapat dibaca)");
console.log(`Guru: ${guru.nama_guru} (${guru.email})`);

if (!pengaturan) {
  console.log("Pengaturan sekolah: belum ada — simpan Pengaturan Sekolah dulu.");
  process.exit(0);
}

console.log(`Sekolah: ${pengaturan.nama_sekolah}`);
console.log(`Wali kelas: ${pengaturan.nama_wali_kelas ?? "(kosong)"}`);
console.log(`TTD wali kelas: ${pengaturan.ttd_wali_kelas_url ? "ADA" : "belum diunggah"}`);
console.log(`TTD kepala sekolah: ${pengaturan.ttd_kepsek_url ? "ADA" : "belum diunggah"}`);
if (pengaturan.ttd_wali_kelas_url) {
  console.log(`  → ${pengaturan.ttd_wali_kelas_url}`);
}
if (pengaturan.ttd_kepsek_url) {
  console.log(`  → ${pengaturan.ttd_kepsek_url}`);
}
