import Link from "next/link";

import { isProfileSubscriptionExpired } from "@/lib/subscription/profile-access";
import { createClient } from "@/lib/supabase/server";

interface PremiumWrapperProps {
  children: React.ReactNode;
  /** Lewati pengecekan (mis. admin). */
  bypass?: boolean;
}

export async function PremiumWrapper({
  children,
  bypass = false,
}: PremiumWrapperProps) {
  if (bypass) return children;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return children;

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_expires_at")
    .eq("id", user.id)
    .maybeSingle();

  const isExpired = isProfileSubscriptionExpired(
    profile?.subscription_expires_at,
  );

  if (!isExpired) return children;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="sticky top-0 z-[60] border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/75">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              Mode Read-Only: Masa berlangganan Anda habis.
            </p>
            <p className="text-xs text-muted-foreground">
              Anda hanya dapat melihat halaman ini tanpa bisa menggunakan tools.
            </p>
          </div>
          <Link
            href="/billing"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Perpanjang Langganan
          </Link>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <div className="relative pointer-events-none select-none opacity-50">
          {children}
        </div>
        <div className="absolute inset-0 z-50" aria-hidden="true" />
      </div>
    </div>
  );
}
