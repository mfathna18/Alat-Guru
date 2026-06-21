"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMounted } from "@/hooks/use-mounted";
import type { AdminDashboardMetrics } from "@/lib/services/admin-dashboard";

export function AdminDashboardCharts({ metrics }: { metrics: AdminDashboardMetrics }) {
  const mounted = useMounted();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Distribusi Paket</CardTitle>
        <CardDescription>Free, 1 Month, 3 Months, 1 Year</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full min-h-[260px]">
          {!mounted ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Memuat grafik…
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={metrics.byPlan}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius="58%"
                outerRadius="82%"
                paddingAngle={3}
                stroke="transparent"
              >
                {metrics.byPlan.map((entry) => (
                  <Cell key={entry.plan} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0];
                  const label = String(item.name ?? "");
                  const value = Number(item.value ?? 0);
                  return (
                    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
                      <p className="font-medium text-popover-foreground">{label}</p>
                      <p className="text-muted-foreground">{value} pengguna</p>
                    </div>
                  );
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">{String(value)}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

