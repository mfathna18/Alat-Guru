"use client";

import { Loader2, ShieldCheck } from "lucide-react";

import { SubscriptionPricingCards } from "@/components/billing/subscription-pricing-cards";
import { SubscriptionBanner } from "@/components/billing/subscription-banner";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useBillingOverview } from "@/lib/hooks/use-billing";

function statusBadgeLabel(status: string, isReadOnly: boolean): string {
  if (isReadOnly) return "Read-Only";
  if (status === "trial") return "Trial";
  if (status === "active") return "Premium Aktif";
  if (status === "grace") return "Masa Tenggang";
  if (status === "expired") return "Kedaluwarsa";
  return "Tidak Aktif";
}

export function BillingManager() {
  const { data, isLoading } = useBillingOverview();

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Memuat langganan…
      </div>
    );
  }

  if (!data) return null;

  const { access } = data;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Langganan</h1>
        <p className="text-sm text-muted-foreground">
          Lihat status paket Anda dan pilih paket langganan.
        </p>
      </div>

      <SubscriptionBanner access={access} showCta={false} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-primary" />
            Status Langganan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant={access.canWrite ? "default" : "secondary"}>
              {statusBadgeLabel(access.status, access.isReadOnly)}
            </Badge>
            {access.daysLeft != null && (
              <Badge variant="outline">{access.daysLeft} hari tersisa</Badge>
            )}
          </div>
          {access.message ? (
            <p className="text-sm text-muted-foreground">{access.message}</p>
          ) : null}
        </CardContent>
      </Card>

      <SubscriptionPricingCards />
    </div>
  );
}
