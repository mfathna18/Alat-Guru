import type { StatusAbsensi } from "@/lib/types/database";

export const STATUS_OPTIONS: {
  value: StatusAbsensi;
  label: string;
  short: string;
}[] = [
  { value: "H", label: "Hadir", short: "H" },
  { value: "I", label: "Izin", short: "I" },
  { value: "S", label: "Sakit", short: "S" },
  { value: "A", label: "Alpa", short: "A" },
];

export const STATUS_REQUIRES_KETERANGAN: StatusAbsensi[] = ["I", "S"];

export const STATUS_STYLE: Record<
  StatusAbsensi,
  { badge: string; dot: string; label: string }
> = {
  H: {
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
    dot: "bg-emerald-500",
    label: "Hadir",
  },
  I: {
    badge: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
    dot: "bg-amber-500",
    label: "Izin",
  },
  S: {
    badge: "bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-200",
    dot: "bg-sky-500",
    label: "Sakit",
  },
  A: {
    badge: "bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-200",
    dot: "bg-rose-500",
    label: "Alpa",
  },
};

export function requiresKeterangan(status: StatusAbsensi) {
  return STATUS_REQUIRES_KETERANGAN.includes(status);
}
