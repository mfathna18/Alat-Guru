import { createClient } from "@/lib/supabase/client";

export async function signInWithGoogle(redirectPath = "/dashboard") {
  const supabase = createClient();
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });

  if (error) throw error;
  return data;
}
