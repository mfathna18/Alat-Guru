import type { SubscriptionAccess } from "@/lib/billing/types";
import type { SubscriptionPlan } from "@/utils/subscription";

/**
 * Apakah langganan profiles masih aktif berdasarkan subscription_expires_at.
 */
export function isProfileSubscriptionActive(
  expiresAt: string | null | undefined,
  now = new Date(),
): boolean {
  if (!expiresAt) return false;
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return false;
  return date > now;
}

export function isProfileSubscriptionExpired(
  expiresAt: string | null | undefined,
  now = new Date(),
): boolean {
  return !isProfileSubscriptionActive(expiresAt, now);
}

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
}

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  free: "Gratis",
  "1_month": "1 Bulan",
  "3_months": "3 Bulan",
  "1_year": "1 Tahun",
};

/**
 * Bangun SubscriptionAccess dari baris profiles (sumber kebenaran admin).
 */
export function subscriptionAccessFromProfile(
  plan: SubscriptionPlan | null | undefined,
  expiresAt: string | null | undefined,
  now = new Date(),
): SubscriptionAccess | null {
  if (!isProfileSubscriptionActive(expiresAt, now)) {
    return null;
  }

  const expires = new Date(expiresAt as string);
  const normalizedPlan: SubscriptionPlan =
    plan === "1_month" || plan === "3_months" || plan === "1_year"
      ? plan
      : "1_month";

  return {
    mode: "full",
    status: "active",
    canWrite: true,
    isTrial: false,
    isGrace: false,
    isReadOnly: false,
    daysLeft: daysBetween(now, expires),
    expiresAt: expires,
    message: `Langganan ${PLAN_LABELS[normalizedPlan]} aktif.`,
    effectivePriceIdr: 20000,
    listPriceIdr: 30000,
    promoActive: true,
  };
}
