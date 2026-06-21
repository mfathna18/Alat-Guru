import { createClient } from "@supabase/supabase-js";

import {
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";

const supabaseUrl = getSupabaseUrl() ?? "https://placeholder.supabase.co";

/** Service role client — hanya untuk webhook/API server-side. */
export function createAdminClient() {
  const supabaseServiceKey =
    getSupabaseServiceRoleKey() ?? "placeholder-key";

  if (!getSupabaseServiceRoleKey()) {
    console.warn(
      "[createAdminClient] SUPABASE_SERVICE_ROLE_KEY kosong — operasi admin dilewati.",
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
