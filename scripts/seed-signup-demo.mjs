/**
 * Jalankan data contoh signup untuk guru (uji manual).
 * npm run seed:signup-demo
 * SEED_GURU_EMAIL=you@mail.com npm run seed:signup-demo
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { seedSignupDemoForAuthUser } from "./seed-signup-demo-core.mjs";

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
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const email = process.env.SEED_GURU_EMAIL?.trim();
  if (!email) {
    console.error("Set SEED_GURU_EMAIL=you@mail.com");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: guru } = await supabase
    .from("guru")
    .select("auth_user_id,email")
    .eq("email", email)
    .maybeSingle();

  if (!guru?.auth_user_id) {
    console.error(`Guru ${email} tidak ditemukan.`);
    process.exit(1);
  }

  const result = await seedSignupDemoForAuthUser(supabase, guru.auth_user_id);
  console.log(result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
