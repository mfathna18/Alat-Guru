"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateModulAjar,
  useDuplicateModulAjar,
} from "@/lib/hooks/use-modul-ajar";
import { modulScopeKey } from "@/lib/modul-ajar/scope";
import { formatSupabaseError } from "@/lib/supabase/errors";
import type { Kelas, MataPelajaran, ModulAjar } from "@/lib/types/database";

type Mode = "baru" | "duplikat";

interface TambahModulDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetKelas: Kelas;
  targetMapel: MataPelajaran;
  kelasList: Kelas[];
  modulByScope: Record<string, ModulAjar[]>;
}

export function TambahModulDialog({
  open,
  onOpenChange,
  targetKelas,
  targetMapel,
  kelasList,
  modulByScope,
}: TambahModulDialogProps) {
  const createModul = useCreateModulAjar();
  const duplicateModul = useDuplicateModulAjar();

  const [mode, setMode] = React.useState<Mode>("baru");
  const [judul, setJudul] = React.useState("");
  const [sourceKelasId, setSourceKelasId] = React.useState("");
  const [sourceModulId, setSourceModulId] = React.useState("");

  const otherKelas = kelasList.filter((k) => k.id !== targetKelas.id);
  const sourceModulList = sourceKelasId
    ? (modulByScope[
        modulScopeKey(Number(sourceKelasId), targetMapel.id)
      ] ?? [])
    : [];

  React.useEffect(() => {
    if (!open) {
      setMode("baru");
      setJudul("");
      setSourceKelasId("");
      setSourceModulId("");
    }
  }, [open]);

  React.useEffect(() => {
    setSourceModulId("");
  }, [sourceKelasId]);

  const busy = createModul.isPending || duplicateModul.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (mode === "baru") {
        if (!judul.trim()) return;
        await createModul.mutateAsync({
          kelasId: targetKelas.id,
          mapelId: targetMapel.id,
          judul,
        });
        toast.success("Modul ditambahkan");
      } else {
        if (!sourceModulId) return;
        await duplicateModul.mutateAsync({
          sourceModulId: Number(sourceModulId),
          targetKelasId: targetKelas.id,
          targetMapelId: targetMapel.id,
        });
        toast.success("Modul diduplikasi");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(formatSupabaseError(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              Tambah Modul — {targetKelas.nama_kelas} · {targetMapel.nama_mapel}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Pilihan</legend>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === "baru"}
                  onChange={() => setMode("baru")}
                />
                Buat modul baru
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === "duplikat"}
                  onChange={() => setMode("duplikat")}
                  disabled={otherKelas.length === 0}
                />
                Duplikat dari kelas lain (mapel sama)
              </label>
            </fieldset>

            {mode === "baru" ? (
              <div>
                <Label htmlFor="judul-modul">Judul modul</Label>
                <Input
                  id="judul-modul"
                  className="mt-1.5"
                  placeholder="Contoh: Bab 1 — Revolusi Industri"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="kelas-sumber">Kelas sumber</Label>
                  <select
                    id="kelas-sumber"
                    className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={sourceKelasId}
                    onChange={(e) => setSourceKelasId(e.target.value)}
                    required
                  >
                    <option value="">— Pilih kelas —</option>
                    {otherKelas.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama_kelas}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="modul-sumber">Modul</Label>
                  <select
                    id="modul-sumber"
                    className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={sourceModulId}
                    onChange={(e) => setSourceModulId(e.target.value)}
                    required
                    disabled={!sourceKelasId}
                  >
                    <option value="">— Pilih modul —</option>
                    {sourceModulList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.urutan}. {m.judul}
                      </option>
                    ))}
                  </select>
                  {sourceKelasId && sourceModulList.length === 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Kelas ini belum punya modul untuk {targetMapel.nama_mapel}.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
