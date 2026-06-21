"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, UserCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import {
  useGuruProfile,
  useUpdateGuruProfile,
} from "@/lib/hooks/use-guru-profile";
import { cn } from "@/lib/utils";

const MATA_PELAJARAN_SUGGESTIONS = [
  "Umum",
  "Matematika",
  "Bahasa Indonesia",
  "IPA",
  "IPS",
  "PJOK",
  "Seni Budaya",
  "Prakarya",
  "Bahasa Inggris",
];

export function GuruProfilForm() {
  const router = useRouter();
  const { data: guru, isLoading } = useGuruProfile();
  const updateProfile = useUpdateGuruProfile();

  const [namaGuru, setNamaGuru] = React.useState("");
  const [nipGuru, setNipGuru] = React.useState("");
  const [mataPelajaran, setMataPelajaran] = React.useState("Umum");
  const hydrated = React.useRef(false);

  React.useEffect(() => {
    if (guru && !hydrated.current) {
      setNamaGuru(guru.nama_guru);
      setNipGuru(guru.nip_guru ?? "");
      setMataPelajaran(guru.mata_pelajaran || "Umum");
      hydrated.current = true;
    }
  }, [guru]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({
        nama_guru: namaGuru,
        nip_guru: nipGuru || null,
        mata_pelajaran: mataPelajaran,
      });
      toast.success("Profil guru diperbarui");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan profil");
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Memuat profil…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">
          Profil Guru
        </h1>
        <p className="text-sm text-muted-foreground">
          Data ini muncul di dokumen ekspor PDF dan metadata administrasi.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCircle className="size-5" />
            Identitas Guru
          </CardTitle>
          <CardDescription>
            Email akun login tidak dapat diubah dari sini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                className="min-h-11 bg-muted"
                value={guru?.email ?? ""}
                disabled
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nama-guru">Nama Lengkap</Label>
              <Input
                id="nama-guru"
                className="min-h-11"
                placeholder="Budi Santoso, S.Pd."
                value={namaGuru}
                onChange={(e) => setNamaGuru(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nip-guru">NIP (opsional)</Label>
              <Input
                id="nip-guru"
                className="min-h-11"
                placeholder="196501011990031001"
                value={nipGuru}
                onChange={(e) => setNipGuru(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mapel">Mata Pelajaran</Label>
              <Input
                id="mapel"
                className="min-h-11"
                list="mapel-suggestions"
                value={mataPelajaran}
                onChange={(e) => setMataPelajaran(e.target.value)}
                required
              />
              <datalist id="mapel-suggestions">
                {MATA_PELAJARAN_SUGGESTIONS.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {MATA_PELAJARAN_SUGGESTIONS.slice(0, 5).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMataPelajaran(m)}
                    className="rounded-full border px-2.5 py-1 text-xs hover:bg-muted"
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {guru?.created_at && (
              <p className="text-xs text-muted-foreground">
                Terdaftar sejak{" "}
                {new Date(guru.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}

            <Button
              type="submit"
              disabled={updateProfile.isPending}
              className={cn("min-h-11 w-full sm:w-auto")}
            >
              {updateProfile.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Save className="mr-2 size-4" />
              )}
              Simpan Profil
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="flex flex-wrap items-center gap-2 py-4 text-sm text-muted-foreground">
          <Badge variant="outline">Zero Redundancy</Badge>
          <span>
            Nama &amp; mapel guru otomatis tercantum di header PDF rekap
            penilaian.
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
