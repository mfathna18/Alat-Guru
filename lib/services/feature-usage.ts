import {
  resolveFeatureFromPath,
  TRACKABLE_FEATURES,
} from "@/lib/analytics/feature-registry";
import { requireProfileAdmin } from "@/lib/auth/require-profile-admin";
import { formatSupabaseError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import type { FeatureUsageEntry } from "@/lib/types/feature-usage-stats";

type FeatureUsageAggregateRow = {
  feature_id: string;
  clicks_today: number;
  clicks_week: number;
  clicks_total: number;
  unique_users_today: number;
};

/**
 * Catat satu kunjungan menu/fitur untuk user yang sedang login.
 * Gagal diam-diam agar tidak mengganggu UX navigasi.
 */
export async function trackFeatureVisit(pathname: string): Promise<boolean> {
  const feature = resolveFeatureFromPath(pathname);
  if (!feature) return false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { error } = await supabase.from("feature_usage_events").insert({
      id_guru: user.id,
      feature_id: feature.id,
      menu: feature.menu,
      path: feature.path,
      category: feature.category,
    });

    if (error) {
      console.error("[trackFeatureVisit]", formatSupabaseError(error));
      return false;
    }

    return true;
  } catch (err) {
    console.error("[trackFeatureVisit] unexpected error:", err);
    return false;
  }
}

/**
 * Entri kosong dari registry — dipakai sebelum migrasi 027 dijalankan.
 */
export function getEmptyFeatureUsageEntries(): FeatureUsageEntry[] {
  return mergeAggregatesWithRegistry([]);
}

function mergeAggregatesWithRegistry(
  rows: FeatureUsageAggregateRow[],
): FeatureUsageEntry[] {
  const byFeatureId = new Map(
    rows.map((row) => [
      row.feature_id,
      {
        clicksToday: Number(row.clicks_today ?? 0),
        clicksWeek: Number(row.clicks_week ?? 0),
        clicksTotal: Number(row.clicks_total ?? 0),
        uniqueUsersToday: Number(row.unique_users_today ?? 0),
      },
    ]),
  );

  return TRACKABLE_FEATURES.map((feature) => {
    const stats = byFeatureId.get(feature.id);

    return {
      id: feature.id,
      menu: feature.menu,
      path: feature.path,
      category: feature.category,
      fill: feature.fill,
      clicksToday: stats?.clicksToday ?? 0,
      clicksWeek: stats?.clicksWeek ?? 0,
      clicksTotal: stats?.clicksTotal ?? 0,
      uniqueUsersToday: stats?.uniqueUsersToday ?? 0,
    };
  });
}

/**
 * Ambil statistik agregat fitur — hanya admin.
 */
export async function fetchFeatureUsageStats(): Promise<FeatureUsageEntry[]> {
  const { supabase } = await requireProfileAdmin();

  const { data, error } = await supabase.rpc("get_feature_usage_aggregates");

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  return mergeAggregatesWithRegistry((data ?? []) as FeatureUsageAggregateRow[]);
}
