import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  getSupabaseEnvIssues,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/env";

export async function GET() {
  const envIssues = getSupabaseEnvIssues();

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        issues: envIssues,
        message:
          envIssues[0]?.message ??
          "NEXT_PUBLIC_SUPABASE_URL harus berformat https://xxx.supabase.co",
      },
      { status: 503 },
    );
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("guru").select("id").limit(1);

    if (error) {
      const isMissingTable =
        error.message.includes("does not exist") ||
        error.code === "42P01" ||
        error.message.includes("Could not find the table");

      return NextResponse.json(
        {
          ok: false,
          configured: true,
          url: getSupabaseUrl(),
          database: isMissingTable ? "migration_required" : "error",
          message: isMissingTable
            ? "Koneksi OK, tapi tabel belum ada. Jalankan supabase/migrations/001_initial_schema.sql di SQL Editor."
            : error.message,
        },
        { status: isMissingTable ? 200 : 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      configured: true,
      url: getSupabaseUrl(),
      database: "ready",
      message: "Supabase terhubung dan schema siap digunakan.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        message: err instanceof Error ? err.message : "Gagal menghubungkan Supabase",
      },
      { status: 502 },
    );
  }
}
