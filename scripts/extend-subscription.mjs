/**
 * Perpanjang langganan guru berdasarkan email.
 * Usage: node scripts/extend-subscription.mjs <email> [days]
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const GRACE_DAYS = 1;

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

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const email = process.argv[2]?.trim().toLowerCase();
const days = Number.parseInt(process.argv[3] ?? "7", 10);

if (!email) {
  console.error("Usage: node scripts/extend-subscription.mjs <email> [days]");
  process.exit(1);
}

if (!Number.isFinite(days) || days < 1) {
  console.error("Days must be a positive integer.");
  process.exit(1);
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
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

const { data: sub, error: subErr } = await supabase
  .from("subscriptions")
  .select("*")
  .eq("id_guru", guru.id)
  .maybeSingle();

if (subErr) {
  console.error("Subscription lookup failed:", subErr.message);
  process.exit(1);
}

if (!sub) {
  console.error(`Subscription tidak ditemukan untuk ${email}`);
  process.exit(1);
}

const now = new Date();
let payload;

if (sub.current_period_end) {
  const base = new Date(
    Math.max(now.getTime(), new Date(sub.current_period_end).getTime()),
  );
  const newPeriodEnd = addDays(base, days);
  const newGraceEnd = addDays(newPeriodEnd, GRACE_DAYS);
  payload = {
    status: "active",
    trial_ends_at: null,
    current_period_end: newPeriodEnd.toISOString(),
    grace_ends_at: newGraceEnd.toISOString(),
    cancelled_at: null,
    updated_at: now.toISOString(),
  };
} else {
  const base = sub.trial_ends_at
    ? new Date(Math.max(now.getTime(), new Date(sub.trial_ends_at).getTime()))
    : now;
  const newTrialEnd = addDays(base, days);
  payload = {
    status: "trial",
    trial_ends_at: newTrialEnd.toISOString(),
    cancelled_at: null,
    updated_at: now.toISOString(),
  };
}

const { data: updated, error: updateErr } = await supabase
  .from("subscriptions")
  .update(payload)
  .eq("id", sub.id)
  .select("*")
  .single();

if (updateErr) {
  console.error("Update failed:", updateErr.message);
  process.exit(1);
}

console.log("Perpanjangan berhasil.");
console.log(`Guru: ${guru.nama_guru} (${guru.email})`);
console.log(`Status: ${sub.status} → ${updated.status}`);
console.log(`+${days} hari`);
if (updated.trial_ends_at) {
  console.log(`Trial berakhir: ${updated.trial_ends_at}`);
}
if (updated.current_period_end) {
  console.log(`Periode berakhir: ${updated.current_period_end}`);
}
if (updated.grace_ends_at) {
  console.log(`Grace berakhir: ${updated.grace_ends_at}`);
}
