/**
 * Hapus masa trial user berdasarkan email.
 * Jalankan: node scripts/remove-user-trial.mjs user@example.com
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

const email = (process.argv[2] ?? "").trim().toLowerCase();
if (!email) {
  console.error("Usage: node scripts/remove-user-trial.mjs <email>");
  process.exit(1);
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib di .env.local");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: guru, error: guruErr } = await admin
  .from("guru")
  .select("id, email, nama_guru")
  .ilike("email", email)
  .maybeSingle();

if (guruErr) {
  console.error("Gagal mencari guru:", guruErr.message);
  process.exit(1);
}

if (!guru) {
  console.error(`Guru dengan email ${email} tidak ditemukan.`);
  process.exit(1);
}

const { data: sub, error: subErr } = await admin
  .from("subscriptions")
  .select("id, status, trial_ends_at")
  .eq("id_guru", guru.id)
  .maybeSingle();

if (subErr) {
  console.error("Gagal mencari subscription:", subErr.message);
  process.exit(1);
}

if (sub) {
  const { error: updateSubErr } = await admin
    .from("subscriptions")
    .update({
      status: "expired",
      trial_ends_at: null,
    })
    .eq("id", sub.id);

  if (updateSubErr) {
    console.error("Gagal memperbarui subscription:", updateSubErr.message);
    process.exit(1);
  }
}

const { data: profile, error: profileErr } = await admin
  .from("profiles")
  .select("id, subscription_plan, subscription_expires_at")
  .ilike("email", email)
  .maybeSingle();

if (profileErr) {
  console.error("Gagal mencari profil:", profileErr.message);
  process.exit(1);
}

if (profile) {
  const { error: updateProfileErr } = await admin
    .from("profiles")
    .update({
      subscription_plan: "free",
      subscription_expires_at: null,
    })
    .eq("id", profile.id);

  if (updateProfileErr) {
    console.error("Gagal memperbarui profil:", updateProfileErr.message);
    process.exit(1);
  }
}

console.log("Trial dihapus untuk:", email);
console.log("Guru:", guru.nama_guru ?? guru.email, `(id: ${guru.id})`);
if (sub) {
  console.log("Subscription:", sub.status, "→ expired, trial_ends_at → null");
} else {
  console.log("Subscription: tidak ada baris (lewati)");
}
if (profile) {
  console.log(
    "Profile:",
    profile.subscription_plan,
    profile.subscription_expires_at,
    "→ free / null",
  );
} else {
  console.log("Profile: tidak ada baris (lewati)");
}
