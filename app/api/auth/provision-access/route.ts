import { NextResponse } from "next/server";

import { ensureSignupFullAccess } from "@/lib/auth/ensure-signup-full-access";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Aktifkan akses penuh setelah registrasi (fallback jika trigger DB belum dijalankan). */
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
    return NextResponse.json({ ok: true });
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
