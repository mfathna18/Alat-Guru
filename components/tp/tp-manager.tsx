"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  ListPlus,
  Loader2,
  Pencil,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  TpContextFilterBar,
  skalaLabel,
  type TpContextFilters,
} from "@/components/tp/tp-context-filter";
import { TpContextFilterSheet } from "@/components/tp/tp-context-filter-sheet";
import {
  kriteriaFromTpRubrik,
  RubrikKriteriaEditor,
} from "@/components/tp/rubrik-kriteria-editor";
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
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useViewportMode } from "@/hooks/use-viewport-mode";
import { useMataPelajaranList } from "@/lib/hooks/use-e-rapor";
import { useKelasList } from "@/lib/hooks/use-kelas";
import {
  useCreateIndikator,
  useCreateTp,
  useDeleteIndikator,
  useDeleteTp,
  useTpList,
  useUpdateIndikator,
  useUpdateTp,
  useUpsertRubrik,
} from "@/lib/hooks/use-tp";
import type {
  Indikator,
  MataPelajaran,
  SkalaPenilaian,
  TpWithRelations,
} from "@/lib/types/database";
import {
  defaultKriteria,
  hasKriteriaContent,
  kriteriaToJson,
  type RubrikKriteria,
} from "@/lib/rubrik/kriteria";
import { cn } from "@/lib/utils";

const SKALA_OPTIONS: SkalaPenilaian[] = ["ANGKA", "HURUF"];
const EMPTY_MAPEL_LIST: MataPelajaran[] = [];

