import { GRACE_DAYS } from "@/lib/billing/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Payment, Plan, Subscription } from "@/lib/billing/types";

function addDaysIso(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export async function activateSubscriptionAfterPayment(payment: Payment) {
  const admin = createAdminClient();

  const { data: sub, error: subErr } = await admin
    .from("subscriptions")
    .select("*, plan:plans(*)")
    .eq("id_guru", payment.id_guru)
    .single();

  if (subErr || !sub) throw subErr ?? new Error("Subscription tidak ditemukan.");

  const subscription = sub as Subscription & { plan: Plan };
  const plan = subscription.plan;
  const intervalDays = plan?.interval_days ?? 30;

  const now = new Date();
  const periodStart = now.toISOString();
  const periodEnd = addDaysIso(now, intervalDays);
  const graceEnd = addDaysIso(new Date(periodEnd), GRACE_DAYS);

  const { error: updateSubErr } = await admin
    .from("subscriptions")
    .update({
      plan_id: payment.plan_id,
      status: "active",
      trial_ends_at: null,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      grace_ends_at: graceEnd,
      cancelled_at: null,
    })
    .eq("id", subscription.id);

  if (updateSubErr) throw updateSubErr;

  await admin
    .from("payments")
    .update({ subscription_id: subscription.id })
    .eq("id", payment.id);
}

export async function markPaymentPaid(
  orderId: string,
  payload: Record<string, unknown>,
) {
  const admin = createAdminClient();

  const { data: payment, error } = await admin
    .from("payments")
    .select("*")
    .eq("gateway_order_id", orderId)
    .maybeSingle();

  if (error) throw error;
  if (!payment) throw new Error("Payment tidak ditemukan.");
  if (payment.status === "paid") return payment as Payment;

  const { data: updated, error: updateErr } = await admin
    .from("payments")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      gateway_transaction_id:
        (payload.transaction_id as string | undefined) ?? null,
      payment_method: (payload.payment_type as string | undefined) ?? null,
      gateway_response: payload,
    })
    .eq("id", payment.id)
    .select()
    .single();

  if (updateErr) throw updateErr;

  await activateSubscriptionAfterPayment(updated as Payment);
  return updated as Payment;
}

export async function markPaymentFailed(
  orderId: string,
  payload: Record<string, unknown>,
  status: "failed" | "expired",
) {
  const admin = createAdminClient();
  await admin
    .from("payments")
    .update({ status, gateway_response: payload })
    .eq("gateway_order_id", orderId)
    .neq("status", "paid");
}

export async function reconcileSubscriptionRow(sub: Subscription) {
  const admin = createAdminClient();
  const now = new Date();

  let nextStatus = sub.status;
  let graceEnds = sub.grace_ends_at;

  if (sub.status === "trial" && sub.trial_ends_at) {
    if (now > new Date(sub.trial_ends_at)) nextStatus = "expired";
  }

  if (sub.current_period_end) {
    const periodEnd = new Date(sub.current_period_end);
    if (now > periodEnd) {
      graceEnds = graceEnds ?? addDaysIso(periodEnd, GRACE_DAYS);
      if (now <= new Date(graceEnds)) nextStatus = "grace";
      else nextStatus = "expired";
    } else {
      nextStatus = "active";
    }
  }

  if (nextStatus !== sub.status || graceEnds !== sub.grace_ends_at) {
    await admin
      .from("subscriptions")
      .update({ status: nextStatus, grace_ends_at: graceEnds })
      .eq("id", sub.id);
    return { ...sub, status: nextStatus, grace_ends_at: graceEnds };
  }

  return sub;
}
