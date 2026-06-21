"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Users,
} from "lucide-react";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const quickItems = [
  { title: "Beranda", href: "/dashboard", icon: LayoutDashboard },
  { title: "Kelas", href: "/kelas", icon: GraduationCap },
  { title: "Siswa", href: "/siswa", icon: Users },
  { title: "Nilai", href: "/nilai", icon: ClipboardList },
];

export function BottomNav() {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-backdrop-filter:bg-background/80 md:hidden"
      aria-label="Navigasi utama"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1">
        {quickItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="size-5 shrink-0" aria-hidden />
                <span className="truncate">{item.title}</span>
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex min-h-11 w-full min-w-11 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Buka menu lengkap"
          >
            <Menu className="size-5 shrink-0" aria-hidden />
            <span className="truncate">Menu</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
