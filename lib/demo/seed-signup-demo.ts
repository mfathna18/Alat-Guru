import { createAdminClient } from "@/lib/supabase/admin";

export interface SignupDemoSeedResult {
  seeded: boolean;
  reason?: string;
  kelas?: string;
  siswa?: number;
  mapel?: number;
  nilai?: number;
}

/**
 * Isi data contoh untuk user baru (idempotent — lewati jika sudah punya kelas).
 */
export async function ensureSignupDemoData(
  authUserId: string,
): Promise<SignupDemoSeedResult> {
  const trimmedId = authUserId.trim();
  if (!trimmedId) {
    return { seeded: false, reason: "empty_user_id" };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    console.warn("[ensureSignupDemoData] SUPABASE_SERVICE_ROLE_KEY kosong — lewati seed demo.");
    return { seeded: false, reason: "no_service_role" };
  }

  try {
    const { seedSignupDemoForAuthUser } = await import(
      "../../scripts/seed-signup-demo-core.mjs"
    );
    const admin = createAdminClient();
    const result = await seedSignupDemoForAuthUser(admin, trimmedId);
    return result as SignupDemoSeedResult;
  } catch (err) {
    console.error(
      "[ensureSignupDemoData]",
      err instanceof Error ? err.message : err,
    );
    return { seeded: false, reason: "error" };
  }
}
