"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { SupabaseConnectionStatus } from "@/components/auth/supabase-connection-status";
import { AuthDivider } from "@/components/auth/auth-divider";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError, googleFlowStateExpiredMessage, googleRedirectMismatchMessage } from "@/lib/auth-errors";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const error = searchParams.get("error");
    const detail = searchParams.get("detail");

    // Supabase kadang mengembalikan error di hash (#error=...) bukan query string
    const hash =
      typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    const hashParams = new URLSearchParams(hash);
    const hashError = hashParams.get("error_description") ?? hashParams.get("error");
    const hashCode = hashParams.get("error_code");

    if (error === "auth_callback_failed" || hashError || hashCode) {
      const rawDetail = detail ?? hashError ?? "";
      const detailLower = rawDetail.toLowerCase();
      let message =
        "Login Google gagal. Pastikan Google OAuth sudah diaktifkan di Supabase dan redirect URI benar.";

      if (
        detailLower.includes("database error saving new user") ||
        hashCode === "unexpected_failure"
      ) {
        message =
          "Gagal menyimpan user baru ke database. Jalankan migrasi 022_fix_auth_signup_triggers.sql di Supabase SQL Editor, lalu coba login lagi.";
      } else if (
        detailLower.includes("code verifier") ||
        detailLower.includes("flow state")
      ) {
        message = googleFlowStateExpiredMessage();
      } else if (detailLower.includes("redirect")) {
        message = googleRedirectMismatchMessage();
      } else if (rawDetail) {
        message = translateAuthError(rawDetail);
      }

      toast.error(message);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Berhasil masuk");
      router.push(redirect);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal masuk. Periksa kredensial.";
      toast.error(translateAuthError(message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <GraduationCap className="size-6" />
        </div>
        <CardTitle>Masuk ke Dashboard</CardTitle>
        <CardDescription>
          Masuk dengan Google atau email yang terdaftar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SupabaseConnectionStatus />
        <GoogleSignInButton redirectPath={redirect} />
        <AuthDivider />
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="guru@sekolah.sch.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Kata Sandi</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Masuk
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Belum punya akun?{" "}
          <Link href="/register" className="text-primary underline-offset-4 hover:underline">
            Daftar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      <Suspense fallback={<Loader2 className="size-8 animate-spin text-muted-foreground" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
