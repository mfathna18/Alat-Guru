export interface FeatureUsageEntry {
  id: string;
  menu: string;
  path: string;
  category: string;
  clicksToday: number;
  clicksWeek: number;
  clicksTotal: number;
  uniqueUsersToday: number;
  fill: string;
}

export interface FeatureUsageSummary {
  totalAccessToday: number;
  topFeature: FeatureUsageEntry;
  leastUsedFeature: FeatureUsageEntry;
}

export function buildFeatureUsageSummary(
  entries: FeatureUsageEntry[],
): FeatureUsageSummary {
  const nonEmpty =
    entries.length > 0
      ? entries
      : [
          {
            id: "empty",
            menu: "Belum ada data",
            path: "—",
            category: "—",
            clicksToday: 0,
            clicksWeek: 0,
            clicksTotal: 0,
            uniqueUsersToday: 0,
            fill: "var(--muted-foreground)",
          },
        ];

  const sortedByToday = [...nonEmpty].sort(
    (a, b) => b.clicksToday - a.clicksToday,
  );
  const sortedByTotalAsc = [...nonEmpty].sort(
    (a, b) => a.clicksTotal - b.clicksTotal,
  );

  return {
    totalAccessToday: entries.reduce((sum, item) => sum + item.clicksToday, 0),
    topFeature: sortedByToday[0]!,
    leastUsedFeature: sortedByTotalAsc[0]!,
  };
}

export function getTopFeatures(
  entries: FeatureUsageEntry[],
  limit = 5,
): FeatureUsageEntry[] {
  return [...entries]
    .sort((a, b) => b.clicksTotal - a.clicksTotal)
    .slice(0, limit);
}
