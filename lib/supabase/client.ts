import { createBrowserClient } from "@supabase/ssr";

import { createSupabaseFetch } from "@/lib/supabase/custom-fetch";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export function createClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (!url || !key) {
    throw new Error(
      "Supabase belum dikonfigurasi. Periksa NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local, lalu restart dev server.",
    );
  }

  return createBrowserClient(url, key, {
    global: {
      fetch: createSupabaseFetch(key),
    },
  });
}
