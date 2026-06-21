"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { getLoginUrl } from "@/lib/auth/site-url";

interface HealthResponse {
  ok: boolean;
  configured?: boolean;
  database?: string;
  message?: string;
}

async function pingSupabaseDirect(): Promise<{ ok: boolean; message: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return {
      ok: false,
      message:
        "Variabel env Supabase tidak ditemukan di build. Isi .env.local lalu restart dev server.",
    };
  }

  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
      cache: "no-store",
    });
    if (res.ok) {
      return {
        ok: true,
        message: "Supabase cloud terjangkau. Server lokal belum jalan — jalankan scripts\\dev-win.cmd",
      };
    }
    return {
      ok: false,
      message: `Supabase menolak koneksi (HTTP ${res.status}). Periksa URL/key di .env.local.`,
    };
  } catch {
    return {
      ok: false,
      message:
        "Tidak bisa menjangkau Supabase. Periksa koneksi internet atau status project di dashboard Supabase.",
    };
  }
}

export function SupabaseConnectionStatus() {
  const [state, setState] = React.useState<
    "loading" | "ok" | "warn" | "error"
  >("loading");
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/health/supabase", {
          cache: "no-store",
        });
        const data = (await res.json()) as HealthResponse;
        if (cancelled) return;

        if (data.ok) {
          setState("ok");
          setMessage(data.message ?? "Supabase terhubung.");
          return;
        }

        if (data.configured === false) {
          setState("error");
          setMessage(
            data.message ??
              "Supabase belum dikonfigurasi di .env.local. Restart dev server setelah mengubah env.",
          );
          return;
        }

        if (data.database === "migration_required") {
          setState("warn");
          setMessage(data.message ?? "Schema database belum lengkap.");
          return;
        }

        setState("error");
        setMessage(data.message ?? "Koneksi Supabase gagal.");
      } catch {
        if (cancelled) return;

        const direct = await pingSupabaseDirect();
        if (cancelled) return;

        if (direct.ok) {
          setState("error");
          setMessage(
            `${direct.message}\n\nJalankan di terminal:\ncmd /c "scripts\\dev-win.cmd"\nLalu buka ${getLoginUrl()}`,
          );
          return;
        }

        setState("error");
        setMessage(direct.message);
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  const Icon =
    state === "loading"
      ? Loader2
      : state === "ok"
        ? CheckCircle2
        : AlertCircle;

  const colorClass =
    state === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
      : state === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
        : "border-destructive/30 bg-destructive/5 text-destructive";

  return (
    <div
      className={`mb-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${colorClass}`}
      role="status"
    >
      <Icon
        className={`mt-0.5 size-4 shrink-0 ${state === "loading" ? "animate-spin" : ""}`}
        aria-hidden
      />
      <p className="whitespace-pre-line">
        {state === "loading" ? "Memeriksa koneksi Supabase…" : message}
      </p>
    </div>
  );
}
