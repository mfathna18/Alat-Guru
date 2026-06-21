"use client";

import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { JENIS_ASESMEN_OPTIONS } from "@/lib/nilai/jenis-asesmen";
import { SUMATIF_TIPE_OPTIONS } from "@/lib/nilai/sumatif-tipe";
import { semesterLabel } from "@/lib/rapor/semester-labels";
import type {
  JenisAsesmen,
  Kelas,
  MataPelajaran,
  TipeSumatif,
} from "@/lib/types/database";

export interface PenilaianFilters {
  kelasId: number | null;
  mapelId: number | null;
  semester: 1 | 2;
  jenisAsesmen: JenisAsesmen;
  /** Hanya dipakai saat jenisAsesmen = SUMATIF */
  sumatifTipe: TipeSumatif;
}

interface PenilaianFilterBarProps {
  filters: PenilaianFilters;
  kelasList: Kelas[];
  mapelList: MataPelajaran[];
  loadingMapel?: boolean;
  mapelError?: Error | null;
  onChange: (patch: Partial<PenilaianFilters>) => void;
  onManageMapel?: () => void;
}

export function PenilaianFilterBar({
  filters,
  kelasList,
  mapelList,
  loadingMapel,
  mapelError,
  onChange,
  onManageMapel,
}: PenilaianFilterBarProps) {
  const kelasOptions = kelasList.map((k) => ({
    value: String(k.id),
    label: k.nama_kelas,
  }));

  const mapelOptions = mapelList.map((m) => ({
    value: String(m.id),
    label: `${m.nama_mapel}${m.is_default ? " ★" : ""}${m.is_group_header ? " (grup)" : ""}`,
    disabled: Boolean(m.is_group_header),
  }));

  const semesterOptions = ([1, 2] as const).map((s) => ({
    value: String(s),
    label: `Semester ${semesterLabel(s)}`,
  }));

  const asesmenOptions = JENIS_ASESMEN_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  const showSumatifFilters = filters.jenisAsesmen === "SUMATIF";

  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FilterDropdown
          label="Kelas"
          value={filters.kelasId != null ? String(filters.kelasId) : null}
          options={kelasOptions}
          onChange={(v) => onChange({ kelasId: Number(v) })}
          placeholder="Pilih kelas"
          emptyMessage="Belum ada kelas"
        />

        <FilterDropdown
          label="Semester"
          value={String(filters.semester)}
          options={semesterOptions}
          onChange={(v) => onChange({ semester: Number(v) as 1 | 2 })}
        />

        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <FilterDropdown
              label="Mapel"
              value={filters.mapelId != null ? String(filters.mapelId) : null}
              options={mapelOptions}
              onChange={(v) => onChange({ mapelId: Number(v) })}
              placeholder="Pilih mapel"
              loading={loadingMapel}
              emptyMessage="Belum ada mapel"
            />
          </div>
          {onManageMapel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mb-0.5 h-9 shrink-0 px-2"
              onClick={onManageMapel}
              title="Kelola mata pelajaran"
            >
              <Settings2 className="size-4" />
              <span className="sr-only sm:not-sr-only sm:ml-1.5">Kelola</span>
            </Button>
          )}
        </div>

        <FilterDropdown
          label="Asesmen"
          value={filters.jenisAsesmen}
          options={asesmenOptions}
          onChange={(v) => {
            const jenis = v as JenisAsesmen;
            onChange({
              jenisAsesmen: jenis,
              sumatifTipe: jenis === "SUMATIF" ? filters.sumatifTipe : "SAS",
            });
          }}
        />
      </div>

      {showSumatifFilters && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-md">
          <FilterDropdown
            label="Tipe Sumatif"
            value={filters.sumatifTipe}
            options={SUMATIF_TIPE_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            onChange={(v) => onChange({ sumatifTipe: v as TipeSumatif })}
          />
        </div>
      )}

      {mapelError && (
        <p className="mt-2 text-xs text-destructive">{mapelError.message}</p>
      )}
    </div>
  );
}
