import { resolveSubscriptionAccess, reconcileSubscriptionStatus } from "@/lib/billing/subscription-access";
import { getEffectivePriceIdr } from "@/lib/billing/pricing";
import type { Payment, Plan, Subscription, SubscriptionAccess } from "@/lib/billing/types";
import { isMidtransSnapConfigured } from "@/lib/billing/midtrans";
import { createClient } from "@/lib/supabase/client";
import { fetchCurrentGuru } from "@/lib/services/kelas";
import type { Guru } from "@/lib/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface BillingOverview {
  subscription: Subscription | null;
  plan: Plan | null;
  access: SubscriptionAccess;
  payments: Payment[];
  midtransConfigured: boolean;
}

export async function buildBillingOverview(
  supabase: SupabaseClient,
  guru: Guru,
): Promise<Omit<BillingOverview, "midtransConfigured">> {
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("*, plan:plans(*)")
    .eq("id_guru", guru.id)
    .maybeSingle();

  const subscription = sub as (Subscription & { plan: Plan }) | null;
  const plan = subscription?.plan ?? null;

  let normalizedSub = subscription;
  if (subscription) {
    const status = reconcileSubscriptionStatus(subscription);
    if (status !== subscription.status) {
      normalizedSub = { ...subscription, status };
    }
  }

  const access = resolveSubscriptionAccess(normalizedSub, plan);

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("id_guru", guru.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return {
    subscription: normalizedSub,
    plan,
    access,
    payments: (payments ?? []) as Payment[],
  };
}

export async function fetchBillingOverview(): Promise<BillingOverview | null> {
  try {
    const supabase = createClient();
    const guru = await fetchCurrentGuru();
    const overview = await buildBillingOverview(supabase, guru);
    return { ...overview, midtransConfigured: isMidtransSnapConfigured() };
  } catch {
    return null;
  }
}
