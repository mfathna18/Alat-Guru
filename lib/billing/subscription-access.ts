import { GRACE_DAYS, type AccessMode, type Plan, type Subscription, type SubscriptionAccess, type SubscriptionStatus } from "@/lib/billing/types";
import { getEffectivePriceIdr, isPromoActive } from "@/lib/billing/pricing";

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
}

export function reconcileSubscriptionStatus(
  sub: Subscription,
  now = new Date(),
): SubscriptionStatus {
  if (sub.status === "cancelled") return "cancelled";

  if (sub.status === "trial" || sub.trial_ends_at) {
    const trialEnd = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null;
    if (trialEnd && now <= trialEnd) return "trial";
    if (!sub.current_period_end) return "expired";
  }

  const periodEnd = sub.current_period_end
    ? new Date(sub.current_period_end)
    : null;

  if (periodEnd && now <= periodEnd) return "active";

  const graceEnd = sub.grace_ends_at
    ? new Date(sub.grace_ends_at)
    : periodEnd
      ? addDays(periodEnd, GRACE_DAYS)
      : null;

  if (graceEnd && now <= graceEnd) return "grace";

  return "expired";
}

export function resolveSubscriptionAccess(
  subscription: Subscription | null,
  plan: Plan | null,
  now = new Date(),
): SubscriptionAccess {
  const listPriceIdr = plan?.price_idr ?? 30000;
  const effectivePriceIdr = plan ? getEffectivePriceIdr(plan, now) : listPriceIdr;
  const promoActive = plan ? isPromoActive(plan, now) : false;

  if (!subscription || !plan) {
    return {
      mode: "readonly",
      status: "expired",
      canWrite: false,
      isTrial: false,
      isGrace: false,
      isReadOnly: true,
      daysLeft: null,
      expiresAt: null,
      message: "Langganan tidak ditemukan. Perpanjang untuk melanjutkan.",
      effectivePriceIdr,
      listPriceIdr,
      promoActive,
    };
  }

  const status = reconcileSubscriptionStatus(subscription, now);

  if (status === "trial") {
    const expiresAt = subscription.trial_ends_at
      ? new Date(subscription.trial_ends_at)
      : null;
    return {
      mode: "full",
      status,
      canWrite: true,
      isTrial: true,
      isGrace: false,
      isReadOnly: false,
      daysLeft: expiresAt ? daysBetween(now, expiresAt) : null,
      expiresAt,
      message: "Masa trial 3 hari — nikmati akses penuh.",
      effectivePriceIdr,
      listPriceIdr,
      promoActive,
    };
  }

  if (status === "active") {
    const expiresAt = subscription.current_period_end
      ? new Date(subscription.current_period_end)
      : null;
    return {
      mode: "full",
      status,
      canWrite: true,
      isTrial: false,
      isGrace: false,
      isReadOnly: false,
      daysLeft: expiresAt ? daysBetween(now, expiresAt) : null,
      expiresAt,
      message: "Langganan Premium aktif.",
      effectivePriceIdr,
      listPriceIdr,
      promoActive,
    };
  }

  if (status === "grace") {
    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end)
      : now;
    const expiresAt = subscription.grace_ends_at
      ? new Date(subscription.grace_ends_at)
      : addDays(periodEnd, GRACE_DAYS);
    return {
      mode: "grace",
      status,
      canWrite: true,
      isTrial: false,
      isGrace: true,
      isReadOnly: false,
      daysLeft: daysBetween(now, expiresAt),
      expiresAt,
      message: "Masa grace 1 hari — segera perpanjang langganan.",
      effectivePriceIdr,
      listPriceIdr,
      promoActive,
    };
  }

  return {
    mode: "readonly",
    status: status === "cancelled" ? "cancelled" : "expired",
    canWrite: false,
    isTrial: false,
    isGrace: false,
    isReadOnly: true,
    daysLeft: 0,
    expiresAt: subscription.current_period_end
      ? new Date(subscription.current_period_end)
      : null,
    message:
      "Mode baca saja — data Anda aman. Perpanjang langganan untuk mengedit kembali.",
    effectivePriceIdr,
    listPriceIdr,
    promoActive,
  };
}

export function accessModeToWritePermission(mode: AccessMode): boolean {
  return mode === "full" || mode === "grace";
}
