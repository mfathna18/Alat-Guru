import { getEffectivePriceIdr } from "@/lib/billing/pricing";
import type { Payment, Plan } from "@/lib/billing/types";
import {
  createSnapTransaction,
  getMidtransClientKey,
  isMidtransServerConfigured,
  isMidtransSnapConfigured,
  resolveMidtransEnvironment,
} from "@/lib/billing/midtrans";
import { createClient } from "@/lib/supabase/server";
import type { Guru } from "@/lib/types/database";

import {
  buildBillingOverview,
  type BillingOverview,
} from "@/lib/services/billing";

export type { BillingOverview };

export async function fetchBillingOverviewServer(): Promise<BillingOverview | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: guru, error } = await supabase
      .from("guru")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    if (error || !guru) return null;

    const overview = await buildBillingOverview(supabase, guru as Guru);
    return {
      ...overview,
      midtransConfigured:
        isMidtransSnapConfigured() && isMidtransServerConfigured(),
    };
  } catch {
    return null;
  }
}

export async function createCheckoutPayment(planSlug = "premium-monthly") {
  if (!isMidtransServerConfigured()) {
    throw new Error(
      "MIDTRANS_SERVER_KEY belum dikonfigurasi di .env.local (server-side). Restart dev server setelah mengisi.",
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesi tidak valid.");

  const { data: guru, error: guruErr } = await supabase
    .from("guru")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (guruErr || !guru) throw new Error("Profil guru tidak ditemukan.");

  const typedGuru = guru as Guru;

  const { data: plan, error: planErr } = await supabase
    .from("plans")
    .select("*")
    .eq("slug", planSlug)
    .eq("is_active", true)
    .single();

  if (planErr || !plan) throw new Error("Paket langganan tidak ditemukan.");

  const typedPlan = plan as Plan;
  const amount = getEffectivePriceIdr(typedPlan);
  const orderId = `TD-${typedGuru.id}-${Date.now()}`;

  const { data: payment, error: payErr } = await supabase
    .from("payments")
    .insert({
      id_guru: typedGuru.id,
      plan_id: typedPlan.id,
      gateway: "midtrans",
      gateway_order_id: orderId,
      amount_idr: amount,
      original_price_idr: typedPlan.price_idr,
      status: "pending",
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (payErr) throw payErr;

  const snapToken = await createSnapTransaction({
    orderId,
    grossAmount: amount,
    customerEmail: typedGuru.email,
    customerName: typedGuru.nama_guru,
  });

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  await admin.from("payments").update({ snap_token: snapToken }).eq("id", payment.id);

  return {
    payment: payment as Payment,
    snapToken,
    clientKey: getMidtransClientKey(),
    isProduction: resolveMidtransEnvironment() === "production",
  };
}
