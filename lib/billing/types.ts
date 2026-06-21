export type SubscriptionStatus =
  | "trial"
  | "active"
  | "grace"
  | "expired"
  | "cancelled";

export type AccessMode = "full" | "grace" | "readonly";

export type PaymentStatus = "pending" | "paid" | "failed" | "expired" | "refunded";

export interface Plan {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_idr: number;
  promo_price_idr: number | null;
  promo_label: string | null;
  interval_days: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Subscription {
  id: string;
  id_guru: number;
  plan_id: string;
  status: SubscriptionStatus;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  grace_ends_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  plan?: Plan;
}

export interface Payment {
  id: string;
  id_guru: number;
  plan_id: string;
  subscription_id: string | null;
  gateway: string;
  gateway_order_id: string;
  gateway_transaction_id: string | null;
  amount_idr: number;
  original_price_idr: number | null;
  status: PaymentStatus;
  payment_method: string | null;
  snap_token: string | null;
  gateway_response: Record<string, unknown> | null;
  paid_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionAccess {
  mode: AccessMode;
  status: SubscriptionStatus;
  canWrite: boolean;
  isTrial: boolean;
  isGrace: boolean;
  isReadOnly: boolean;
  daysLeft: number | null;
  expiresAt: Date | null;
  message: string;
  effectivePriceIdr: number;
  listPriceIdr: number;
  promoActive: boolean;
}

export const TRIAL_DAYS = 3;
export const GRACE_DAYS = 1;
