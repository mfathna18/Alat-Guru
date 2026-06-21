"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { getAuthCallbackUrl } from "@/lib/auth/site-url";
import { translateAuthError } from "@/lib/auth-errors";

export default function RegisterPage() {
  const router = useRouter();
  const [namaGuru, setNamaGuru] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nama_guru: namaGuru },
          emailRedirectTo: getAuthCallbackUrl("/dashboard"),
        },
      });

      if (error) throw error;

      if (data.session) {
        toast.success("Akun berhasil dibuat. Selamat datang!");
        router.push("/dashboard");
        router.refresh();
        return;
      }

      toast.success(
        "Akun dibuat. Cek email untuk konfirmasi, lalu masuk ke dashboard.",
      );
      router.push("/login");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal mendaftar. Coba lagi.";
      toast.error(translateAuthError(message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="size-6" />
          </div>
          <CardTitle>Daftar Akun Guru</CardTitle>
          <CardDescription>
            Profil guru otomatis dibuat saat registrasi berhasil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SupabaseConnectionStatus />
          <GoogleSignInButton
            redirectPath="/dashboard"
            label="Daftar dengan Google"
          />
          <AuthDivider />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap</Label>
              <Input
                id="nama"
                placeholder="Budi Santoso, S.Pd."
                value={namaGuru}
                onChange={(e) => setNamaGuru(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="guru@sekolah.sch.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <Input
                id="password"
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Daftar
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              Masuk
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
