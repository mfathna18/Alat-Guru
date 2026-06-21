import { NextResponse } from "next/server";

import { savePengaturanSekolahForGuru } from "@/lib/services/pengaturan-server";
import type { PengaturanSekolahInput } from "@/lib/services/pengaturan-shared";
import { createClient } from "@/lib/supabase/server";
import type { PengaturanSekolah } from "@/lib/types/database";

export async function PUT(req: Request) {
  try {
    const input = (await req.json()) as PengaturanSekolahInput;

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

    const { data: guru, error: guruErr } = await supabase
      .from("guru")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (guruErr || !guru) {
      return NextResponse.json({ error: "Profil guru tidak ditemukan." }, {
        status: 404,
      });
    }

    const pengaturan = await savePengaturanSekolahForGuru(guru.id, input);
    return NextResponse.json({ pengaturan: pengaturan as PengaturanSekolah });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Gagal menyimpan pengaturan.",
      },
      { status: 400 },
    );
  }
}
