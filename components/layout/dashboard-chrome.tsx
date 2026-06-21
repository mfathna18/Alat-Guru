"use client";

import { FeatureUsageTracker } from "@/components/analytics/feature-usage-tracker";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { UserNav } from "@/components/layout/user-nav";
import {
  SubscriptionBanner,
  SubscriptionProvider,
} from "@/components/billing/subscription-banner";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ViewportProvider } from "@/hooks/use-viewport-mode";
import type { SubscriptionAccess } from "@/lib/billing/types";

interface DashboardChromeProps {
  displayName: string;
  email: string;
  mataPelajaran?: string;
  subscriptionAccess: SubscriptionAccess;
  isAdmin?: boolean;
  children: React.ReactNode;
}

export function DashboardChrome({
  displayName,
  email,
  mataPelajaran,
  subscriptionAccess,
  isAdmin = false,
  children,
}: DashboardChromeProps) {
  return (
    <ViewportProvider>
      <SubscriptionProvider access={subscriptionAccess}>
        <FeatureUsageTracker />
        <SidebarProvider>
          <AppSidebar isAdmin={isAdmin} />
          <SidebarInset className="min-h-svh">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1 md:inline-flex" />
              <Separator
                orientation="vertical"
                className="mr-2 hidden h-4 md:block"
              />
              <span className="hidden truncate text-sm text-muted-foreground lg:inline">
                Kelola kelas, nilai, dan rapor dari satu tempat
              </span>
              <span className="truncate text-sm font-medium md:hidden">
                Alat Guru
              </span>
              <UserNav
                namaGuru={displayName}
                email={email}
                mataPelajaran={mataPelajaran}
              />
            </header>
            {(subscriptionAccess.message ||
              subscriptionAccess.isTrial ||
              subscriptionAccess.isGrace ||
              subscriptionAccess.isReadOnly) && (
              <div className="border-b px-3 py-2 md:px-6">
                <SubscriptionBanner access={subscriptionAccess} />
              </div>
            )}
            <main className="flex-1 p-3 pb-24 md:p-6 md:pb-6">{children}</main>
            <BottomNav />
          </SidebarInset>
        </SidebarProvider>
      </SubscriptionProvider>
    </ViewportProvider>
  );
}
