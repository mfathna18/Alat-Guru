"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { KelasModulPanel } from "@/components/kelas/kelas-modul-panel";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useViewportMode } from "@/hooks/use-viewport-mode";
import { useMataPelajaranList } from "@/lib/hooks/use-e-rapor";
import { useModulAjarWorkspace } from "@/lib/hooks/use-modul-ajar";
import {
  useCreateKelas,
  useDeleteKelas,
  useKelasList,
  useUpdateKelas,
} from "@/lib/hooks/use-kelas";
import { modulScopeKey } from "@/lib/modul-ajar/scope";
import { fetchCurrentGuru } from "@/lib/services/kelas";
import type { Kelas } from "@/lib/types/database";
import { cn } from "@/lib/utils";

export function KelasManager() {
  const mode = useViewportMode();
  const isMobile = mode === "mobile";

  const { data: guru, isLoading: loadingGuru } = useQuery({
    queryKey: ["guru", "current"],
    queryFn: fetchCurrentGuru,
  });

  const { data: kelasList = [], isLoading: loadingKelas } = useKelasList();
  const {
    data: mapelList = [],
    isLoading: loadingMapel,
    error: mapelError,
  } = useMataPelajaranList();
  const { data: modulWorkspace, isLoading: loadingModul } =
    useModulAjarWorkspace();

  const createKelas = useCreateKelas();
  const updateKelas = useUpdateKelas();
  const deleteKelas = useDeleteKelas();

  const [selectedKelasId, setSelectedKelasId] = React.useState<number | null>(
    null,
  );
  const [selectedMapelId, setSelectedMapelId] = React.useState<number | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Kelas | null>(null);
  const [namaKelas, setNamaKelas] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<Kelas | null>(null);

  const modulByScope = modulWorkspace?.modulByScope ?? {};
  const progressMap = modulWorkspace?.progressMap ?? {};

  const scorableMapel = React.useMemo(
    () => mapelList.filter((m) => !m.is_group_header),
    [mapelList],
  );

  const selectedKelas =
    kelasList.find((k) => k.id === selectedKelasId) ?? null;
  const selectedMapel =
    scorableMapel.find((m) => m.id === selectedMapelId) ?? null;

  const selectedModulList =
    selectedKelas && selectedMapel
      ? (modulByScope[modulScopeKey(selectedKelas.id, selectedMapel.id)] ?? [])
      : [];

  React.useEffect(() => {
    if (kelasList.length === 0) {
      setSelectedKelasId(null);
      return;
    }
    if (
      selectedKelasId == null ||
      !kelasList.some((k) => k.id === selectedKelasId)
    ) {
      setSelectedKelasId(kelasList[0]!.id);
    }
  }, [kelasList, selectedKelasId]);

  React.useEffect(() => {
    if (scorableMapel.length === 0) {
      setSelectedMapelId(null);
      return;
    }
    if (
      selectedMapelId == null ||
      !scorableMapel.some((m) => m.id === selectedMapelId)
    ) {
      setSelectedMapelId(
        scorableMapel.find((m) => m.is_default)?.id ?? scorableMapel[0]!.id,
      );
    }
  }, [scorableMapel, selectedMapelId]);

  React.useEffect(() => {
    const selected = mapelList.find((m) => m.id === selectedMapelId);
    if (!selected?.is_group_header) return;
    const subMapel = mapelList.find(
      (m) => !m.is_group_header && m.parent_id === selected.id,
    );
    const fallback =
      subMapel ??
      scorableMapel.find((m) => m.is_default) ??
      scorableMapel[0];
    if (fallback && fallback.id !== selectedMapelId) {
      setSelectedMapelId(fallback.id);
    }
  }, [mapelList, selectedMapelId, scorableMapel]);

  function openCreate() {
    setEditing(null);
    setNamaKelas("");
    setDialogOpen(true);
  }

  function openEdit(kelas: Kelas) {
    setEditing(kelas);
    setNamaKelas(kelas.nama_kelas);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!guru) return;

    try {
      if (editing) {
        await updateKelas.mutateAsync({
          kelasId: editing.id,
          namaKelas,
        });
        toast.success("Kelas diperbarui");
      } else {
        await createKelas.mutateAsync({ idGuru: guru.id, namaKelas });
        toast.success("Kelas ditambahkan");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan kelas");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteKelas.mutateAsync(deleteTarget.id);
      toast.success("Kelas dihapus");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus kelas");
    }
  }

  const loading = loadingGuru || loadingKelas || loadingModul || loadingMapel;
  const saving = createKelas.isPending || updateKelas.isPending;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">
            Manajemen Kelas
          </h1>
          <p className="text-sm text-muted-foreground">
            Buat rombel dan pilih mata pelajaran yang Anda ampu.
          </p>
        </div>
        <Button
          type="button"
          className={cn("min-h-11", isMobile && "w-full")}
          onClick={openCreate}
        >
          <Plus className="mr-2 size-4" />
          Tambah Kelas
        </Button>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" />
          Memuat kelas…
        </div>
      ) : kelasList.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <Users className="mx-auto mb-2 size-8 text-muted-foreground" />
          <p className="font-medium">Belum ada kelas</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Buat rombel pertama (mis. X-A, X-B), lalu tambahkan modul per kelas
            dan mapel.
          </p>
          <Button type="button" className="mt-4 min-h-11" onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            Buat Kelas Pertama
          </Button>
        </div>
      ) : (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FilterDropdown
              label="Kelas"
              value={selectedKelasId != null ? String(selectedKelasId) : null}
              options={kelasList.map((k) => ({
                value: String(k.id),
                label: k.nama_kelas,
              }))}
              onChange={(v) => setSelectedKelasId(Number(v))}
              placeholder="Pilih kelas"
              emptyMessage="Belum ada kelas"
            />

            <FilterDropdown
              label="Mata Pelajaran"
              value={selectedMapelId != null ? String(selectedMapelId) : null}
              options={scorableMapel.map((m) => ({
                value: String(m.id),
                label: `${m.nama_mapel}${m.is_default ? " ★" : ""}`,
              }))}
              onChange={(v) => setSelectedMapelId(Number(v))}
              placeholder="Pilih mapel"
              loading={loadingMapel}
              emptyMessage="Belum ada mapel — atur di Pengaturan"
            />
          </div>

          {mapelError && (
            <p className="text-xs text-destructive">
              {mapelError instanceof Error
                ? mapelError.message
                : "Gagal memuat daftar mapel."}
            </p>
          )}

          {selectedKelas && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9"
                onClick={() => openEdit(selectedKelas)}
              >
                <Pencil className="mr-1 size-3.5" />
                Ubah Kelas
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9 text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget(selectedKelas)}
              >
                <Trash2 className="size-3.5" />
                Hapus Kelas
              </Button>
            </div>
          )}

          {!selectedKelas ? (
            <p className="text-sm text-muted-foreground">
              Silakan pilih kelas terlebih dahulu.
            </p>
          ) : !selectedMapel ? (
            <p className="text-sm text-muted-foreground">
              Belum ada mata pelajaran. Tambahkan mapel di{" "}
              <Link
                href="/pengaturan"
                className="text-primary underline-offset-4 hover:underline"
              >
                Pengaturan
              </Link>
              .
            </p>
          ) : (
            <KelasModulPanel
              kelas={selectedKelas}
              mapel={selectedMapel}
              kelasList={kelasList}
              modulList={selectedModulList}
              modulByScope={modulByScope}
              progressMap={progressMap}
            />
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Ubah Kelas" : "Tambah Kelas Baru"}
              </DialogTitle>
              <DialogDescription>
                Contoh: X A, X B, X C untuk kelas paralel
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="nama-kelas">Nama Kelas</Label>
              <Input
                id="nama-kelas"
                className="mt-2 min-h-11"
                placeholder="X A"
                value={namaKelas}
                onChange={(e) => setNamaKelas(e.target.value)}
                required
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={saving} className="min-h-10">
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus kelas {deleteTarget?.nama_kelas}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Semua siswa, TP, indikator, nilai, modul, dan progress terkait
              kelas ini ikut terhapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              {deleteKelas.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Hapus Permanen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