export function TpManager() {
  const mode = useViewportMode();
  const isMobile = mode === "mobile";

  const { data: kelasList = [] } = useKelasList();
  const { data: mapelList = EMPTY_MAPEL_LIST } = useMataPelajaranList();
  const [filters, setFilters] = React.useState<TpContextFilters>({
    kelasId: null,
    semester: 1,
    mapelId: null,
  });
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [expandedTp, setExpandedTp] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (filters.kelasId == null && kelasList.length > 0) {
      setFilters((f) => ({ ...f, kelasId: kelasList[0].id }));
    }
  }, [kelasList, filters.kelasId]);

  const scorableMapel = React.useMemo(
    () => mapelList.filter((m) => !m.is_group_header),
    [mapelList],
  );

  const defaultMapelId = React.useMemo(
    () => scorableMapel.find((m) => m.is_default)?.id ?? scorableMapel[0]?.id ?? null,
    [scorableMapel],
  );

  React.useEffect(() => {
    if (filters.mapelId == null && scorableMapel.length > 0) {
      setFilters((f) => ({
        ...f,
        mapelId:
          scorableMapel.find((m) => m.is_default)?.id ?? scorableMapel[0]?.id ?? null,
      }));
    }
  }, [scorableMapel, filters.mapelId]);

  const { data: tpList = [], isLoading } = useTpList(
    filters.kelasId,
    filters.semester,
    filters.mapelId,
    defaultMapelId,
  );

  const createTp = useCreateTp(filters.kelasId, filters.semester);
  const updateTp = useUpdateTp(filters.kelasId, filters.semester);
  const deleteTp = useDeleteTp(filters.kelasId, filters.semester);
  const createIndikator = useCreateIndikator(filters.kelasId, filters.semester);
  const updateIndikator = useUpdateIndikator(filters.kelasId, filters.semester);
  const deleteIndikator = useDeleteIndikator(filters.kelasId, filters.semester);
  const upsertRubrik = useUpsertRubrik(filters.kelasId, filters.semester);

  const [tpDialog, setTpDialog] = React.useState(false);
  const [editingTp, setEditingTp] = React.useState<TpWithRelations | null>(null);
  const [kodeTp, setKodeTp] = React.useState("");
  const [deskripsiTp, setDeskripsiTp] = React.useState("");
  const [tpMapelId, setTpMapelId] = React.useState<number | null>(null);
  const [newSkala, setNewSkala] = React.useState<SkalaPenilaian>("ANGKA");

  const [indDialog, setIndDialog] = React.useState(false);
  const [indTpId, setIndTpId] = React.useState<number | null>(null);
  const [editingInd, setEditingInd] = React.useState<Indikator | null>(null);
  const [kodeInd, setKodeInd] = React.useState("");
  const [deskripsiInd, setDeskripsiInd] = React.useState("");

  const [rubrikDialog, setRubrikDialog] = React.useState(false);
  const [rubrikTp, setRubrikTp] = React.useState<TpWithRelations | null>(null);
  const [rubrikSkala, setRubrikSkala] = React.useState<SkalaPenilaian>("ANGKA");
  const [rubrikKriteria, setRubrikKriteria] = React.useState<RubrikKriteria>(
    defaultKriteria("ANGKA"),
  );

  const [deleteTpTarget, setDeleteTpTarget] =
    React.useState<TpWithRelations | null>(null);
  const [deleteIndTarget, setDeleteIndTarget] = React.useState<Indikator | null>(
    null,
  );

  const selectedKelas = kelasList.find((k) => k.id === filters.kelasId);
  const selectedMapel = scorableMapel.find((m) => m.id === filters.mapelId);
  const totalIndikator = tpList.reduce((n, tp) => n + tp.indikator.length, 0);

  function openCreateTp() {
    setEditingTp(null);
    setKodeTp("");
    setDeskripsiTp("");
    setTpMapelId(filters.mapelId ?? defaultMapelId);
    setNewSkala("ANGKA");
    setTpDialog(true);
  }

  function openEditTp(tp: TpWithRelations) {
    setEditingTp(tp);
    setKodeTp(tp.kode_tp);
    setDeskripsiTp(tp.deskripsi_tp);
    setTpMapelId(tp.id_mata_pelajaran ?? filters.mapelId ?? defaultMapelId);
    setTpDialog(true);
  }

  function openCreateIndikator(tpId: number) {
    setIndTpId(tpId);
    setEditingInd(null);
    setKodeInd("");
    setDeskripsiInd("");
    setIndDialog(true);
  }

  function openEditIndikator(ind: Indikator, tpId: number) {
    setIndTpId(tpId);
    setEditingInd(ind);
    setKodeInd(ind.kode_indikator);
    setDeskripsiInd(ind.deskripsi_indikator);
    setIndDialog(true);
  }

  function openRubrik(tp: TpWithRelations) {
    setRubrikTp(tp);
    const skala = tp.rubrik?.skala_penilaian ?? "ANGKA";
    setRubrikSkala(skala);
    setRubrikKriteria(kriteriaFromTpRubrik(skala, tp.rubrik?.kriteria_json));
    setRubrikDialog(true);
  }

  function handleRubrikSkalaChange(skala: SkalaPenilaian) {
    setRubrikSkala(skala);
    setRubrikKriteria(defaultKriteria(skala));
  }

  async function submitTp(e: React.FormEvent) {
    e.preventDefault();
    if (!filters.kelasId) return;
    if (!tpMapelId) {
      toast.error("Pilih mata pelajaran untuk TP ini.");
      return;
    }
    try {
      if (editingTp) {
        await updateTp.mutateAsync({
          tpId: editingTp.id,
          kode_tp: kodeTp,
          deskripsi_tp: deskripsiTp,
          id_mata_pelajaran: tpMapelId,
        });
        toast.success("TP diperbarui");
      } else {
        await createTp.mutateAsync({
          id_kelas: filters.kelasId,
          semester: filters.semester,
          kode_tp: kodeTp,
          deskripsi_tp: deskripsiTp,
          skala_penilaian: newSkala,
          id_mata_pelajaran: tpMapelId,
        });
        toast.success("TP ditambahkan");
      }
      setTpDialog(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan TP");
    }
  }

  async function submitIndikator(e: React.FormEvent) {
    e.preventDefault();
    if (!indTpId) return;
    try {
      if (editingInd) {
        await updateIndikator.mutateAsync({
          indikatorId: editingInd.id,
          kode_indikator: kodeInd,
          deskripsi_indikator: deskripsiInd,
        });
        toast.success("Indikator diperbarui");
      } else {
        await createIndikator.mutateAsync({
          id_tp: indTpId,
          kode_indikator: kodeInd,
          deskripsi_indikator: deskripsiInd,
        });
        toast.success("Indikator ditambahkan");
      }
      setIndDialog(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan indikator");
    }
  }

  async function submitRubrik() {
    if (!rubrikTp) return;
    try {
      await upsertRubrik.mutateAsync({
        tpId: rubrikTp.id,
        skala: rubrikSkala,
        kriteria_json: hasKriteriaContent(rubrikKriteria)
          ? kriteriaToJson(rubrikKriteria)
          : null,
      });
      toast.success("Rubrik diperbarui");
      setRubrikDialog(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan rubrik");
    }
  }

  async function confirmDeleteTp() {
    if (!deleteTpTarget) return;
    try {
      await deleteTp.mutateAsync(deleteTpTarget.id);
      toast.success("TP dihapus");
      setDeleteTpTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus TP");
    }
  }

  async function confirmDeleteInd() {
    if (!deleteIndTarget) return;
    try {
      await deleteIndikator.mutateAsync(deleteIndTarget.id);
      toast.success("Indikator dihapus");
      setDeleteIndTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus indikator");
    }
  }

  const mapelById = React.useMemo(
    () => new Map(scorableMapel.map((m) => [m.id, m.nama_mapel])),
    [scorableMapel],
  );

  const mapelFormOptions = React.useMemo(
    () =>
      scorableMapel.map((m) => ({
        value: String(m.id),
        label: m.nama_mapel,
      })),
    [scorableMapel],
  );

  const saving =
    createTp.isPending ||
    updateTp.isPending ||
    createIndikator.isPending ||
    updateIndikator.isPending;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">
            Tujuan Pembelajaran
          </h1>
          <p className="text-sm text-muted-foreground">
            Susun tujuan pembelajaran, indikator capaian, dan rubrik penilaian.
          </p>
        </div>
        {kelasList.length > 0 && scorableMapel.length > 0 && (
          <Button
            type="button"
            className={cn("min-h-11", isMobile && "w-full")}
            onClick={openCreateTp}
          >
            <Plus className="mr-2 size-4" />
            Tambah TP
          </Button>
        )}
      </div>

      {kelasList.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="font-medium">Buat kelas terlebih dahulu</p>
          <Link
            href="/kelas"
            className={cn(buttonVariants(), "mt-4 inline-flex min-h-11")}
          >
            Ke Manajemen Kelas
          </Link>
        </div>
      ) : scorableMapel.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="font-medium">Belum ada mata pelajaran</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Atur jenjang dan mapel di Pengaturan Sekolah terlebih dahulu.
          </p>
          <Link
            href="/pengaturan"
            className={cn(buttonVariants(), "mt-4 inline-flex min-h-11")}
          >
            Ke Pengaturan Sekolah
          </Link>
        </div>
      ) : (
        <>
          <TpContextFilterBar
            filters={filters}
            kelasList={kelasList}
            mapelList={mapelList}
            onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
            isMobile={isMobile}
            onOpenMobile={() => setFilterOpen(true)}
          />

          <TpContextFilterSheet
            open={filterOpen}
            onOpenChange={setFilterOpen}
            filters={filters}
            kelasList={kelasList}
            mapelList={mapelList}
            onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
          />

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">
              {selectedKelas?.nama_kelas} · {selectedMapel?.nama_mapel ?? "Mapel"} ·
              Semester {filters.semester}
            </Badge>
            <Badge variant="secondary">{tpList.length} TP</Badge>
            <Badge variant="secondary">{totalIndikator} indikator</Badge>
          </div>

          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 size-5 animate-spin" />
              Memuat TP…
            </div>
          ) : tpList.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="font-medium">Belum ada TP untuk konteks ini</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Contoh kode: TP 1.1, TP 1.2 — untuk mapel{" "}
                {selectedMapel?.nama_mapel ?? "terpilih"}
              </p>
              <Button
                type="button"
                className="mt-4 min-h-11"
                onClick={openCreateTp}
              >
                <Plus className="mr-2 size-4" />
                Buat TP Pertama
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {tpList.map((tp) => (
                <TpCard
                  key={tp.id}
                  tp={tp}
                  mapelLabel={
                    tp.id_mata_pelajaran
                      ? mapelById.get(tp.id_mata_pelajaran)
                      : undefined
                  }
                  isMobile={isMobile}
                  expanded={expandedTp === tp.id}
                  onToggle={() =>
                    setExpandedTp((id) => (id === tp.id ? null : tp.id))
                  }
                  onEditTp={() => openEditTp(tp)}
                  onDeleteTp={() => setDeleteTpTarget(tp)}
                  onRubrik={() => openRubrik(tp)}
                  onAddIndikator={() => openCreateIndikator(tp.id)}
                  onEditIndikator={(ind) => openEditIndikator(ind, tp.id)}
                  onDeleteIndikator={setDeleteIndTarget}
                />
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={tpDialog} onOpenChange={setTpDialog}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={submitTp}>
            <DialogHeader>
              <DialogTitle>{editingTp ? "Ubah TP" : "Tambah TP"}</DialogTitle>
              <DialogDescription>
                {selectedKelas?.nama_kelas} ·{" "}
                {scorableMapel.find((m) => m.id === tpMapelId)?.nama_mapel ??
                  selectedMapel?.nama_mapel}{" "}
                · Semester {filters.semester}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <FilterDropdown
                label="Mata Pelajaran"
                value={tpMapelId != null ? String(tpMapelId) : null}
                options={mapelFormOptions}
                onChange={(v) => setTpMapelId(Number(v))}
                placeholder="Pilih mapel"
                emptyMessage="Belum ada mapel"
                className="w-full"
                triggerClassName="h-11"
              />
              <p className="-mt-2 text-xs text-muted-foreground">
                TP hanya muncul di penilaian untuk mapel yang sama.
              </p>
              <div className="space-y-2">
                <Label htmlFor="kode-tp">Kode TP</Label>
                <Input
                  id="kode-tp"
                  className="min-h-11"
                  placeholder="TP 1.1"
                  value={kodeTp}
                  onChange={(e) => setKodeTp(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desk-tp">Deskripsi TP</Label>
                <Textarea
                  id="desk-tp"
                  rows={3}
                  placeholder="Peserta didik mampu..."
                  value={deskripsiTp}
                  onChange={(e) => setDeskripsiTp(e.target.value)}
                  required
                />
              </div>
              {!editingTp && (
                <div className="space-y-2">
                  <Label>Skala Rubrik Awal</Label>
                  <SkalaPicker value={newSkala} onChange={setNewSkala} />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTpDialog(false)}>
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

      <Dialog open={indDialog} onOpenChange={setIndDialog}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={submitIndikator}>
            <DialogHeader>
              <DialogTitle>
                {editingInd ? "Ubah Indikator" : "Tambah Indikator"}
              </DialogTitle>
              <DialogDescription>
                Indikator ketercapaian — kolom otomatis di grid penilaian
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="kode-ind">Kode Indikator</Label>
                <Input
                  id="kode-ind"
                  className="min-h-11"
                  placeholder="Indikator 1.1.1"
                  value={kodeInd}
                  onChange={(e) => setKodeInd(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desk-ind">Deskripsi Indikator</Label>
                <Textarea
                  id="desk-ind"
                  rows={3}
                  value={deskripsiInd}
                  onChange={(e) => setDeskripsiInd(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIndDialog(false)}>
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

      <Dialog open={rubrikDialog} onOpenChange={setRubrikDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Rubrik Penilaian</DialogTitle>
            <DialogDescription>
              {rubrikTp?.kode_tp} — skala dan kriteria deskriptif per level
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <SkalaPicker value={rubrikSkala} onChange={handleRubrikSkalaChange} />
            <RubrikKriteriaEditor
              skala={rubrikSkala}
              value={rubrikKriteria}
              onChange={setRubrikKriteria}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRubrikDialog(false)}>
              Batal
            </Button>
            <Button
              type="button"
              disabled={upsertRubrik.isPending}
              className="min-h-10"
              onClick={submitRubrik}
            >
              {upsertRubrik.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Simpan Rubrik
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTpTarget != null}
        onOpenChange={(o) => !o && setDeleteTpTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {deleteTpTarget?.kode_tp}?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua indikator, rubrik, dan nilai terkait TP ini ikut terhapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDeleteTp}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteIndTarget != null}
        onOpenChange={(o) => !o && setDeleteIndTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus {deleteIndTarget?.kode_indikator}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Nilai siswa untuk indikator ini juga akan terhapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteInd}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SkalaPicker({
  value,
  onChange,
}: {
  value: SkalaPenilaian;
  onChange: (v: SkalaPenilaian) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-1">
      {SKALA_OPTIONS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={cn(
            "flex min-h-11 items-center justify-between rounded-xl border-2 px-4 text-left text-sm font-medium transition-colors",
            value === s
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-muted/50",
          )}
        >
          {skalaLabel(s)}
          {value === s && <span className="size-2.5 rounded-full bg-primary" />}
        </button>
      ))}
    </div>
  );
}

function TpCard({
  tp,
  mapelLabel,
  isMobile,
  expanded,
  onToggle,
  onEditTp,
  onDeleteTp,
  onRubrik,
  onAddIndikator,
  onEditIndikator,
  onDeleteIndikator,
}: {
  tp: TpWithRelations;
  mapelLabel?: string;
  isMobile: boolean;
  expanded: boolean;
  onToggle: () => void;
  onEditTp: () => void;
  onDeleteTp: () => void;
  onRubrik: () => void;
  onAddIndikator: () => void;
  onEditIndikator: (ind: Indikator) => void;
  onDeleteIndikator: (ind: Indikator) => void;
}) {
  const showBody = !isMobile || expanded;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start gap-2">
          {isMobile && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="mt-0.5 shrink-0"
              onClick={onToggle}
            >
              {expanded ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </Button>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">{tp.kode_tp}</CardTitle>
              {mapelLabel && (
                <Badge variant="secondary" className="font-normal">
                  {mapelLabel}
                </Badge>
              )}
              <Badge variant="outline">
                {skalaLabel(tp.rubrik?.skala_penilaian ?? "ANGKA")}
              </Badge>
              <Badge variant="secondary">{tp.indikator.length} ind.</Badge>
            </div>
            <CardDescription className="mt-1 line-clamp-2">
              {tp.deskripsi_tp}
            </CardDescription>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Button type="button" size="sm" variant="outline" onClick={onRubrik}>
            <Settings2 className="mr-1.5 size-3.5" />
            Rubrik
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onEditTp}>
            <Pencil className="mr-1.5 size-3.5" />
            Ubah
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onAddIndikator}
          >
            <ListPlus className="mr-1.5 size-3.5" />
            Indikator
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={onDeleteTp}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </CardHeader>

      {showBody && (
        <CardContent className="pt-0">
          {tp.indikator.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              Belum ada indikator. Tambahkan agar muncul di penilaian.
            </p>
          ) : isMobile ? (
            <ul className="space-y-2">
              {tp.indikator.map((ind) => (
                <li
                  key={ind.id}
                  className="flex items-start justify-between gap-2 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{ind.kode_indikator}</p>
                    <p className="text-xs text-muted-foreground">
                      {ind.deskripsi_indikator}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => onEditIndikator(ind)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => onDeleteIndikator(ind)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Kode</th>
                    <th className="px-3 py-2 text-left font-medium">
                      Deskripsi Indikator
                    </th>
                    <th className="w-20 px-3 py-2 text-right font-medium">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tp.indikator.map((ind) => (
                    <tr key={ind.id} className="border-t">
                      <td className="px-3 py-2 font-mono text-xs font-medium">
                        {ind.kode_indikator}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {ind.deskripsi_indikator}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-0.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => onEditIndikator(ind)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => onDeleteIndikator(ind)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
