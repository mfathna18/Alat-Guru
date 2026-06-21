"use client";

import * as React from "react";
import { Loader2, Plus, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateMataPelajaran,
  useDeleteMataPelajaran,
  useUpdateMataPelajaran,
} from "@/lib/hooks/use-mata-pelajaran";
import { sortMataPelajaranList } from "@/lib/services/mata-pelajaran";
import { formatSupabaseError } from "@/lib/supabase/errors";
import type { MataPelajaran } from "@/lib/types/database";

interface PenilaianMapelManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapelList: MataPelajaran[];
  selectedMapelId: number | null;
  onMapelCreated?: (mapelId: number) => void;
  onMapelDeleted?: (mapelId: number) => void;
}

export function PenilaianMapelManagerDialog({
  open,
  onOpenChange,
  mapelList,
  selectedMapelId,
  onMapelCreated,
  onMapelDeleted,
}: PenilaianMapelManagerDialogProps) {
  const createMapel = useCreateMataPelajaran();
  const updateMapel = useUpdateMataPelajaran();
  const deleteMapel = useDeleteMataPelajaran();

  const [newNama, setNewNama] = React.useState("");
  const [draftNames, setDraftNames] = React.useState<Record<number, string>>({});
  const [deleteTarget, setDeleteTarget] = React.useState<MataPelajaran | null>(
    null,
  );

  const sorted = React.useMemo(
    () => sortMataPelajaranList(mapelList.filter((m) => !m.is_group_header)),
    [mapelList],
  );

  React.useEffect(() => {
    if (!open) {
      setNewNama("");
      setDraftNames({});
      setDeleteTarget(null);
    }
  }, [open]);

  React.useEffect(() => {
    setDraftNames((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const m of sorted) {
        if (next[m.id] === undefined) {
          next[m.id] = m.nama_mapel;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [sorted]);

  async function handleAdd() {
    const nama = newNama.trim();
    if (!nama) {
      toast.error("Nama mata pelajaran wajib diisi.");
      return;
    }
    try {
      const created = await createMapel.mutateAsync({ nama_mapel: nama });
      toast.success(`Mapel "${created.nama_mapel}" ditambahkan.`);
      setNewNama("");
      onMapelCreated?.(created.id);
    } catch (err) {
      toast.error(formatSupabaseError(err));
    }
  }

  async function handleSaveName(mapel: MataPelajaran) {
    const draft = (draftNames[mapel.id] ?? mapel.nama_mapel).trim();
    if (!draft) {
      toast.error("Nama mata pelajaran wajib diisi.");
      setDraftNames((prev) => ({ ...prev, [mapel.id]: mapel.nama_mapel }));
      return;
    }
    if (draft === mapel.nama_mapel) return;

    try {
      await updateMapel.mutateAsync({
        mapelId: mapel.id,
        patch: { nama_mapel: draft },
      });
      toast.success("Nama mapel diperbarui.");
    } catch (err) {
      toast.error(formatSupabaseError(err));
      setDraftNames((prev) => ({ ...prev, [mapel.id]: mapel.nama_mapel }));
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMapel.mutateAsync(deleteTarget.id);
      toast.success(`Mapel "${deleteTarget.nama_mapel}" dihapus.`);
      onMapelDeleted?.(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(formatSupabaseError(err));
    }
  }

  const busy =
    createMapel.isPending || updateMapel.isPending || deleteMapel.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[85vh] w-full flex-col gap-4 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="size-4" />
              Kelola Mata Pelajaran
            </DialogTitle>
            <DialogDescription>
              Tambah, ubah nama, atau hapus mata pelajaran untuk penilaian dan
              rapor. Perubahan langsung tersimpan ke akun Anda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="mapel-baru">Tambah mapel baru</Label>
            <div className="flex gap-2">
              <Input
                id="mapel-baru"
                value={newNama}
                placeholder="Contoh: Matematika"
                disabled={busy}
                onChange={(e) => setNewNama(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleAdd();
                }}
              />
              <Button
                type="button"
                className="shrink-0"
                disabled={busy || !newNama.trim()}
                onClick={() => void handleAdd()}
              >
                {createMapel.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                <span className="sr-only sm:not-sr-only sm:ml-2">Tambah</span>
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border">
            {sorted.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                Belum ada mata pelajaran. Tambahkan mapel pertama di atas.
              </p>
            ) : (
              <ul className="divide-y">
                {sorted.map((m) => {
                  const isSelected = m.id === selectedMapelId;
                  const draft = draftNames[m.id] ?? m.nama_mapel;
                  const isDirty = draft.trim() !== m.nama_mapel;

                  return (
                    <li
                      key={m.id}
                      className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <Input
                          value={draft}
                          disabled={busy}
                          aria-label={`Nama ${m.nama_mapel}`}
                          onChange={(e) =>
                            setDraftNames((prev) => ({
                              ...prev,
                              [m.id]: e.target.value,
                            }))
                          }
                          onBlur={() => {
                            if (isDirty) void handleSaveName(m);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.currentTarget.blur();
                            }
                          }}
                        />
                        <p className="text-[11px] text-muted-foreground">
                          {m.is_default && "Mapel utama · "}
                          {isSelected && "Sedang dipilih · "}
                          Tekan Enter atau klik di luar untuk simpan nama
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {isDirty && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={busy}
                            onClick={() => void handleSaveName(m)}
                          >
                            Simpan
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="size-9 text-destructive hover:text-destructive"
                          disabled={busy || sorted.length <= 1}
                          aria-label={`Hapus ${m.nama_mapel}`}
                          onClick={() => setDeleteTarget(m)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {sorted.length <= 1 && sorted.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Mapel terakhir tidak dapat dihapus.
            </p>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus mata pelajaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Mapel &quot;{deleteTarget?.nama_mapel}&quot; akan dihapus dari
              penilaian, E-Rapor, dan cetak. Data nilai rapor mapel terkait juga
              dihapus. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMapel.isPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMapel.isPending}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {deleteMapel.isPending ? "Menghapus…" : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
