import { NextResponse } from "next/server";

import {
  isMidtransFailed,
  isMidtransPaid,
  verifyMidtransSignature,
} from "@/lib/billing/midtrans";
import {
  markPaymentFailed,
  markPaymentPaid,
} from "@/lib/services/billing-admin";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;

    if (!verifyMidtransSignature(payload as never)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const orderId = String(payload.order_id ?? "");
    const transactionStatus = String(payload.transaction_status ?? "");

    if (!orderId) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    }

    if (isMidtransPaid(transactionStatus)) {
      await markPaymentPaid(orderId, payload);
    } else if (isMidtransFailed(transactionStatus)) {
      const status =
        transactionStatus === "expire" ? "expired" : "failed";
      await markPaymentFailed(orderId, payload, status);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[midtrans webhook]", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
