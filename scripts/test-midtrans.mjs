/**
 * One-off Midtrans key test — run: node scripts/test-midtrans.mjs
 * Does not print secret keys.
 */
import { readFileSync } from "fs";
import { resolve } from "path";

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

function normalizeServer(raw) {
  let key = raw.trim();
  key = key.replace(/^SB-Mid-server-Mid-server-/i, "SB-Mid-server-");
  key = key.replace(/^Mid-server-Mid-server-/i, "Mid-server-");
  if (/^Mid-server-/i.test(key) && !/^SB-Mid-server-/i.test(key)) {
    key = `SB-${key}`;
  }
  return key;
}

const env = loadEnv();
const serverKey = normalizeServer(env.MIDTRANS_SERVER_KEY ?? "");
const clientKey = (env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "")
  .replace(/^SB-Mid-client-Mid-client-/i, "SB-Mid-client-")
  .trim();
const isProd = env.MIDTRANS_IS_PRODUCTION === "true";
const base = isProd
  ? "https://app.midtrans.com"
  : "https://app.sandbox.midtrans.com";

console.log("Server key prefix:", serverKey.slice(0, 14) + "...");
console.log("Client key prefix:", clientKey.slice(0, 14) + "...");
console.log("Environment:", isProd ? "production" : "sandbox");
console.log("Server looks sandbox:", /^SB-Mid-server-/i.test(serverKey));
console.log("Client looks sandbox:", /^SB-Mid-client-/i.test(clientKey));

const rawServer = (env.MIDTRANS_SERVER_KEY ?? "").trim();
const variants = [
  { label: "raw from .env", key: rawServer },
  { label: "normalized", key: normalizeServer(rawServer) },
  { label: "without SB-", key: rawServer.replace(/^SB-/i, "") },
  { label: "with SB- added", key: rawServer.startsWith("SB-") ? rawServer : `SB-${rawServer}` },
];

for (const variant of variants) {
  if (!variant.key) continue;
  for (const envLabel of ["sandbox", "production"]) {
    const apiBase =
      envLabel === "production"
        ? "https://app.midtrans.com"
        : "https://app.sandbox.midtrans.com";
    const auth = Buffer.from(`${variant.key}:`).toString("base64");
    const res = await fetch(`${apiBase}/snap/v1/transactions`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: `TEST-${Date.now()}-${variant.label.replace(/\W/g, "")}`,
          gross_amount: 20000,
        },
      }),
    });
    const data = await res.json();
    console.log(
      variant.label + " @ " + envLabel + ":",
      "status",
      res.status,
      data.token ? "OK" : "FAIL",
    );
  }
}
