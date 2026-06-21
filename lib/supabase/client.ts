import { createBrowserClient } from "@supabase/ssr";

import { createSupabaseFetch } from "@/lib/supabase/custom-fetch";
import {
  getSupabaseAnonKey,
  getSupabaseClientAnonKey,
  getSupabaseClientUrl,
  getSupabaseUrl,
} from "@/lib/supabase/env";

export function createClient() {
  const url = getSupabaseUrl() ?? getSupabaseClientUrl();
  const key = getSupabaseAnonKey() ?? getSupabaseClientAnonKey();

  return createBrowserClient(url, key, {
    global: {
      fetch: createSupabaseFetch(key),
    },
  });
}
