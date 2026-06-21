"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  Loader2,
  MousePointerClick,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { getFeatureUsageStats } from "@/lib/actions/feature-usage";
import {
  buildFeatureUsageSummary,
  getTopFeatures,
  type FeatureUsageEntry,
} from "@/lib/types/feature-usage-stats";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks/use-mounted";

const LIVE_REFRESH_MS = 20_000;

interface AdminFeatureStatsManagerProps {
  initialEntries: FeatureUsageEntry[];
  migrationPending?: boolean;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(value);
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    payload?: FeatureUsageEntry;
  }>;
}) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-popover-foreground">{item.menu}</p>
      <p className="text-muted-foreground">
        {formatNumber(item.clicksTotal)} klik total
      </p>
    </div>
  );
}

export function AdminFeatureStatsManager({
  initialEntries,
  migrationPending = false,
}: AdminFeatureStatsManagerProps) {
  const mounted = useMounted();
  const [entries, setEntries] = React.useState(initialEntries);
  const [loading, setLoading] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = React.useState(true);

  React.useEffect(() => {
    setLastUpdated(new Date());
  }, []);

  const refreshStats = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const result = await getFeatureUsageStats();
      if (!result.ok) {
        if (!silent) {
          toast.error(
            result.error === "Unauthorized"
              ? "Akses admin ditolak."
              : result.error,
          );
        }
        return;
      }

      setEntries(result.data);
      setLastUpdated(new Date());
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = window.setInterval(() => {
      void refreshStats(true);
    }, LIVE_REFRESH_MS);

    return () => window.clearInterval(intervalId);
  }, [autoRefresh, refreshStats]);

  const summary = buildFeatureUsageSummary(entries);
  const topFive = getTopFeatures(
    entries.filter((item) => item.clicksTotal > 0),
    5,
  );
  const sortedAll = [...entries].sort((a, b) => b.clicksTotal - a.clicksTotal);
  const maxTotal = Math.max(sortedAll[0]?.clicksTotal ?? 0, 1);
  const hasAnyData = entries.some((item) => item.clicksTotal > 0);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BarChart3 className="size-5" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Statistik Fitur
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Statistik penggunaan menu live dari aktivitas guru — diperbarui
            otomatis setiap {LIVE_REFRESH_MS / 1000} detik.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {mounted && lastUpdated ? (
              <>
                Terakhir diperbarui: {formatDateTime(lastUpdated)}
                {autoRefresh ? " · auto-refresh aktif" : " · auto-refresh nonaktif"}
              </>
            ) : (
              <>Menyiapkan pembaruan live…</>
            )}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh((value) => !value)}
          >
            {autoRefresh ? "Hentikan Auto-refresh" : "Aktifkan Auto-refresh"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => void refreshStats()}
          >
            {loading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 size-4" />
            )}
            Muat ulang
          </Button>
        </div>
      </div>

      {migrationPending ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          Migrasi database belum dijalankan. Jalankan file{" "}
          <code className="text-xs">supabase/migrations/027_feature_usage_events.sql</code>{" "}
          di Supabase SQL Editor agar tracking live aktif.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Akses Hari Ini
            </CardTitle>
            <MousePointerClick className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatNumber(summary.totalAccessToday)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Klik menu dari semua pengguna aktif hari ini (WIB)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fitur Terpopuler
            </CardTitle>
            <TrendingUp className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summary.topFeature.menu}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatNumber(summary.topFeature.clicksToday)} klik hari ini ·{" "}
              {formatNumber(summary.topFeature.uniqueUsersToday)} pengguna unik
            </p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Menu Jarang Diakses
            </CardTitle>
            <TrendingDown className="size-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {summary.leastUsedFeature.menu}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatNumber(summary.leastUsedFeature.clicksTotal)} klik total ·{" "}
              {summary.leastUsedFeature.path}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Top 5 Fitur Paling Sering Digunakan
          </CardTitle>
          <CardDescription>
            Berdasarkan total klik sepanjang waktu (data live)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!mounted ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              Memuat grafik…
            </div>
          ) : hasAnyData ? (
            <div className="h-[320px] w-full min-h-[280px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topFive}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    className="stroke-border/60"
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    tickFormatter={(value) => formatNumber(Number(value))}
                  />
                  <YAxis
                    type="category"
                    dataKey="menu"
                    width={120}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: "var(--muted)", opacity: 0.25 }}
                  />
                  <Bar
                    dataKey="clicksTotal"
                    radius={[0, 8, 8, 0]}
                    maxBarSize={28}
                  >
                    {topFive.map((entry) => (
                      <Cell key={entry.id} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <p>Belum ada data navigasi tercatat.</p>
              <p className="text-xs">
                Buka beberapa menu sebagai guru — statistik akan muncul otomatis.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Detail Semua Fitur</CardTitle>
          <CardDescription>
            {sortedAll.length} menu · diurutkan dari klik terbanyak ke terkecil
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-6 py-3 font-medium">#</th>
                  <th className="px-6 py-3 font-medium">Menu / Fitur</th>
                  <th className="px-6 py-3 font-medium">Kategori</th>
                  <th className="px-6 py-3 font-medium">Path</th>
                  <th className="px-6 py-3 font-medium text-right">
                    Hari Ini
                  </th>
                  <th className="px-6 py-3 font-medium text-right">7 Hari</th>
                  <th className="px-6 py-3 font-medium text-right">Total</th>
                  <th className="px-6 py-3 font-medium text-right">
                    Pengguna Unik
                  </th>
                  <th className="min-w-[140px] px-6 py-3 font-medium">
                    Proporsi
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedAll.map((item, index) => {
                  const share = Math.round((item.clicksTotal / maxTotal) * 100);

                  return (
                    <tr
                      key={item.id}
                      className="border-b last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-6 py-3 text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="px-6 py-3 font-medium">{item.menu}</td>
                      <td className="px-6 py-3">
                        <Badge variant="secondary" className="font-normal">
                          {item.category}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                        {item.path}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums">
                        {formatNumber(item.clicksToday)}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums">
                        {formatNumber(item.clicksWeek)}
                      </td>
                      <td className="px-6 py-3 text-right font-medium tabular-nums">
                        {formatNumber(item.clicksTotal)}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums">
                        {formatNumber(item.uniqueUsersToday)}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                "h-full rounded-full bg-primary transition-all",
                              )}
                              style={{ width: `${share}%` }}
                            />
                          </div>
                          <span className="w-9 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                            {share}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 p-4 md:hidden">
            {sortedAll.map((item, index) => (
              <div
                key={item.id}
                className="rounded-lg border bg-card p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">#{index + 1}</p>
                    <p className="font-medium">{item.menu}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {item.path}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 font-normal">
                    {item.category}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Hari ini</span>
                    <p className="font-medium tabular-nums">
                      {formatNumber(item.clicksToday)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total</span>
                    <p className="font-medium tabular-nums">
                      {formatNumber(item.clicksTotal)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
