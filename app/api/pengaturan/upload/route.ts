import { NextResponse } from "next/server";

import {
  LOGO_SEKOLAH_BUCKET,
  buildPengaturanStoragePath,
  validatePengaturanImageFile,
  type PengaturanUploadKind,
} from "@/lib/services/pengaturan-upload";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function isUploadKind(value: string): value is PengaturanUploadKind {
  return value === "logo" || value === "ttd-wali" || value === "ttd-kepsek";
}

export async function POST(req: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
      return NextResponse.json(
        {
          error:
            "Upload server belum dikonfigurasi. Tambahkan SUPABASE_SERVICE_ROLE_KEY di Vercel, lalu redeploy.",
        },
        { status: 503 },
      );
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
    const admin = createAdminClient();

    const { error: uploadError } = await admin.storage
      .from(LOGO_SEKOLAH_BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      const message = uploadError.message.toLowerCase().includes("invalid api key")
        ? "Koneksi Supabase server tidak valid. Periksa SUPABASE_SERVICE_ROLE_KEY di Vercel lalu redeploy."
        : uploadError.message;

      return NextResponse.json({ error: message }, { status: 500 });
    }

    const { data } = admin.storage.from(LOGO_SEKOLAH_BUCKET).getPublicUrl(path);
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
