import { createClient } from "@supabase/supabase-js";

import { getSupabaseUrl } from "@/lib/supabase/env";

const supabaseUrl = getSupabaseUrl() ?? "https://placeholder.supabase.co";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "placeholder-key";

/** Service role client — hanya untuk webhook/API server-side. */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    console.warn(
      "[createAdminClient] SUPABASE_SERVICE_ROLE_KEY kosong — operasi admin dilewati.",
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
