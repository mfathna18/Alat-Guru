import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  FileText,
  MessageCircle,
  Shuffle,
  Users,
} from "lucide-react";

import { HomeFeaturesSection } from "@/components/landing/home-features";
import { buttonVariants } from "@/components/ui/button";
import { SHOW_SUBSCRIPTION_UI } from "@/lib/billing/subscription-ui";
import { WHATSAPP_ORDER_URL } from "@/lib/billing/subscription-plans";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const highlights = [
  {
    icon: Users,
    title: "Data Kelas & Siswa",
    description:
      "Buat kelas dan impor data siswa dari Excel. Data otomatis dipakai di fitur lain.",
    accent: "border-l-orange-400 bg-orange-50/60 dark:bg-orange-950/20",
    iconBg: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  },
  {
    icon: CalendarCheck,
    title: "Absensi & Penilaian",
    description:
      "Catat kehadiran harian dan input nilai formatif maupun sumatif dalam satu sistem.",
    accent: "border-l-sky-400 bg-sky-50/60 dark:bg-sky-950/20",
    iconBg: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  },
  {
    icon: FileText,
    title: "Rapor Semester",
    description:
      "Preview dan cetak rapor semester setelah nilai dan data sikap terisi.",
    accent: "border-l-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/20",
    iconBg:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  {
    icon: Shuffle,
    title: "Alat Bantu Kelas",
    description:
      "Acak kelompok dan undi nama siswa langsung dari daftar kelas Anda.",
    accent: "border-l-violet-400 bg-violet-50/60 dark:bg-violet-950/20",
    iconBg:
      "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  },
];

export default async function HomePage() {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        redirect("/dashboard");
      }
    } catch {
      // Lanjut tampilkan landing
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5 font-semibold">
            <Image
              src="/alat-guru-logo.png"
              alt="Alat Guru"
              width={36}
              height={36}
              className="size-9 rounded-lg object-contain"
              priority
            />
            Alat Guru
          </Link>
          <div className="flex items-center gap-2">
            {SHOW_SUBSCRIPTION_UI ? (
              <Link
                href="/pricing"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Harga
              </Link>
            ) : null}
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Masuk
            </Link>
            <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}>
              Daftar
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden border-b px-4 py-16 md:py-24">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-100/70 via-amber-50/40 to-sky-50/50 dark:from-orange-950/30 dark:via-background dark:to-sky-950/20"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-orange-200/30 blur-3xl dark:bg-orange-900/20"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-16 size-64 rounded-full bg-sky-200/30 blur-3xl dark:bg-sky-900/20"
            aria-hidden
          />

          <div className="relative mx-auto max-w-4xl text-center">
            <p className="mb-4 inline-flex rounded-full border border-orange-200/80 bg-orange-50 px-3 py-1 text-sm font-medium text-orange-800 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-200">
              Untuk guru SD, SMP, SMA & MA
            </p>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-[3.25rem] lg:leading-tight">
              Kelola kelas, nilai, dan rapor —{" "}
              <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent dark:from-orange-400 dark:to-amber-300">
                semua dari satu tempat
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              <strong className="font-semibold text-foreground">Alat Guru</strong>{" "}
              membantu Anda mengurus data siswa, absensi, penilaian, dan rapor
              semester secara online — praktis, rapi, dan mudah dipelajari.
            </p>

            {!isSupabaseConfigured() && (
              <p className="mx-auto mt-6 max-w-lg rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Supabase belum dikonfigurasi. Isi <code>.env.local</code> lalu
                jalankan <code>npm run dev</code>.
              </p>
            )}

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "min-w-[200px] bg-orange-600 hover:bg-orange-600/90",
                )}
              >
                Mulai Gratis — Daftar Sekarang
              </Link>
              {SHOW_SUBSCRIPTION_UI ? (
                <Link
                  href="/pricing"
                  className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
                >
                  Lihat Paket & Harga
                </Link>
              ) : null}
            </div>
          </div>

          <div className="relative mx-auto mt-14 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((item) => (
              <div
                key={item.title}
                className={cn(
                  "rounded-xl border border-l-4 p-4 text-left shadow-sm backdrop-blur-sm",
                  item.accent,
                )}
              >
                <div
                  className={cn(
                    "mb-3 flex size-10 items-center justify-center rounded-lg",
                    item.iconBg,
                  )}
                >
                  <item.icon className="size-5" />
                </div>
                <h2 className="font-semibold">{item.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <HomeFeaturesSection />
        </section>

        <section className="border-t bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-14 text-center text-white">
          <BookOpen className="mx-auto mb-3 size-8 opacity-90" />
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">
            Siap menghemat waktu administrasi?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-orange-50/90">
            {SHOW_SUBSCRIPTION_UI
              ? "Daftar akun gratis, lalu aktifkan paket langganan untuk akses penuh semua fitur."
              : "Daftar akun gratis dan mulai kelola kelas, nilai, serta rapor dari satu dashboard."}
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                "min-w-[180px] bg-white text-orange-700 hover:bg-orange-50",
              )}
            >
              Daftar Sekarang
              <ArrowRight className="ml-2 size-4" />
            </Link>
            {SHOW_SUBSCRIPTION_UI ? (
              <a
                href={WHATSAPP_ORDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "min-w-[180px] border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white",
                )}
              >
                <MessageCircle className="mr-2 size-4" />
                Order via WhatsApp
              </a>
            ) : null}
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Alat Guru · Dibangun untuk guru Indonesia
      </footer>
    </div>
  );
}
