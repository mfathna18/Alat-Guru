import {
  PROFILE_ROLE_LABELS,
  PROFILE_ROLES,
  PROFILE_SUBSCRIPTION_LABELS,
  PROFILE_SUBSCRIPTION_PLANS,
  type ProfileRole,
  type SubscriptionPlan,
} from "@/lib/types/profile";

export interface AggregateCountItem {
  key: string;
  label: string;
  count: number;
  fill: string;
}

export interface ProfileAggregates {
  totalUsers: number;
  bySubscription: AggregateCountItem[];
  byRole: AggregateCountItem[];
}

export const SUBSCRIPTION_CHART_COLORS: Record<SubscriptionPlan, string> = {
  free: "#94a3b8",
  "1_month": "#6366f1",
  "3_months": "#7c3aed",
  "1_year": "#d97706",
};

export const ROLE_CHART_COLORS: Record<ProfileRole, string> = {
  admin: "#0284c7",
  user: "#64748b",
};

export function buildEmptyProfileAggregates(): ProfileAggregates {
  return {
    totalUsers: 0,
    bySubscription: PROFILE_SUBSCRIPTION_PLANS.map((plan) => ({
      key: plan,
      label: PROFILE_SUBSCRIPTION_LABELS[plan],
      count: 0,
      fill: SUBSCRIPTION_CHART_COLORS[plan],
    })),
    byRole: PROFILE_ROLES.map((role) => ({
      key: role,
      label: PROFILE_ROLE_LABELS[role],
      count: 0,
      fill: ROLE_CHART_COLORS[role],
    })),
  };
}
