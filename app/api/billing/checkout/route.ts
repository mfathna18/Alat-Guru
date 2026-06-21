import { NextResponse } from "next/server";

import { createCheckoutPayment } from "@/lib/services/billing-server";

export async function POST() {
  try {
    const result = await createCheckoutPayment();
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Gagal membuat checkout.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
