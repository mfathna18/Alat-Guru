export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

import { isProfileAdmin } from "@/lib/auth/require-profile-admin";
import { AdminDashboardCharts } from "@/components/admin/admin-dashboard-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAdminDashboardMetrics } from "@/lib/services/admin-dashboard";
import { Crown, Users, Zap, XCircle } from "lucide-react";

export default async function AdminPage() {
  const isAdmin = await isProfileAdmin();
  if (!isAdmin) {
    redirect("/");
  }

  let metrics;
  try {
    metrics = await fetchAdminDashboardMetrics();
  } catch {
    redirect("/");
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard Admin</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan pengguna dan status langganan.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pengguna
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{metrics.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Admin
            </CardTitle>
            <Crown className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{metrics.totalAdmins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Langganan Aktif
            </CardTitle>
            <Zap className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{metrics.activeSubscriptions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Langganan Expired
            </CardTitle>
            <XCircle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{metrics.expiredSubscriptions}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminDashboardCharts metrics={metrics} />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Catatan</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Grafik paket membaca kolom <code>profiles.subscription_plan</code> dan
            masa aktif membaca <code>profiles.subscription_expires_at</code>.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
