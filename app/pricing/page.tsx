import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SubscriptionPricingCards } from "@/components/billing/subscription-pricing-cards";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PricingPage() {
  return (
    <div className="min-h-full bg-gradient-to-b from-orange-50/80 via-background to-background dark:from-orange-950/20">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            <ArrowLeft className="mr-2 size-4" />
            Beranda
          </Link>
          <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}>
            Daftar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-10 text-center">
          <Image
            src="/alat-guru-logo.png"
            alt="Alat Guru"
            width={48}
            height={48}
            className="mx-auto mb-4 size-12 rounded-lg object-contain"
          />
          <h1 className="text-3xl font-bold tracking-tight">Paket & Harga</h1>
          <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
            Pilih paket langganan Alat Guru. Setelah bayar, kirim bukti via
            WhatsApp — akun Anda akan diaktifkan oleh admin.
          </p>
        </div>

        <SubscriptionPricingCards />

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Masuk di sini
          </Link>
        </p>
      </main>
    </div>
  );
}
