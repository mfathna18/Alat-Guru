"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Kelas, MataPelajaran } from "@/lib/types/database";

import type { TpContextFilters } from "./tp-context-filter";

interface TpContextFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: TpContextFilters;
  kelasList: Kelas[];
  mapelList: MataPelajaran[];
  onChange: (patch: Partial<TpContextFilters>) => void;
}

function Option({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-11 w-full items-center justify-between rounded-xl border-2 px-4 text-left text-sm font-semibold",
        active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
      )}
    >
      {label}
      {active && <span className="size-2.5 rounded-full bg-primary" />}
    </button>
  );
}

export function TpContextFilterSheet({
  open,
  onOpenChange,
  filters,
  kelasList,
  mapelList,
  onChange,
}: TpContextFilterSheetProps) {
  const scorableMapel = mapelList.filter((m) => !m.is_group_header);

  function apply(patch: Partial<TpContextFilters>) {
    onChange(patch);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl px-4 pb-8">
        <SheetHeader className="text-left">
          <SheetTitle>Filter TP</SheetTitle>
          <SheetDescription>Kelas, mata pelajaran, dan semester.</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-6 overflow-y-auto">
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Kelas
            </h3>
            <div className="space-y-2">
              {kelasList.map((k) => (
                <Option
                  key={k.id}
                  active={filters.kelasId === k.id}
                  label={k.nama_kelas}
                  onClick={() => apply({ kelasId: k.id })}
                />
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Mata Pelajaran
            </h3>
            <div className="space-y-2">
              {scorableMapel.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada mapel. Tambahkan di Pengaturan Sekolah.
                </p>
              ) : (
                scorableMapel.map((m) => (
                  <Option
                    key={m.id}
                    active={filters.mapelId === m.id}
                    label={m.nama_mapel}
                    onClick={() => apply({ mapelId: m.id })}
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
                <Option
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
