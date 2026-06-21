import type { ModulAjar } from "@/lib/types/database";

export function progressKey(kelasId: number, modulId: number) {
  return `${kelasId}-${modulId}`;
}

export function countSelesai(
  modulList: ModulAjar[],
  progressMap: Record<string, boolean>,
  kelasId: number,
): number {
  return modulList.filter((m) => progressMap[progressKey(kelasId, m.id)]).length;
}

export function modulTerakhirSelesai(
  modulList: ModulAjar[],
  progressMap: Record<string, boolean>,
  kelasId: number,
): ModulAjar | null {
  let last: ModulAjar | null = null;
  for (const m of modulList) {
    if (progressMap[progressKey(kelasId, m.id)]) last = m;
  }
  return last;
}

export function persenProgress(
  modulList: ModulAjar[],
  progressMap: Record<string, boolean>,
  kelasId: number,
): number {
  if (modulList.length === 0) return 0;
  return Math.round(
    (countSelesai(modulList, progressMap, kelasId) / modulList.length) * 100,
  );
}
