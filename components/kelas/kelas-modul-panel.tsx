"use client";

import * as React from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { TambahModulDialog } from "@/components/kelas/tambah-modul-dialog";
import { Button } from "@/components/ui/button";
import {
  countSelesai,
  modulTerakhirSelesai,
  progressKey,
} from "@/lib/modul-ajar/progress";
import {
  useDeleteModulAjar,
  useUpsertModulProgress,
} from "@/lib/hooks/use-modul-ajar";
import { formatSupabaseError } from "@/lib/supabase/errors";
import type { Kelas, MataPelajaran, ModulAjar } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface KelasModulPanelProps {
  kelas: Kelas;
  mapel: MataPelajaran;
  kelasList: Kelas[];
  modulList: ModulAjar[];
  modulByScope: Record<string, ModulAjar[]>;
  progressMap: Record<string, boolean>;
}

export function KelasModulPanel({
  kelas,
  mapel,
  kelasList,
  modulList,
  modulByScope,
  progressMap,
}: KelasModulPanelProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const upsert = useUpsertModulProgress();
  const deleteModul = useDeleteModulAjar();

  const selesai = countSelesai(modulList, progressMap, kelas.id);
  const total = modulList.length;
  const terakhir = modulTerakhirSelesai(modulList, progressMap, kelas.id);
  const busy = upsert.isPending || deleteModul.isPending;

  async function toggleModul(modul: ModulAjar) {
    const key = progressKey(kelas.id, modul.id);
    const current = progressMap[key] ?? false;
    await upsert.mutateAsync({
      kelasId: kelas.id,
      modulId: modul.id,
      selesai: !current,
    });
  }

  async function handleDelete(modul: ModulAjar) {
    try {
      await deleteModul.mutateAsync(modul.id);
      toast.success("Modul dihapus");
    } catch (err) {
      toast.error(formatSupabaseError(err));
    }
  }

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium">
            Modul — {kelas.nama_kelas} · {mapel.nama_mapel}
          </h2>
          {total > 0 && (
            <p className="text-xs text-muted-foreground">
              {selesai}/{total} selesai
              {terakhir && (
                <>
                  {" "}
                  · terakhir: {terakhir.urutan}. {terakhir.judul}
                </>
              )}
            </p>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 shrink-0"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="mr-1 size-3.5" />
          Tambah Modul
        </Button>
      </div>

      {modulList.length === 0 ? (
        <div className="rounded-md border border-dashed px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Belum ada modul untuk {mapel.nama_mapel} di kelas ini.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="mr-1 size-3.5" />
            Tambah Modul
          </Button>
        </div>
      ) : (
        <ul className="space-y-1">
          {modulList.map((m) => {
            const done = progressMap[progressKey(kelas.id, m.id)] ?? false;
            return (
              <li
                key={m.id}
                className="flex items-center gap-1 rounded-md border px-2 py-1"
              >
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void toggleModul(m)}
                  className={cn(
                    "flex min-h-8 flex-1 items-center gap-2 text-left text-sm",
                    busy && "opacity-60",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded border",
                      done
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40",
                    )}
                  >
                    {done && <Check className="size-2.5" />}
                  </span>
                  <span className="truncate">
                    <span className="text-muted-foreground">{m.urutan}. </span>
                    {m.judul}
                  </span>
                </button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="size-7 shrink-0 text-destructive"
                  disabled={busy}
                  onClick={() => void handleDelete(m)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <TambahModulDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        targetKelas={kelas}
        targetMapel={mapel}
        kelasList={kelasList}
        modulByScope={modulByScope}
      />
    </div>
  );
}
