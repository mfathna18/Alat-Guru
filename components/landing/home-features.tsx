import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  Settings,
  Shield,
  Shuffle,
  Users,
  WifiOff,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const featureGroups = [
  {
    label: "Manajemen Kelas",
    features: [
      {
        icon: GraduationCap,
        title: "Kelas & Modul Ajar",
        description:
          "Buat rombel paralel (SD/SMP/SMA), pantau progress modul ajar per kelas agar materi tidak tertinggal antar paralel.",
      },
      {
        icon: Users,
        title: "Data Siswa",
        description:
          "Master siswa terpusat dengan impor Excel, biodata rapor (NISN, orang tua, alamat), dan soft delete tanpa menghapus histori nilai.",
      },
      {
        icon: CalendarCheck,
        title: "Absensi",
        description:
          "Catat kehadiran harian (Hadir, Izin, Sakit, Alfa) per siswa. Data siap disinkronkan ke rekap kehadiran E-Rapor.",
      },
      {
        icon: Shuffle,
        title: "Alat Kelas",
        description:
          "Acak kelompok dan spinner undian nama siswa langsung dari data kelas — praktis untuk diskusi, presentasi, dan ice breaker.",
      },
    ],
  },
  {
    label: "Penilaian & Rapor",
    features: [
      {
        icon: BookOpen,
        title: "Tujuan Pembelajaran",
        description:
          "Definisikan TP per semester beserta indikator ketercapaian dan rubrik (angka/skala 4/kualitatif).",
      },
      {
        icon: ClipboardList,
        title: "Penilaian Terintegrasi",
        description:
          "Grid spreadsheet untuk Formatif, Sumatif STS & SAS, Remedial, dan Pengayaan. Analisis ketuntasan KKM otomatis plus export PDF rekap.",
      },
      {
        icon: FileText,
        title: "E-Rapor Kurikulum Merdeka",
        description:
          "Hitung Nilai Akhir (NA) dengan bobot formatif/STS/SAS, generate predikat BB–SB, deskripsi capaian otomatis, preview & cetak rapor A4.",
      },
    ],
  },
  {
    label: "Pengaturan & Keamanan",
    features: [
      {
        icon: Settings,
        title: "Pengaturan Sekolah",
        description:
          "Atur profil sekolah, logo header dokumen, tahun ajaran, KKM, bobot NA, dan tampilan skala rapor (angka dan/atau predikat).",
      },
      {
        icon: CreditCard,
        title: "Langganan",
        description:
          "Pilih paket 1 bulan, 3 bulan, atau 1 tahun. Order via WhatsApp — admin akan mengaktifkan akun Anda.",
      },
      {
        icon: Shield,
        title: "Data Aman per Guru",
        description:
          "Row Level Security Supabase — setiap guru hanya mengakses kelas, siswa, dan penilaian miliknya sendiri.",
      },
      {
        icon: WifiOff,
        title: "Siap Offline (PWA)",
        description:
          "Diinstall sebagai aplikasi di perangkat. Akses dasar tetap tersedia saat jaringan sekolah tidak stabil.",
      },
    ],
  },
];

const workflowSteps = [
  {
    step: "1",
    title: "Input sekali",
    text: "Buat kelas, impor siswa, dan definisikan TP beserta indikator untuk semester aktif.",
  },
  {
    step: "2",
    title: "Nilai di satu tempat",
    text: "Isi penilaian formatif & sumatif pada grid — nama siswa dan indikator sudah terhubung otomatis.",
  },
  {
    step: "3",
    title: "Banyak output sekaligus",
    text: "Rekap nilai, analisis remedial/pengayaan, absensi, dan rapor KM tersedia tanpa ketik ulang.",
  },
];

export function HomeFeaturesSection() {
  return (
    <div className="space-y-16">
      <section className="text-center">
        <Badge variant="secondary" className="mb-3">
          Fitur Lengkap
        </Badge>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          Semua yang guru butuhkan, dalam satu dashboard
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Alat Guru dirancang untuk guru Indonesia — dari administrasi kelas
          hingga rapor semester, dengan prinsip{" "}
          <span className="font-medium text-foreground">
            input sekali, dipakai di banyak fitur
          </span>
          .
        </p>
      </section>

      {featureGroups.map((group) => (
        <section key={group.label} className="space-y-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {group.label}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.features.map((feature) => (
              <Card key={feature.title} className="h-full">
                <CardHeader className="pb-2">
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="size-5" />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}

      <section className="rounded-xl border bg-muted/30 p-6 md:p-8">
        <div className="mb-6 text-center md:text-left">
          <Badge variant="outline" className="mb-2">
            Zero Redundancy
          </Badge>
          <h3 className="text-xl font-bold tracking-tight">
            Bagaimana alur kerjanya?
          </h3>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Data mengalir relasional dari hulu ke hilir — tidak perlu
            menyalin nama siswa atau indikator ke setiap lembar kerja.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {workflowSteps.map((item) => (
            <div
              key={item.step}
              className="rounded-lg border bg-background p-4 space-y-2"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {item.step}
              </div>
              <h4 className="font-medium">{item.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
