/**
 * Fetch wrapper untuk publishable key (`sb_publishable_...`).
 * Hapus Authorization Bearer publishable hanya untuk REST/Realtime —
 * endpoint Auth (/auth/v1/) tetap memakai header bawaan SDK.
 */
export function createSupabaseFetch(supabaseKey: string): typeof fetch {
  const isPublishableKey = supabaseKey.startsWith("sb_publishable_");

  return async (input, init) => {
    const headers = new Headers(init?.headers);
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    const isAuthRoute = url.includes("/auth/v1/");

    if (isPublishableKey && !isAuthRoute) {
      const auth = headers.get("Authorization");
      if (auth === `Bearer ${supabaseKey}`) {
        headers.delete("Authorization");
      }
    }

    return fetch(input, { ...init, headers });
  };
}
