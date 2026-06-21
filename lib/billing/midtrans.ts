import { createHash } from "crypto";

const SANDBOX_BASE = "https://app.sandbox.midtrans.com";
const PROD_BASE = "https://app.midtrans.com";

function getBaseUrl() {
  return resolveMidtransEnvironment() === "production" ? PROD_BASE : SANDBOX_BASE;
}

/** Tentukan sandbox vs production dari prefix key (lebih andal daripada env saja). */
export function resolveMidtransEnvironment(): "sandbox" | "production" {
  const serverEnv = detectMidtransKeyEnvironment(
    process.env.MIDTRANS_SERVER_KEY ?? "",
  );
  const clientEnv = detectMidtransKeyEnvironment(
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "",
  );

  if (serverEnv === "sandbox" || serverEnv === "production") return serverEnv;
  if (clientEnv === "sandbox" || clientEnv === "production") return clientEnv;

  const flag =
    process.env.MIDTRANS_IS_PRODUCTION === "true" ||
    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
  return flag ? "production" : "sandbox";
}

export function isMidtransProductionMode() {
  return resolveMidtransEnvironment() === "production";
}

function getServerKey() {
  const key = normalizeMidtransServerKey(process.env.MIDTRANS_SERVER_KEY ?? "");
  if (!key) throw new Error("MIDTRANS_SERVER_KEY belum dikonfigurasi.");
  return key;
}

function authHeader() {
  const key = getServerKey();
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

export interface CreateSnapInput {
  orderId: string;
  grossAmount: number;
  customerEmail: string;
  customerName: string;
}

export async function createSnapTransaction(input: CreateSnapInput) {
  const res = await fetch(`${getBaseUrl()}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: input.orderId,
        gross_amount: input.grossAmount,
      },
      customer_details: {
        email: input.customerEmail,
        first_name: input.customerName,
      },
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/billing/success`,
      },
    }),
  });

  const data = (await res.json()) as {
    token?: string;
    error_messages?: string[];
  };

  if (!res.ok || !data.token) {
    const messages = data.error_messages?.join(" ") ?? "";
    const env = resolveMidtransEnvironment();
    if (res.status === 401 || messages.includes("Access denied")) {
      throw new Error(
        env === "production"
          ? "Server Key Midtrans Production ditolak. Salin ulang pasangan Server Key + Client Key dari dashboard.midtrans.com → Settings → Access Keys, paste ke .env.local, restart dev server."
          : "Server Key Midtrans Sandbox ditolak. Salin ulang pasangan key dari dashboard.sandbox.midtrans.com → Settings → Access Keys (harus diawali SB-Mid-server- / SB-Mid-client-), restart dev server.",
      );
    }
    throw new Error(
      messages || "Gagal membuat transaksi Midtrans.",
    );
  }

  return data.token;
}

export interface MidtransNotification {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key?: string;
  transaction_status: string;
  payment_type?: string;
  transaction_id?: string;
}

export function verifyMidtransSignature(payload: MidtransNotification): boolean {
  const serverKey = getServerKey();
  if (!payload.signature_key) return false;

  const raw = `${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`;
  const expected = createHash("sha512").update(raw).digest("hex");
  return expected === payload.signature_key;
}

export function isMidtransPaid(status: string): boolean {
  return status === "capture" || status === "settlement";
}

export function isMidtransPending(status: string): boolean {
  return status === "pending";
}

export function isMidtransFailed(status: string): boolean {
  return ["deny", "cancel", "expire", "failure"].includes(status);
}

export function normalizeMidtransClientKey(raw: string): string {
  let key = raw.trim();
  if (!key || key === "...") return "";

  key = key.replace(/^SB-Mid-client-Mid-client-/i, "SB-Mid-client-");
  key = key.replace(/^Mid-client-Mid-client-/i, "Mid-client-");

  return key;
}

