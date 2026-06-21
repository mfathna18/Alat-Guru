"use client";

import {
  countSelesai,
  modulTerakhirSelesai,
} from "@/lib/modul-ajar/progress";
import { modulScopeKey } from "@/lib/modul-ajar/scope";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Kelas, ModulAjar } from "@/lib/types/database";

interface ParallelProgressOverviewProps {
  kelasList: Kelas[];
  mapelId: number;
  modulByScope: Record<string, ModulAjar[]>;
  progressMap: Record<string, boolean>;
}

export function ParallelProgressOverview({
  kelasList,
  mapelId,
  modulByScope,
  progressMap,
}: ParallelProgressOverviewProps) {
  const withModul = kelasList.filter(
    (k) => (modulByScope[modulScopeKey(k.id, mapelId)]?.length ?? 0) > 0,
  );
  if (withModul.length < 2) return null;

  const sorted = [...withModul].sort((a, b) =>
    a.nama_kelas.localeCompare(b.nama_kelas, "id"),
  );

  const counts = sorted.map((k) => {
    const list = modulByScope[modulScopeKey(k.id, mapelId)] ?? [];
    return countSelesai(list, progressMap, k.id);
  });
  const minSelesai = Math.min(...counts);
  const maxSelesai = Math.max(...counts);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Perbandingan Kelas Paralel</CardTitle>
        <CardDescription>
          Ringkasan progress modul per kelas
          {minSelesai !== maxSelesai && (
            <> · Selisih {maxSelesai - minSelesai} modul selesai</>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {sorted.map((k) => {
            const list = modulByScope[modulScopeKey(k.id, mapelId)] ?? [];
            const selesai = countSelesai(list, progressMap, k.id);
            const terakhir = modulTerakhirSelesai(list, progressMap, k.id);
            return (
              <li
                key={k.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b pb-2 last:border-0"
              >
                <span className="font-medium">{k.nama_kelas}</span>
                <span className="text-xs text-muted-foreground">
                  {selesai}/{list.length} selesai
                  {terakhir && (
                    <>
                      {" "}
                      · M{terakhir.urutan} {terakhir.judul}
                    </>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
