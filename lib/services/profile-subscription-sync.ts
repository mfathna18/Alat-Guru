import { GRACE_DAYS } from "@/lib/billing/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionPlan } from "@/utils/subscription";

function addDaysIso(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/**
 * Sinkronkan tabel subscriptions (billing + guru_can_write RLS) dari profiles.
 * Dipanggil setelah admin mengubah paket langganan di Manajemen User.
 */
export async function syncGuruSubscriptionFromProfile(
  authUserId: string,
  plan: SubscriptionPlan,
  expiresAt: string | null,
): Promise<void> {
  const trimmedId = authUserId.trim();
  if (!trimmedId) return;

  const admin = createAdminClient();

  const { data: guru, error: guruError } = await admin
    .from("guru")
    .select("id")
    .eq("auth_user_id", trimmedId)
    .maybeSingle();

  if (guruError || !guru) return;

  const { data: defaultPlan, error: planError } = await admin
    .from("plans")
    .select("id")
    .eq("slug", "premium-monthly")
    .eq("is_active", true)
    .maybeSingle();

  if (planError || !defaultPlan) return;

  if (plan === "free" || !expiresAt) {
    const { error } = await admin
      .from("subscriptions")
      .update({
        status: "expired",
        trial_ends_at: null,
        current_period_start: null,
        current_period_end: null,
        grace_ends_at: null,
      })
      .eq("id_guru", guru.id);

    if (error) {
      throw new Error(`Gagal sinkronisasi langganan guru: ${error.message}`);
    }
    return;
  }

  const periodEnd = new Date(expiresAt);
  const now = new Date();

  const { error } = await admin
    .from("subscriptions")
    .update({
      plan_id: defaultPlan.id,
      status: "active",
      trial_ends_at: null,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      grace_ends_at: addDaysIso(periodEnd, GRACE_DAYS),
      cancelled_at: null,
    })
    .eq("id_guru", guru.id);

  if (error) {
    throw new Error(`Gagal sinkronisasi langganan guru: ${error.message}`);
  }
}
