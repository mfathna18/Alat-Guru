"use server";

import {
  fetchFeatureUsageStats,
  trackFeatureVisit,
} from "@/lib/services/feature-usage";
import { ADMIN_UNAUTHORIZED_ERROR } from "@/lib/auth/require-profile-admin";
import type { FeatureUsageEntry } from "@/lib/types/feature-usage-stats";

export type FeatureUsageActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function toActionError(err: unknown): FeatureUsageActionResult<never> {
  const message =
    err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.";

  if (message === ADMIN_UNAUTHORIZED_ERROR || message === "Unauthorized") {
    return { ok: false, error: "Unauthorized" };
  }

  return { ok: false, error: message };
}

/** Catat navigasi menu — dipanggil dari client tracker. */
export async function trackFeatureVisitAction(
  pathname: string,
): Promise<boolean> {
  return trackFeatureVisit(pathname);
}

/** Ambil statistik fitur live untuk halaman admin. */
export async function getFeatureUsageStats(): Promise<
  FeatureUsageActionResult<FeatureUsageEntry[]>
> {
  try {
    const stats = await fetchFeatureUsageStats();
    return { ok: true, data: stats };
  } catch (err) {
    return toActionError(err);
  }
}
