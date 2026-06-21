"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { JENIS_ASESMEN_OPTIONS } from "@/lib/nilai/jenis-asesmen";
import type { Kelas, MataPelajaran } from "@/lib/types/database";

import type { PenilaianFilters } from "./penilaian-filter-bar";

interface PenilaianFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: PenilaianFilters;
  kelasList: Kelas[];
  mapelList: MataPelajaran[];
  onChange: (patch: Partial<PenilaianFilters>) => void;
}

function FilterOption({
  active,
  label,
  description,
  onClick,
}: {
  active: boolean;
  label: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-11 w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-colors active:scale-[0.99]",
        active
          ? "border-primary bg-primary/5"
          : "border-border bg-background hover:bg-muted/50",
      )}
    >
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {description && (
          <span className="block text-xs text-muted-foreground">
            {description}
          </span>
        )}
      </span>
      {active && (
        <span className="size-2.5 shrink-0 rounded-full bg-primary" />
      )}
    </button>
  );
}

export function PenilaianFilterSheet({
  open,
  onOpenChange,
  filters,
  kelasList,
  mapelList,
  onChange,
}: PenilaianFilterSheetProps) {
  function apply(patch: Partial<PenilaianFilters>) {
    onChange(patch);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl px-4 pb-8">
        <SheetHeader className="text-left">
          <SheetTitle>Filter Penilaian</SheetTitle>
          <SheetDescription>
            Pilih kelas, mata pelajaran, semester, dan jenis asesmen.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-6 overflow-y-auto">
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Kelas
            </h3>
            <div className="space-y-2">
              {kelasList.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada kelas. Buat kelas terlebih dahulu.
                </p>
              ) : (
                kelasList.map((k) => (
                  <FilterOption
                    key={k.id}
                    active={filters.kelasId === k.id}
                    label={k.nama_kelas}
                    onClick={() => {
                      apply({ kelasId: k.id });
                      onOpenChange(false);
                    }}
                  />
                ))
              )}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Mata Pelajaran
            </h3>
            <div className="space-y-2">
              {mapelList.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada mapel. Gunakan tombol Kelola di filter desktop
                  untuk menambahkan mata pelajaran.
                </p>
              ) : (
                mapelList.map((m) => (
                  <FilterOption
                    key={m.id}
                    active={filters.mapelId === m.id}
                    label={
                      m.is_group_header
                        ? `${m.nama_mapel} (grup)`
                        : `${m.nama_mapel}${m.is_default ? " ★" : ""}`
                    }
                    description={
                      m.is_group_header
                        ? "Pilih sub-mapel di bawah grup ini"
                        : undefined
                    }
                    onClick={() => {
                      if (m.is_group_header) return;
                      apply({ mapelId: m.id });
                      onOpenChange(false);
                    }}
                  />
                ))
              )}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Semester
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {([1, 2] as const).map((s) => (
                <FilterOption
                  key={s}
                  active={filters.semester === s}
                  label={`Semester ${s}`}
                  onClick={() => {
                    apply({ semester: s });
                    onOpenChange(false);
                  }}
                />
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Jenis Asesmen
            </h3>
            <div className="space-y-2">
              {JENIS_ASESMEN_OPTIONS.map((opt) => (
                <FilterOption
                  key={opt.value}
                  active={filters.jenisAsesmen === opt.value}
                  label={opt.label}
                  description={opt.description}
                  onClick={() => {
                    apply({ jenisAsesmen: opt.value });
                    onOpenChange(false);
                  }}
                />
              ))}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
