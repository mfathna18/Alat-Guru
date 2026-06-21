import { requireProfileAdmin } from "@/lib/auth/require-profile-admin";
import { formatSupabaseError } from "@/lib/supabase/errors";

export type SubscriptionPlan = "free" | "1_month" | "3_months" | "1_year";

export interface AdminDashboardMetrics {
  totalUsers: number;
  totalAdmins: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  byPlan: Array<{ plan: SubscriptionPlan; label: string; count: number; fill: string }>;
}

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  free: "Free",
  "1_month": "1 Month",
  "3_months": "3 Months",
  "1_year": "1 Year",
};

const PLAN_COLORS: Record<SubscriptionPlan, string> = {
  free: "#94a3b8",
  "1_month": "#6366f1",
  "3_months": "#7c3aed",
  "1_year": "#d97706",
};

function normalizePlan(value: unknown): SubscriptionPlan {
  return value === "1_month" || value === "3_months" || value === "1_year"
    ? value
    : "free";
}

function isActive(expiresAt: unknown): boolean {
  if (!expiresAt) return false;
  const date = new Date(String(expiresAt));
  if (Number.isNaN(date.getTime())) return false;
  return date > new Date();
}

/**
 * Ambil agregat metrik admin dari tabel `profiles`.
 * Hanya dapat diakses oleh admin (server-side check + RLS).
 */
export async function fetchAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  const { supabase } = await requireProfileAdmin();

  // Ambil kolom yang dibutuhkan saja.
  const { data, error } = await supabase
    .from("profiles")
    .select("role, subscription_plan, subscription_expires_at");

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  const rows = data ?? [];
  const metrics: AdminDashboardMetrics = {
    totalUsers: rows.length,
    totalAdmins: 0,
    activeSubscriptions: 0,
    expiredSubscriptions: 0,
    byPlan: (["free", "1_month", "3_months", "1_year"] as const).map((plan) => ({
      plan,
      label: PLAN_LABELS[plan],
      count: 0,
      fill: PLAN_COLORS[plan],
    })),
  };

  for (const row of rows) {
    if (row.role === "admin") metrics.totalAdmins += 1;

    if (isActive((row as { subscription_expires_at?: unknown }).subscription_expires_at)) {
      metrics.activeSubscriptions += 1;
    } else {
      metrics.expiredSubscriptions += 1;
    }

    const plan = normalizePlan((row as { subscription_plan?: unknown }).subscription_plan);
    const item = metrics.byPlan.find((p) => p.plan === plan);
    if (item) item.count += 1;
  }

  return metrics;
}

