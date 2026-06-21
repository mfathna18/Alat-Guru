import type { SubscriptionPlan } from "@/utils/subscription";

export type { SubscriptionPlan };

export const PROFILE_ROLES = ["admin", "user"] as const;
export type ProfileRole = (typeof PROFILE_ROLES)[number];

export const PROFILE_SUBSCRIPTION_PLANS = [
  "free",
  "1_month",
  "3_months",
  "1_year",
] as const satisfies readonly SubscriptionPlan[];

export const PAID_SUBSCRIPTION_PLANS = [
  "1_month",
  "3_months",
  "1_year",
] as const;

export type PaidSubscriptionPlan = (typeof PAID_SUBSCRIPTION_PLANS)[number];

export interface UserProfile {
  id: string;
  updated_at: string;
  full_name: string | null;
  email: string | null;
  role: ProfileRole;
  subscription_plan: SubscriptionPlan;
  subscription_expires_at: string | null;
}

export function isProfileRole(value: string): value is ProfileRole {
  return (PROFILE_ROLES as readonly string[]).includes(value);
}

export function isSubscriptionPlan(value: string): value is SubscriptionPlan {
  return (PROFILE_SUBSCRIPTION_PLANS as readonly string[]).includes(value);
}

export function isPaidSubscriptionPlan(
  value: string,
): value is PaidSubscriptionPlan {
  return (PAID_SUBSCRIPTION_PLANS as readonly string[]).includes(value);
}

export const PROFILE_ROLE_LABELS: Record<ProfileRole, string> = {
  admin: "Admin",
  user: "User",
};

export const PROFILE_SUBSCRIPTION_LABELS: Record<SubscriptionPlan, string> = {
  free: "Gratis",
  "1_month": "1 Bulan",
  "3_months": "3 Bulan",
  "1_year": "1 Tahun",
};
