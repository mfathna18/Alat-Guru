"use client";

import { SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Kelas } from "@/lib/types/database";

interface KelasFilterBarProps {
  kelasId: number | null;
  kelasList: Kelas[];
  onChange: (kelasId: number) => void;
  isMobile?: boolean;
  onOpenMobile?: () => void;
  label?: string;
}

export function KelasFilterBar({
  kelasId,
  kelasList,
  onChange,
  isMobile,
  onOpenMobile,
  label = "Kelas",
}: KelasFilterBarProps) {
  const selected = kelasList.find((k) => k.id === kelasId);

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
          {selected?.nama_kelas ?? `Pilih ${label.toLowerCase()}`}
        </span>
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {kelasList.length === 0 ? (
        <Badge variant="outline">Belum ada kelas</Badge>
      ) : (
        kelasList.map((k) => (
          <Button
            key={k.id}
            type="button"
            size="sm"
            variant={kelasId === k.id ? "default" : "outline"}
            className="h-8"
            onClick={() => onChange(k.id)}
          >
            {k.nama_kelas}
          </Button>
        ))
      )}
    </div>
  );
}
