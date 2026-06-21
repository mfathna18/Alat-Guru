"use client";

import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import type { Kelas, MataPelajaran } from "@/lib/types/database";

export interface TpContextFilters {
  kelasId: number | null;
  semester: 1 | 2;
  mapelId: number | null;
}

interface TpContextFilterBarProps {
  filters: TpContextFilters;
  kelasList: Kelas[];
  mapelList: MataPelajaran[];
  onChange: (patch: Partial<TpContextFilters>) => void;
  isMobile?: boolean;
  onOpenMobile?: () => void;
}

export function TpContextFilterBar({
  filters,
  kelasList,
  mapelList,
  onChange,
  isMobile,
  onOpenMobile,
}: TpContextFilterBarProps) {
  const selectedKelas = kelasList.find((k) => k.id === filters.kelasId);
  const scorableMapel = mapelList.filter((m) => !m.is_group_header);
  const selectedMapel = scorableMapel.find((m) => m.id === filters.mapelId);
  const mapelOptions = scorableMapel.map((m) => ({
    value: String(m.id),
    label: m.nama_mapel,
  }));

  if (isMobile) {
    return (
      <Button
        type="button"
        variant="outline"
        className="min-h-11 w-full justify-between gap-2"
        onClick={onOpenMobile}
      >
        <span className="flex items-center gap-2 truncate text-sm">
          <SlidersHorizontal className="size-4 shrink-0" />
          {selectedKelas?.nama_kelas ?? "Pilih kelas"} ·{" "}
          {selectedMapel?.nama_mapel ?? "Mapel"} · Semester {filters.semester}
        </span>
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
      <span className="text-xs font-medium text-muted-foreground">Konteks</span>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Kelas</span>
        {kelasList.length === 0 ? (
          <span className="text-xs text-muted-foreground">Belum ada kelas</span>
        ) : (
          kelasList.map((k) => (
            <Button
              key={k.id}
              type="button"
              size="sm"
              variant={filters.kelasId === k.id ? "default" : "outline"}
              className="h-8"
              onClick={() => onChange({ kelasId: k.id })}
            >
              {k.nama_kelas}
            </Button>
          ))
        )}
      </div>

      <div className="mx-1 hidden h-5 w-px bg-border sm:block" />

      <FilterDropdown
        label="Mapel"
        value={filters.mapelId != null ? String(filters.mapelId) : null}
        options={mapelOptions}
        onChange={(v) => onChange({ mapelId: Number(v) })}
        placeholder="Pilih mapel"
        emptyMessage="Atur mapel di Pengaturan"
        className="w-full min-w-[180px] max-w-xs"
        triggerClassName="h-8"
      />

      <div className="mx-1 hidden h-5 w-px bg-border sm:block" />

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Semester</span>
        {([1, 2] as const).map((s) => (
          <Button
            key={s}
            type="button"
            size="sm"
            variant={filters.semester === s ? "default" : "outline"}
            className="h-8 min-w-10"
            onClick={() => onChange({ semester: s })}
          >
            {s}
          </Button>
        ))}
      </div>
    </div>
  );
}

export { skalaLabel } from "@/lib/nilai/skala-label";
