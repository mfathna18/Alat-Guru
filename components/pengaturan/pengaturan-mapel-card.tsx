"use client";

import * as React from "react";
import { BookOpen, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateMataPelajaran,
  useDeleteMataPelajaran,
  useSeedJenjangMapel,
  useUpdateMataPelajaran,
} from "@/lib/hooks/use-mata-pelajaran";
import { useMataPelajaranList } from "@/lib/hooks/use-e-rapor";
import {
  JENJANG_MAPEL_SEED,
  JENJANG_SEKOLAH_LABEL,
} from "@/lib/mapel/jenjang-mapel-seed";
import { sortMataPelajaranList } from "@/lib/services/mata-pelajaran";
import { formatSupabaseError } from "@/lib/supabase/errors";
import type { JenjangSekolah, MataPelajaran } from "@/lib/types/database";

const EMPTY_MAPEL_LIST: MataPelajaran[] = [];

interface PengaturanMapelCardProps {
  jenjang: JenjangSekolah | "";
}

export function PengaturanMapelCard({ jenjang }: PengaturanMapelCardProps) {
  const { data: mapelList = EMPTY_MAPEL_LIST, isLoading } = useMataPelajaranList();
  const seedJenjang = useSeedJenjangMapel();
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

  const busy =
    seedJenjang.isPending ||
    createMapel.isPending ||
    updateMapel.isPending ||
    deleteMapel.isPending;

  async function handleSeed() {
    if (!jenjang) {
      toast.error("Pilih jenjang sekolah terlebih dahulu.");
      return;
    }
    try {
      const count = await seedJenjang.mutateAsync(jenjang);
      if (count === 0) {
        toast.info("Semua mapel default jenjang ini sudah ada.");
      } else {
        toast.success(`${count} mapel ditambahkan dari daftar default ${jenjang}.`);
      }
    } catch (err) {
      toast.error(formatSupabaseError(err));
    }
  }

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
      setDeleteTarget(null);
    } catch (err) {
      toast.error(formatSupabaseError(err));
    }
  }

  const seedPreview =
    jenjang && JENJANG_MAPEL_SEED[jenjang]
      ? JENJANG_MAPEL_SEED[jenjang].length
      : 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-4" />
            Mata Pelajaran
          </CardTitle>
          <CardDescription>
            Muat daftar mapel sesuai jenjang, lalu sesuaikan bebas — tambah,
            ubah nama, atau hapus kapan saja.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {jenjang
                ? `Default ${JENJANG_SEKOLAH_LABEL[jenjang]}: ${seedPreview} mapel inti.`
                : "Pilih jenjang sekolah di atas untuk memuat mapel default."}
            </p>
            <Button
              type="button"
              variant="outline"
              className="min-h-9 shrink-0"
              disabled={!jenjang || busy}
              onClick={() => void handleSeed()}
            >
              {seedJenjang.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 size-4" />
              )}
              Muat Mapel Default Jenjang
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mapel-baru-pengaturan">Tambah mapel</Label>
            <div className="flex gap-2">
              <Input
                id="mapel-baru-pengaturan"
                className="min-h-11"
                value={newNama}
                placeholder="Contoh: Prakarya"
                disabled={busy}
                onChange={(e) => setNewNama(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleAdd();
                  }
                }}
              />
              <Button
                type="button"
                className="min-h-11 shrink-0"
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

          <div className="overflow-hidden rounded-lg border">
            {isLoading ? (
              <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Memuat mapel…
              </div>
            ) : sorted.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                Belum ada mata pelajaran. Pilih jenjang lalu klik{" "}
                <strong>Muat Mapel Default Jenjang</strong>, atau tambahkan
                manual di atas.
              </p>
            ) : (
              <ul className="divide-y">
                {sorted.map((m) => {
                  const draft = draftNames[m.id] ?? m.nama_mapel;
                  const isDirty = draft.trim() !== m.nama_mapel;

                  return (
                    <li
                      key={m.id}
                      className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <Input
                          className="min-h-10"
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
                            if (e.key === "Enter") e.currentTarget.blur();
                          }}
                        />
                        {m.is_default && (
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            Mapel utama (default penilaian)
                          </p>
                        )}
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
        </CardContent>
      </Card>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus mata pelajaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Mapel &quot;{deleteTarget?.nama_mapel}&quot; akan dihapus dari
              penilaian dan rapor. Data nilai rapor mapel terkait juga dihapus.
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
