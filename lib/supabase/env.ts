function cleanEnvValue(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/[\r\n\t]+/g, "");
  return trimmed.length > 0 ? trimmed : null;
}

/** Petunjuk setup env — Vercel production vs lokal. */
export function getSupabaseEnvSetupHint(): string {
  if (process.env.VERCEL) {
    return "Tambahkan di Vercel → Settings → Environment Variables (centang Production), lalu Redeploy tanpa cache.";
  }
  return "Isi file .env.local di root project, lalu restart dev server (npm run dev).";
}

function readSupabaseUrlRaw(): string | null {
  return (
    cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL) ??
    cleanEnvValue(process.env.SUPABASE_URL) ??
    null
  );
}

function readSupabaseKeyRaw(): string | null {
  return (
    cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ??
    cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ??
    cleanEnvValue(process.env.SUPABASE_ANON_KEY) ??
    null
  );
}

function normalizeSupabaseProjectUrl(url: string): string | null {
  if (!url.startsWith("https://") || !url.includes(".supabase.co")) {
    return null;
  }
  return url.replace(/\/+$/, "");
}

export function getSupabaseUrl() {
  const url = readSupabaseUrlRaw();
  if (!url) return null;
  if (url.startsWith("sb_")) return null;
  return normalizeSupabaseProjectUrl(url);
}

export function getSupabaseAnonKey() {
  const key = readSupabaseKeyRaw();
  if (!key || key.includes(".supabase.co")) return null;
  return key;
}

function readSupabaseServiceRoleKeyRaw(): string | null {
  return (
    cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY) ??
    cleanEnvValue(process.env.SUPABASE_SERVICE_KEY) ??
    null
  );
}

/** Service role key — hanya server-side (admin, webhook). */
export function getSupabaseServiceRoleKey(): string | null {
  const key = readSupabaseServiceRoleKeyRaw();
  if (!key || key.includes(".supabase.co")) return null;
  return key;
}

export function isSupabaseServiceRoleConfigured(): boolean {
  return Boolean(getSupabaseServiceRoleKey());
}

/** URL untuk createClient — fallback placeholder agar build Vercel tidak gagal. */
export function getSupabaseClientUrl(): string {
  return getSupabaseUrl() ?? "https://placeholder.supabase.co";
}

/** Anon key untuk createClient — fallback placeholder agar build Vercel tidak gagal. */
export function getSupabaseClientAnonKey(): string {
  return getSupabaseAnonKey() ?? "placeholder-key";
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export interface SupabaseEnvIssue {
  code:
    | "missing_url"
    | "missing_key"
    | "url_looks_like_key"
    | "key_looks_like_url"
    | "invalid_url";
  message: string;
}

export function getSupabaseEnvIssues(): SupabaseEnvIssue[] {
  const rawUrl = readSupabaseUrlRaw();
  const rawKey = readSupabaseKeyRaw();
  const issues: SupabaseEnvIssue[] = [];

  if (!rawUrl) {
    issues.push({
      code: "missing_url",
      message: `NEXT_PUBLIC_SUPABASE_URL kosong. Salin Project URL dari Supabase → Settings → API. ${getSupabaseEnvSetupHint()}`,
    });
  } else if (rawUrl.startsWith("sb_")) {
    issues.push({
      code: "url_looks_like_key",
      message:
        "NEXT_PUBLIC_SUPABASE_URL berisi API key. Isi dengan URL (https://xxx.supabase.co), bukan key.",
    });
  } else if (!rawUrl.includes(".supabase.co")) {
    issues.push({
      code: "invalid_url",
      message:
        "NEXT_PUBLIC_SUPABASE_URL tidak valid. Harus berformat https://ref-project.supabase.co",
    });
  } else if (!normalizeSupabaseProjectUrl(rawUrl)) {
    issues.push({
      code: "invalid_url",
      message:
        "NEXT_PUBLIC_SUPABASE_URL harus diawali https:// dan mengandung .supabase.co",
    });
  }

  if (!rawKey) {
    issues.push({
      code: "missing_key",
      message: `NEXT_PUBLIC_SUPABASE_ANON_KEY kosong. Salin Publishable key (sb_publishable_...) atau legacy anon JWT. ${getSupabaseEnvSetupHint()}`,
    });
  } else if (rawKey.includes(".supabase.co")) {
    issues.push({
      code: "key_looks_like_url",
      message:
        "NEXT_PUBLIC_SUPABASE_ANON_KEY berisi URL. Isi dengan publishable/anon key, bukan Project URL.",
    });
  }

  return issues;
}

/** Info aman untuk debug env di production (tanpa mengekspos secret lengkap). */
export function getSupabaseEnvDiagnostics() {
  const rawUrl = readSupabaseUrlRaw();
  const rawKey = readSupabaseKeyRaw();

  return {
    vercel: Boolean(process.env.VERCEL),
    nodeEnv: process.env.NODE_ENV,
    configured: isSupabaseConfigured(),
    issueCodes: getSupabaseEnvIssues().map((issue) => issue.code),
    url: {
      nextPublicPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      serverFallbackPresent: Boolean(process.env.SUPABASE_URL),
      length: rawUrl?.length ?? 0,
      valid: Boolean(getSupabaseUrl()),
    },
    key: {
      anonPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      publishablePresent: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      ),
      serverFallbackPresent: Boolean(process.env.SUPABASE_ANON_KEY),
      length: rawKey?.length ?? 0,
      prefix: rawKey ? `${rawKey.slice(0, 14)}…` : "",
      valid: Boolean(getSupabaseAnonKey()),
    },
    serviceRole: {
      primaryPresent: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      fallbackPresent: Boolean(process.env.SUPABASE_SERVICE_KEY),
      length: readSupabaseServiceRoleKeyRaw()?.length ?? 0,
      valid: isSupabaseServiceRoleConfigured(),
    },
  };
}
