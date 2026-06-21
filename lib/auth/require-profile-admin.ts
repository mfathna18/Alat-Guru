import { createClient } from "@/lib/supabase/server";

export const ADMIN_UNAUTHORIZED_ERROR = "Unauthorized";

/**
 * Pastikan user login memiliki role `admin` di public.profiles.
 * Melempar Error dengan pesan "Unauthorized" jika gagal.
 */
export async function requireProfileAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error(ADMIN_UNAUTHORIZED_ERROR);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    throw new Error(ADMIN_UNAUTHORIZED_ERROR);
  }

  return { supabase, user, adminProfile: profile };
}

/** Cek apakah user login adalah admin (tanpa melempar error). */
export async function isProfileAdmin(): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.role === "admin";
}
