"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { trackFeatureVisitAction } from "@/lib/actions/feature-usage";
import { resolveFeatureFromPath } from "@/lib/analytics/feature-registry";

/**
 * Mencatat kunjungan menu saat guru navigasi di dalam dashboard.
 * Tidak memblokir render — fire-and-forget.
 */
export function FeatureUsageTracker() {
  const pathname = usePathname();
  const lastTrackedRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!pathname) return;

    const feature = resolveFeatureFromPath(pathname);
    if (!feature) return;

    if (lastTrackedRef.current === pathname) return;
    lastTrackedRef.current = pathname;

    void trackFeatureVisitAction(pathname);
  }, [pathname]);

  return null;
}
