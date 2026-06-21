import { NextResponse } from "next/server";

import {
  diagnoseMidtransClientKey,
  diagnoseMidtransServerKey,
  detectMidtransKeyEnvironment,
  getMidtransClientKey,
  getMidtransEnvironmentMismatchMessage,
  isMidtransServerConfigured,
  resolveMidtransEnvironment,
} from "@/lib/billing/midtrans";

export async function GET() {
  const clientKey = getMidtransClientKey();
  const clientDiag = diagnoseMidtransClientKey(clientKey);
  const serverRaw = process.env.MIDTRANS_SERVER_KEY?.trim() ?? "";
  const serverDiag = diagnoseMidtransServerKey(serverRaw);
  const envMismatch = getMidtransEnvironmentMismatchMessage();
  const resolvedEnv = resolveMidtransEnvironment();

  return NextResponse.json({
    clientKey: clientDiag.ok ? clientKey : "",
    snapConfigured: clientDiag.ok,
    serverConfigured: isMidtransServerConfigured() && serverDiag.ok,
    isProduction: resolvedEnv === "production",
    resolvedEnvironment: resolvedEnv,
    serverKeyEnvironment: detectMidtransKeyEnvironment(serverRaw),
    clientKeyEnvironment: detectMidtransKeyEnvironment(clientKey),
    clientKeyHint: clientDiag.ok ? null : clientDiag.message,
    serverKeyHint: serverDiag.ok ? null : serverDiag.message,
    environmentHint: envMismatch,
  });
}
