"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  BarChart3,
  Settings,
  Shield,
  Shuffle,
  Users,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { SHOW_SUBSCRIPTION_UI } from "@/lib/billing/subscription-ui";

const navItems = [
  {
    title: "Beranda",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Ringkasan kelas, siswa, dan profil sekolah",
  },
  {
    title: "Kelas",
    href: "/kelas",
    icon: GraduationCap,
    description: "Buat dan kelola rombel per mata pelajaran",
  },
  {
    title: "Siswa",
    href: "/siswa",
    icon: Users,
    description: "Catat dan impor data siswa per kelas",
  },
  {
    title: "Absensi",
    href: "/absensi",
    icon: CalendarCheck,
    description: "Isi kehadiran harian dan unduh rekap",
  },
  {
    title: "Alat Kelas",
    href: "/alat-kelas",
    icon: Shuffle,
    description: "Acak kelompok dan undi nama siswa",
  },
  {
    title: "Tujuan Pembelajaran",
    href: "/tp",
    icon: BookOpen,
    description: "Susun TP, indikator, dan rubrik penilaian",
  },
  {
    title: "Penilaian",
    href: "/nilai",
    icon: ClipboardList,
    description: "Input nilai formatif dan sumatif",
  },
  {
    title: "Sikap & Sosial",
    href: "/sikap-rapor",
    icon: HeartHandshake,
    description: "Catat sikap, ekskul, dan catatan wali kelas",
  },
  {
    title: "E-Rapor",
    href: "/e-rapor",
    icon: FileText,
    description: "Preview dan cetak rapor semester",
  },
  {
    title: "Langganan",
    href: "/billing",
    icon: CreditCard,
    description: "Cek paket dan perpanjang langganan",
  },
  {
    title: "Pengaturan",
    href: "/pengaturan",
    icon: Settings,
    description: "Profil sekolah, logo, dan tanda tangan",
  },
];

const adminNavItems = [
  {
    title: "Dashboard Admin",
    href: "/admin",
    icon: Shield,
    description: "Statistik pengguna dan langganan",
  },
  {
    title: "Pengguna",
    href: "/admin/users",
    icon: Users,
    description: "Kelola akun, role, dan paket langganan",
  },
  {
    title: "Statistik Fitur",
    href: "/admin/feature-stats",
    icon: BarChart3,
    description: "Fitur dan menu paling sering dipakai",
  },
  {
    title: "Riwayat Admin",
    href: "/admin/logs",
    icon: ClipboardList,
    description: "Catatan aktivitas admin",
  },
];

interface AppSidebarProps {
  isAdmin?: boolean;
}

export function AppSidebar({ isAdmin = false }: AppSidebarProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const visibleNavItems = SHOW_SUBSCRIPTION_UI
    ? navItems
    : navItems.filter((item) => item.href !== "/billing");

  React.useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [pathname, isMobile, setOpenMobile]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/alat-guru-logo.png"
            alt="Alat Guru"
            width={36}
            height={36}
            className="size-9 shrink-0 rounded-lg object-contain"
            priority
          />
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold">Alat Guru</span>
            <span className="truncate text-xs text-muted-foreground">
              Dashboard
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      tooltip={`${item.title} — ${item.description}`}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin ? (
          <SidebarGroup>
            <SidebarGroupLabel>Administrasi</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(`${item.href}/`) ||
                        pathname === item.href);

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={isActive}
                        tooltip={`${item.title} — ${item.description}`}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4 group-data-[collapsible=icon]:hidden">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Input data siswa sekali, dipakai di absensi, penilaian, dan rapor.
        </p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
