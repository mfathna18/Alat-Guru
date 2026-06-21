import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { createSupabaseFetch } from "@/lib/supabase/custom-fetch";
import {
  getSupabaseAnonKey,
  getSupabaseClientAnonKey,
  getSupabaseClientUrl,
  getSupabaseUrl,
} from "@/lib/supabase/env";

export async function createClient() {
  const url = getSupabaseUrl() ?? getSupabaseClientUrl();
  const key = getSupabaseAnonKey() ?? getSupabaseClientAnonKey();

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    global: {
      fetch: createSupabaseFetch(key),
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component — cookie write handled by middleware
        }
      },
    },
  });
}
