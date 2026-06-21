/**
 * Sinkronkan subscriptions dari profiles untuk satu user (perbaikan data).
 * Jalankan: node scripts/sync-profile-subscription.mjs email@example.com
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
  console.error("Usage: node scripts/sync-profile-subscription.mjs <email>");
  process.exit(1);
}

const env = loadEnv();
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: profile, error: profileErr } = await admin
  .from("profiles")
  .select("id, email, subscription_plan, subscription_expires_at")
  .ilike("email", email)
  .maybeSingle();

if (profileErr || !profile) {
  console.error("Profil tidak ditemukan:", profileErr?.message ?? email);
  process.exit(1);
}

const { data: guru } = await admin
  .from("guru")
  .select("id")
  .eq("auth_user_id", profile.id)
  .maybeSingle();

if (!guru) {
  console.error("Guru tidak ditemukan untuk", email);
  process.exit(1);
}

const { data: defaultPlan } = await admin
  .from("plans")
  .select("id")
  .eq("slug", "premium-monthly")
  .maybeSingle();

if (!defaultPlan) {
  console.error("Plan premium-monthly tidak ditemukan");
  process.exit(1);
}

const expiresAt = profile.subscription_expires_at;
const isActive =
  expiresAt && new Date(expiresAt) > new Date() && profile.subscription_plan !== "free";

if (isActive) {
  const now = new Date().toISOString();
  const grace = new Date(expiresAt);
  grace.setDate(grace.getDate() + 1);

  const { error } = await admin
    .from("subscriptions")
    .update({
      plan_id: defaultPlan.id,
      status: "active",
      trial_ends_at: null,
      current_period_start: now,
      current_period_end: expiresAt,
      grace_ends_at: grace.toISOString(),
      cancelled_at: null,
    })
    .eq("id_guru", guru.id);

  if (error) {
    console.error("Gagal update subscriptions:", error.message);
    process.exit(1);
  }

  console.log("Sinkronisasi OK → active hingga", expiresAt);
} else {
  const { error } = await admin
    .from("subscriptions")
    .update({
      status: "expired",
      trial_ends_at: null,
      current_period_start: null,
      current_period_end: null,
      grace_ends_at: null,
    })
    .eq("id_guru", guru.id);

  if (error) {
    console.error("Gagal update subscriptions:", error.message);
    process.exit(1);
  }

  console.log("Sinkronisasi OK → expired (free / tidak aktif)");
}

console.log({ email, plan: profile.subscription_plan, expiresAt });
