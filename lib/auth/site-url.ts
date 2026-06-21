/** URL production canonical — dipakai sebagai fallback saat env belum di-set. */
export const PRODUCTION_SITE_ORIGIN = "https://alatguru.online";

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

/**
 * Origin situs untuk redirect OAuth, email, dan callback.
 * - Browser: selalu `window.location.origin` (localhost vs production otomatis)
 * - Server: NEXT_PUBLIC_SITE_URL → VERCEL_URL → production fallback → localhost
 */
export function getSiteOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    return normalizeOrigin(fromEnv);
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const host = vercelUrl.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }

  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_SITE_ORIGIN;
  }

  return "http://localhost:3000";
}

/** URL callback Supabase OAuth / konfirmasi email. */
export function getAuthCallbackUrl(redirectPath = "/dashboard"): string {
  const path = redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`;
  return `${getSiteOrigin()}/auth/callback?next=${encodeURIComponent(path)}`;
}

export function getLoginUrl(): string {
  return `${getSiteOrigin()}/login`;
}
