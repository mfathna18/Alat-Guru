import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/auth/site-url";

export async function signInWithGoogle(redirectPath = "/dashboard") {
  const supabase = createClient();
  const redirectTo = getAuthCallbackUrl(redirectPath);

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
