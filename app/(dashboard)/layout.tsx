import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardChrome } from "@/components/layout/dashboard-chrome";
import { PremiumWrapper } from "@/components/subscription/premium-wrapper";
import { isProfileAdmin } from "@/lib/auth/require-profile-admin";
import type { SubscriptionAccess } from "@/lib/billing/types";
import { subscriptionAccessFromProfile } from "@/lib/subscription/profile-access";
import { fetchBillingOverviewServer } from "@/lib/services/billing-server";
import { getDashboardSummary } from "@/lib/services/guru";
import { createClient } from "@/lib/supabase/server";

const FULL_ACCESS_FALLBACK: SubscriptionAccess = {
  mode: "full",
  status: "active",
  canWrite: true,
  isTrial: false,
  isGrace: false,
  isReadOnly: false,
  daysLeft: null,
  expiresAt: null,
  message: "",
  effectivePriceIdr: 20000,
  listPriceIdr: 30000,
  promoActive: true,
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const summary = await getDashboardSummary();

  if (!summary) {
    redirect("/login?redirect=/dashboard");
  }

  const displayName =
    summary.guru?.nama_guru ?? summary.email.split("@")[0] ?? "Guru";

  let subscriptionAccess = FULL_ACCESS_FALLBACK;
  try {
    const billing = await fetchBillingOverviewServer();
    if (billing) subscriptionAccess = billing.access;
  } catch {
    // Billing tables belum dimigrasi — fallback akses penuh sementara
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_plan, subscription_expires_at")
        .eq("id", user.id)
        .maybeSingle();

      const profileAccess = subscriptionAccessFromProfile(
        profile?.subscription_plan,
        profile?.subscription_expires_at,
      );

      if (profileAccess) {
        subscriptionAccess = {
          ...subscriptionAccess,
          ...profileAccess,
        };
      }
    }
  } catch {
    // Abaikan — tetap pakai billing access
  }

  const isAdmin = await isProfileAdmin();

  const pathname = (await headers()).get("x-pathname") ?? "";
  const bypassPremium =
    isAdmin ||
    pathname === "/billing" ||
    pathname.startsWith("/billing/") ||
    pathname === "/kritik-saran";

  return (
    <DashboardChrome
      displayName={displayName}
      email={summary.email}
      mataPelajaran={summary.guru?.mata_pelajaran}
      subscriptionAccess={subscriptionAccess}
      isAdmin={isAdmin}
    >
      <PremiumWrapper bypass={bypassPremium}>{children}</PremiumWrapper>
    </DashboardChrome>
  );
}
