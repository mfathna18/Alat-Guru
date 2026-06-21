import type { Plan } from "@/lib/billing/types";

/** Promo Rp 20.000 berlaku selama bulan kalender berjalan. */
export function isPromoActive(plan: Plan, now = new Date()): boolean {
  if (!plan.promo_price_idr || plan.promo_price_idr >= plan.price_idr) {
    return false;
  }
  return true;
}

export function getEffectivePriceIdr(plan: Plan, now = new Date()): number {
  if (isPromoActive(plan, now)) {
    return plan.promo_price_idr!;
  }
  return plan.price_idr;
}

export function formatIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function endOfCurrentMonth(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
}
