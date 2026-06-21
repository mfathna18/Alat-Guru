import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseFetch } from "@/lib/supabase/custom-fetch";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(
      `${origin}/login?error=auth_callback_failed&detail=${encodeURIComponent("Supabase belum dikonfigurasi di .env.local")}`,
    );
  }

  if (code) {
    const redirectPath = next.startsWith("/") ? next : "/dashboard";
    let response = NextResponse.redirect(`${origin}${redirectPath}`);

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: createSupabaseFetch(supabaseAnonKey),
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.redirect(`${origin}${redirectPath}`);
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return response;
    }

    console.error("[auth/callback] exchangeCodeForSession:", error.message);

    return NextResponse.redirect(
      `${origin}/login?error=auth_callback_failed&detail=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
