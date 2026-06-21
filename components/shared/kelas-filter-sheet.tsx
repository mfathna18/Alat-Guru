"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Kelas } from "@/lib/types/database";

interface KelasFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kelasId: number | null;
  kelasList: Kelas[];
  onChange: (kelasId: number) => void;
  title?: string;
}

export function KelasFilterSheet({
  open,
  onOpenChange,
  kelasId,
  kelasList,
  onChange,
  title = "Pilih Kelas",
}: KelasFilterSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[70vh] rounded-t-2xl px-4 pb-8">
        <SheetHeader className="text-left">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Pilih rombel yang ingin dikelola.</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-2 overflow-y-auto">
          {kelasList.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada kelas. Buat kelas terlebih dahulu.
            </p>
          ) : (
            kelasList.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => {
                  onChange(k.id);
                  onOpenChange(false);
                }}
                className={cn(
                  "flex min-h-11 w-full items-center justify-between rounded-xl border-2 px-4 text-left text-sm font-semibold transition-colors",
                  kelasId === k.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50",
                )}
              >
                {k.nama_kelas}
                {kelasId === k.id && (
                  <span className="size-2.5 rounded-full bg-primary" />
                )}
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
