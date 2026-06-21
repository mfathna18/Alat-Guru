function cleanEnvValue(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim().replace(/^['"]|['"]$/g, "");
  return trimmed.length > 0 ? trimmed : null;
}

export function getSupabaseUrl() {
  const url = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!url) return null;
  if (!url.startsWith("https://") || !url.includes(".supabase.co")) {
    return null;
  }
  return url.replace(/\/+$/, "");
}

export function getSupabaseAnonKey() {
  return (
    cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ??
    cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ??
    null
  );
}

/** URL untuk createClient — fallback placeholder agar build Vercel tidak gagal. */
export function getSupabaseClientUrl(): string {
  const url = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (url && url.startsWith("https://") && url.includes(".supabase.co")) {
    return url.replace(/\/+$/, "");
  }
  return process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
}

/** Anon key untuk createClient — fallback placeholder agar build Vercel tidak gagal. */
export function getSupabaseClientAnonKey(): string {
  return (
    cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ??
    cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    "placeholder-key"
  );
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export interface SupabaseEnvIssue {
  code: "missing_url" | "missing_key" | "url_looks_like_key" | "key_looks_like_url" | "invalid_url";
  message: string;
}

export function getSupabaseEnvIssues(): SupabaseEnvIssue[] {
  const rawUrl = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const rawKey =
    cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ??
    cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const issues: SupabaseEnvIssue[] = [];

  if (!rawUrl) {
    issues.push({
      code: "missing_url",
      message:
        "NEXT_PUBLIC_SUPABASE_URL kosong. Salin Project URL dari Supabase → Settings → API.",
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
  }

  if (!rawKey) {
    issues.push({
      code: "missing_key",
      message:
        "NEXT_PUBLIC_SUPABASE_ANON_KEY kosong. Salin Publishable key (sb_publishable_...) atau legacy anon JWT.",
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
