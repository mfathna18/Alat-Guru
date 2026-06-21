import { createClient } from "@/lib/supabase/server";

export type SubscriptionPlan = "free" | "1_month" | "3_months" | "1_year";

/**
 * Hitung tanggal kedaluwarsa subscription berdasarkan plan.
 * - 1_month  = 30 hari
 * - 3_months = 90 hari
 * - 1_year   = 365 hari
 * - free     = null
 */
export function calculateExpirationDate(plan: SubscriptionPlan): string | null {
  const now = new Date();

  const days =
    plan === "1_month"
      ? 30
      : plan === "3_months"
        ? 90
        : plan === "1_year"
          ? 365
          : 0;

  if (plan === "free") return null;

  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return expiresAt.toISOString();
}

/**
 * Cek akses backend berdasarkan `profiles.subscription_expires_at`.
 * Lempar error jika masa aktif sudah habis / null.
 */
export async function verifySubscriptionAccess(userId: string): Promise<true> {
  const trimmedUserId = userId.trim();
  if (!trimmedUserId) {
    throw new Error("Akses ditolak: Masa berlangganan habis.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("subscription_expires_at")
    .eq("id", trimmedUserId)
    .maybeSingle();

  if (error) {
    throw new Error("Akses ditolak: Masa berlangganan habis.");
  }

  const expiresAt = data?.subscription_expires_at
    ? new Date(data.subscription_expires_at)
    : null;

  if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
    throw new Error("Akses ditolak: Masa berlangganan habis.");
  }

  if (expiresAt <= new Date()) {
    throw new Error("Akses ditolak: Masa berlangganan habis.");
  }

  return true;
}