export function normalizeMidtransServerKey(raw: string): string {
  let key = raw.trim();
  if (!key || key === "...") return "";

  key = key.replace(/^SB-Mid-server-Mid-server-/i, "SB-Mid-server-");
  key = key.replace(/^Mid-server-Mid-server-/i, "Mid-server-");

  return key;
}

export function detectMidtransKeyEnvironment(key: string): "sandbox" | "production" | "unknown" {
  const k = key.trim();
  if (/^SB-Mid-(server|client)-/i.test(k)) return "sandbox";
  if (/^Mid-(server|client)-/i.test(k)) return "production";
  return "unknown";
}

export function getMidtransEnvironmentMismatchMessage(): string | null {
  const configuredProd =
    process.env.MIDTRANS_IS_PRODUCTION === "true" ||
    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
  const resolved = resolveMidtransEnvironment();
  const serverEnv = detectMidtransKeyEnvironment(
    process.env.MIDTRANS_SERVER_KEY ?? "",
  );
  const clientEnv = detectMidtransKeyEnvironment(
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "",
  );

  if (serverEnv === "unknown" || clientEnv === "unknown") {
    return "Format key Midtrans tidak dikenali. Salin ulang Server Key & Client Key dari Dashboard → Settings → Access Keys.";
  }
  if (serverEnv !== clientEnv) {
    return "Server Key dan Client Key dari environment berbeda (sandbox vs production). Salin keduanya dari dashboard yang sama.";
  }
  if (configuredProd && resolved === "sandbox") {
    return "MIDTRANS_IS_PRODUCTION=true tapi key Sandbox (SB-Mid-...). Sesuaikan key atau set MIDTRANS_IS_PRODUCTION=false.";
  }
  if (!configuredProd && resolved === "production") {
    return "Key Anda format Production (Mid-server-...). App akan memakai API production. Untuk sandbox, salin key SB-Mid-... dari dashboard.sandbox.midtrans.com.";
  }
  return null;
}

export function diagnoseMidtransClientKey(raw: string): {
  ok: boolean;
  message?: string;
} {
  const key = normalizeMidtransClientKey(raw);
  if (!key) {
    return {
      ok: false,
      message:
        "NEXT_PUBLIC_MIDTRANS_CLIENT_KEY kosong. Isi di .env.local lalu restart dev server.",
    };
  }
  if (!/^SB-Mid-client-/i.test(key) && !/^Mid-client-/i.test(key)) {
    return {
      ok: false,
      message:
        "Format Client Key salah. Harus diawali SB-Mid-client-... (salin dari Midtrans → Access Keys).",
    };
  }
  return { ok: true };
}

export function diagnoseMidtransServerKey(raw: string): {
  ok: boolean;
  message?: string;
} {
  const key = normalizeMidtransServerKey(raw);
  if (!key) {
    return {
      ok: false,
      message:
        "MIDTRANS_SERVER_KEY kosong. Isi di .env.local lalu restart dev server.",
    };
  }
  if (!/^SB-Mid-server-/i.test(key) && !/^Mid-server-/i.test(key)) {
    return {
      ok: false,
      message:
        "Format Server Key salah. Harus diawali SB-Mid-server-... (salin dari Midtrans → Access Keys).",
    };
  }
  return { ok: true };
}

export function getMidtransClientKey() {
  return normalizeMidtransClientKey(
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "",
  );
}

/** Cek di browser — hanya NEXT_PUBLIC_* yang tersedia di client bundle. */
export function isMidtransSnapConfigured() {
  return diagnoseMidtransClientKey(
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "",
  ).ok;
}

/** Cek di server (API route / webhook) — MIDTRANS_SERVER_KEY tidak diekspos ke browser. */
export function isMidtransServerConfigured() {
  return diagnoseMidtransServerKey(process.env.MIDTRANS_SERVER_KEY ?? "").ok;
}

/** @deprecated Prefer isMidtransServerConfigured atau isMidtransSnapConfigured */
export function isMidtransConfigured() {
  return isMidtransServerConfigured();
}
