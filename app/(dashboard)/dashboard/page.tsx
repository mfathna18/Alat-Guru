import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  School,
  Shuffle,
  Users,
} from "lucide-react";

import { ZeroRedundancyFlow } from "@/components/dashboard/zero-redundancy-flow";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDashboardSummary } from "@/lib/services/guru";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: GraduationCap,
    title: "Kelas & Siswa",
    description:
      "Buat rombel dan kelola data siswa. Impor dari Excel untuk mengisi banyak data sekaligus.",
  },
  {
    icon: CalendarCheck,
    title: "Absensi",
    description:
      "Catat kehadiran harian per kelas dan unduh rekap absensi bulanan.",
  },
  {
    icon: BookOpen,
    title: "Tujuan Pembelajaran",
    description:
      "Susun TP, indikator capaian, dan rubrik. Langsung terhubung ke lembar penilaian.",
  },
  {
    icon: ClipboardList,
    title: "Penilaian",
    description:
      "Input nilai formatif dan sumatif per indikator, plus analisis remedial dan pengayaan.",
  },
  {
    icon: FileText,
    title: "E-Rapor",
    description:
      "Preview dan cetak rapor semester per siswa, siap PDF atau Word.",
  },
  {
    icon: Shuffle,
    title: "Alat Kelas",
    description:
      "Acak kelompok siswa dan undi nama untuk kegiatan di kelas.",
  },
];

export default async function DashboardPage() {
  const summary = await getDashboardSummary();
  if (!summary) redirect("/login");

  const namaGuru =
    summary.guru?.nama_guru ?? summary.email.split("@")[0] ?? "Guru";
  const { stats } = summary;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="space-y-3">
        <Badge variant="outline">Alat Guru</Badge>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Selamat datang, {namaGuru}
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          {stats.hasPengaturanSekolah && stats.namaSekolah
            ? `${stats.namaSekolah}${stats.tahunAjaran ? ` · TA ${stats.tahunAjaran}` : ""}`
            : "Kelola kelas, siswa, penilaian, dan rapor dari satu tempat."}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Kelas</CardDescription>
            <CardTitle className="text-3xl">{stats.totalKelas}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/kelas" className="text-sm text-primary hover:underline">
              Kelola kelas →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Siswa Aktif</CardDescription>
            <CardTitle className="text-3xl">{stats.totalSiswaAktif}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/siswa" className="text-sm text-primary hover:underline">
              Kelola siswa →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Profil Sekolah</CardDescription>
            <CardTitle className="text-lg">
              {stats.hasPengaturanSekolah ? "Sudah diatur" : "Belum diatur"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href="/pengaturan"
              className="text-sm text-primary hover:underline"
            >
              {stats.hasPengaturanSekolah ? "Perbarui →" : "Atur sekarang →"}
            </Link>
          </CardContent>
        </Card>
      </section>

      <ZeroRedundancyFlow />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader className="pb-2">
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="size-5" />
              </div>
              <CardTitle className="text-base">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{feature.description}</CardDescription>
            </CardContent>
          </Card>
        ))}

        <Card className="border-primary/30 bg-primary/5 sm:col-span-2 lg:col-span-1">
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <School className="size-5" />
            </div>
            <CardTitle className="text-base">Mulai Setup</CardTitle>
            <CardDescription>
              Lengkapi profil sekolah, buat kelas, impor siswa, lalu susun TP.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/pengaturan"
              className={cn(buttonVariants(), "w-full inline-flex items-center justify-center")}
            >
              Atur Profil Sekolah
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
