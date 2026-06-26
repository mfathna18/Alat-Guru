import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { KritikSaranForm } from "@/components/kritik-saran/kritik-saran-form";
import { getDashboardSummary } from "@/lib/services/guru";

export const metadata: Metadata = {
  title: "Kritik dan Saran",
  description:
    "Laporkan bug, error, atau sampaikan saran fitur baru ke admin Alat Guru via WhatsApp.",
};

export default async function KritikSaranPage() {
  const summary = await getDashboardSummary();

  if (!summary) {
    redirect("/login?redirect=/kritik-saran");
  }

  const displayName =
    summary.guru?.nama_guru ?? summary.email.split("@")[0] ?? "Guru";

  return (
    <KritikSaranForm userName={displayName} userEmail={summary.email} />
  );
}
