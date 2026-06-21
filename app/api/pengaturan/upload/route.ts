import { NextResponse } from "next/server";

import {
  LOGO_SEKOLAH_BUCKET,
  buildPengaturanStoragePath,
  validatePengaturanImageFile,
  type PengaturanUploadKind,
} from "@/lib/services/pengaturan-upload";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseServiceRoleConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

function isUploadKind(value: string): value is PengaturanUploadKind {
  return value === "logo" || value === "ttd-wali" || value === "ttd-kepsek";
}

export async function POST(req: Request) {
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

    const formData = await req.formData();
    const file = formData.get("file");
    const kindRaw = String(formData.get("kind") ?? "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File tidak ditemukan." }, {
        status: 400,
      });
    }

    if (!isUploadKind(kindRaw)) {
      return NextResponse.json({ error: "Jenis unggahan tidak valid." }, {
        status: 400,
      });
    }

    validatePengaturanImageFile(file);

    const path = buildPengaturanStoragePath(guru.id, kindRaw, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadOptions = {
      contentType: file.type,
      cacheControl: "3600",
      upsert: true,
    };

    // Utama: unggah dengan sesi login guru (cukup untuk bucket logo-sekolah).
    let uploadError = (
      await supabase.storage.from(LOGO_SEKOLAH_BUCKET).upload(path, buffer, uploadOptions)
    ).error;

    // Cadangan: service role jika tersedia (mis. kebijakan storage ketat).
    if (uploadError && isSupabaseServiceRoleConfigured()) {
      const admin = createAdminClient();
      uploadError = (
        await admin.storage.from(LOGO_SEKOLAH_BUCKET).upload(path, buffer, uploadOptions)
      ).error;
    }

    if (uploadError) {
      const lower = uploadError.message.toLowerCase();
      let message = uploadError.message;

      if (lower.includes("invalid api key")) {
        message =
          "Koneksi Supabase tidak valid. Periksa env di Vercel lalu redeploy tanpa cache.";
      } else if (lower.includes("row-level security") || lower.includes("policy")) {
        message =
          "Izin unggah ditolak. Pastikan bucket logo-sekolah aktif di Supabase Storage.";
      }

      return NextResponse.json({ error: message }, { status: 500 });
    }

    const { data } = supabase.storage.from(LOGO_SEKOLAH_BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Gagal mengunggah file.",
      },
      { status: 400 },
    );
  }
}
