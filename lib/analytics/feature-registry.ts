export interface TrackableFeature {
  id: string;
  menu: string;
  path: string;
  category: string;
  fill: string;
}

/** Daftar menu/fitur yang dicatat saat guru navigasi. */
export const TRACKABLE_FEATURES: TrackableFeature[] = [
  {
    id: "dashboard",
    menu: "Beranda",
    path: "/dashboard",
    category: "Umum",
    fill: "var(--chart-1)",
  },
  {
    id: "kelas",
    menu: "Kelas",
    path: "/kelas",
    category: "Manajemen Kelas",
    fill: "var(--chart-2)",
  },
  {
    id: "siswa",
    menu: "Data Siswa",
    path: "/siswa",
    category: "Manajemen Kelas",
    fill: "var(--chart-3)",
  },
  {
    id: "absensi",
    menu: "Absensi",
    path: "/absensi",
    category: "Manajemen Kelas",
    fill: "var(--chart-4)",
  },
  {
    id: "alat-kelas",
    menu: "Alat Kelas",
    path: "/alat-kelas",
    category: "Manajemen Kelas",
    fill: "var(--chart-5)",
  },
  {
    id: "tp",
    menu: "Tujuan Pembelajaran",
    path: "/tp",
    category: "Penilaian & Rapor",
    fill: "hsl(var(--primary))",
  },
  {
    id: "nilai",
    menu: "Penilaian",
    path: "/nilai",
    category: "Penilaian & Rapor",
    fill: "var(--chart-1)",
  },
  {
    id: "sikap-rapor",
    menu: "Sikap & Sosial",
    path: "/sikap-rapor",
    category: "Penilaian & Rapor",
    fill: "var(--chart-2)",
  },
  {
    id: "e-rapor",
    menu: "E-Rapor",
    path: "/e-rapor",
    category: "Penilaian & Rapor",
    fill: "var(--chart-3)",
  },
  {
    id: "billing",
    menu: "Langganan",
    path: "/billing",
    category: "Akun",
    fill: "var(--chart-4)",
  },
  {
    id: "pengaturan",
    menu: "Pengaturan",
    path: "/pengaturan",
    category: "Pengaturan",
    fill: "var(--chart-5)",
  },
  {
    id: "profil",
    menu: "Profil Guru",
    path: "/profil",
    category: "Akun",
    fill: "hsl(var(--muted-foreground))",
  },
  {
    id: "admin",
    menu: "Dashboard Admin",
    path: "/admin",
    category: "Administrasi",
    fill: "hsl(var(--primary) / 0.8)",
  },
  {
    id: "admin-users",
    menu: "Pengguna",
    path: "/admin/users",
    category: "Administrasi",
    fill: "hsl(var(--primary) / 0.65)",
  },
  {
    id: "admin-feature-stats",
    menu: "Statistik Fitur",
    path: "/admin/feature-stats",
    category: "Administrasi",
    fill: "hsl(var(--primary) / 0.5)",
  },
  {
    id: "admin-logs",
    menu: "Riwayat Admin",
    path: "/admin/logs",
    category: "Administrasi",
    fill: "hsl(var(--primary) / 0.35)",
  },
];

const PREFIX_MATCHABLE = [...TRACKABLE_FEATURES]
  .filter((feature) => feature.path !== "/dashboard")
  .sort((a, b) => b.path.length - a.path.length);

/**
 * Cocokkan pathname ke definisi fitur (exact atau prefix untuk sub-rute).
 */
export function resolveFeatureFromPath(pathname: string): TrackableFeature | null {
  const normalized = pathname.split("?")[0]?.split("#")[0]?.trim() ?? "";
  if (!normalized.startsWith("/")) return null;

  const exact = TRACKABLE_FEATURES.find((feature) => feature.path === normalized);
  if (exact) return exact;

  return (
    PREFIX_MATCHABLE.find(
      (feature) =>
        normalized === feature.path ||
        normalized.startsWith(`${feature.path}/`),
    ) ?? null
  );
}
