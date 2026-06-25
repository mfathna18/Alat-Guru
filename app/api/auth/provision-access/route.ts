import { NextResponse } from "next/server";

import { ensureSignupFullAccess } from "@/lib/auth/ensure-signup-full-access";
import { ensureSignupDemoData } from "@/lib/demo/seed-signup-demo";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Aktifkan akses penuh + data contoh setelah registrasi. */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Sesi login tidak valid." }, {
        status: 401,
      });
    }

    await ensureSignupFullAccess(user.id);
    const demo = await ensureSignupDemoData(user.id);

    return NextResponse.json({ ok: true, demo });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Gagal mengaktifkan akses.",
      },
      { status: 500 },
    );
  }
}
