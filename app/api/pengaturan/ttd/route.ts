import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { PengaturanSekolah } from "@/lib/types/database";

type TtdRole = "wali-kelas" | "kepsek";

function fieldForRole(role: TtdRole): "ttd_wali_kelas_url" | "ttd_kepsek_url" {
  return role === "wali-kelas" ? "ttd_wali_kelas_url" : "ttd_kepsek_url";
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as {
      role?: TtdRole;
      url?: string | null;
    };

    const role = body.role;
    const url = body.url ?? null;

    if (role !== "wali-kelas" && role !== "kepsek") {
      return NextResponse.json({ error: "Role tanda tangan tidak valid." }, {
        status: 400,
      });
    }

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

    const admin = createAdminClient();
    const field = fieldForRole(role);
    const { data, error } = await admin
      .from("pengaturan_sekolah")
      .update({ [field]: url })
      .eq("id_guru", guru.id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          {
            error:
              "Simpan identitas sekolah terlebih dahulu, lalu unggah tanda tangan lagi.",
          },
          { status: 404 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ pengaturan: data as PengaturanSekolah });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Gagal menyimpan tanda tangan.",
      },
      { status: 500 },
    );
  }
}
