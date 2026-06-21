"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type { SubscriptionAccess } from "@/lib/billing/types";
import { cn } from "@/lib/utils";

const SubscriptionContext = React.createContext<SubscriptionAccess | null>(null);

export function SubscriptionProvider({
  access,
  children,
}: {
  access: SubscriptionAccess;
  children: React.ReactNode;
}) {
  return (
    <SubscriptionContext.Provider value={access}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionAccess() {
  return React.useContext(SubscriptionContext);
}

export function useCanWrite() {
  const access = useSubscriptionAccess();
  return access?.canWrite ?? true;
}

interface SubscriptionBannerProps {
  access: SubscriptionAccess;
  showCta?: boolean;
  className?: string;
}

export function SubscriptionBanner({
  access,
  showCta = true,
  className,
}: SubscriptionBannerProps) {
  if (!access.message) {
    return null;
  }

  if (access.mode === "full" && access.status === "active" && !access.isTrial) {
    return null;
  }

  const isWarning = access.isGrace || access.isTrial;
  const isDanger = access.isReadOnly;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        isDanger && "border-rose-300 bg-rose-50 dark:bg-rose-950/30",
        isWarning && !isDanger && "border-amber-300 bg-amber-50 dark:bg-amber-950/30",
        className,
      )}
    >
      <div className="flex items-start gap-2 text-sm">
        {isDanger ? (
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-600" />
        ) : (
          <Clock className="mt-0.5 size-4 shrink-0 text-amber-600" />
        )}
        <div>
          <p className="font-medium">{access.message}</p>
          {access.daysLeft != null && access.daysLeft <= 3 && (
            <p className="text-xs text-muted-foreground">
              {access.daysLeft} hari lagi
              {access.isReadOnly
                ? " — Anda masih bisa melihat data, tidak bisa mengedit."
                : ""}
            </p>
          )}
        </div>
      </div>
      {showCta && (access.isReadOnly || access.isGrace || access.isTrial) && (
        <Link
          href="/billing"
          className={cn(buttonVariants({ size: "sm" }), "min-h-9 shrink-0 inline-flex items-center justify-center px-3")}
        >
          {access.isReadOnly ? "Perpanjang Langganan" : "Kelola Langganan"}
        </Link>
      )}
    </div>
  );
}
