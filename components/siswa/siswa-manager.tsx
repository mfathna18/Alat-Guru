"use client";

import * as React from "react";
import {
  Loader2,
  Download,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { KelasFilterBar } from "@/components/shared/kelas-filter-bar";
import { KelasFilterSheet } from "@/components/shared/kelas-filter-sheet";
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useViewportMode } from "@/hooks/use-viewport-mode";
import { useKelasList } from "@/lib/hooks/use-kelas";
import {
  useBulkImportSiswa,
  useCreateSiswa,
  useRestoreSiswa,
  useSiswaList,
  useSoftDeleteSiswa,
  useUpdateSiswa,
} from "@/lib/hooks/use-siswa";
import { parseSiswaImportText } from "@/lib/siswa/parse-import";
import { parseSiswaXlsx } from "@/lib/siswa/parse-xlsx";
import { downloadSiswaImportTemplate } from "@/lib/siswa/download-import-template";
import type { Siswa } from "@/lib/types/database";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiswaManager() {
  const mode = useViewportMode();
  const isMobile = mode === "mobile";

  const { data: kelasList = [] } = useKelasList();
  const [kelasId, setKelasId] = React.useState<number | null>(null);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [tab, setTab] = React.useState<"aktif" | "sampah">("aktif");

  React.useEffect(() => {
    if (kelasId == null && kelasList.length > 0) {
      setKelasId(kelasList[0].id);
    }
  }, [kelasList, kelasId]);

  const includeDeleted = tab === "sampah";
  const { data: siswaList = [], isLoading } = useSiswaList(
    kelasId,
    includeDeleted,
  );

  const createSiswa = useCreateSiswa(kelasId);
  const updateSiswa = useUpdateSiswa(kelasId);
  const softDelete = useSoftDeleteSiswa(kelasId);
  const restore = useRestoreSiswa(kelasId);
  const bulkImport = useBulkImportSiswa(kelasId);

  const [formOpen, setFormOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Siswa | null>(null);
  const [nama, setNama] = React.useState("");
  const [nisn, setNisn] = React.useState("");
  const [nis, setNis] = React.useState("");
  const [importText, setImportText] = React.useState("");
  const [importFileName, setImportFileName] = React.useState<string | null>(
    null,
  );
  const [importRows, setImportRows] = React.useState<
    ReturnType<typeof parseSiswaImportText>
  >([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Siswa | null>(null);

  const selectedKelas = kelasList.find((k) => k.id === kelasId);

  function openCreate() {
    setEditing(null);
    setNama("");
    setNisn("");
    setNis("");
    setFormOpen(true);
  }

  function openEdit(s: Siswa) {
    setEditing(s);
    setNama(s.nama_siswa);
    setNisn(s.nisn ?? "");
    setNis(s.nis ?? "");
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!kelasId) return;

    try {
      if (editing) {
        await updateSiswa.mutateAsync({
          siswaId: editing.id,
          nama_siswa: nama,
          nisn: nisn || null,
          nis: nis || null,
        });
        toast.success("Data siswa diperbarui");
      } else {
        await createSiswa.mutateAsync({
          id_kelas: kelasId,
          nama_siswa: nama,
          nisn: nisn || null,
          nis: nis || null,
        });
        toast.success("Siswa ditambahkan");
      }
      setFormOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    }
  }

  async function handleImport() {
    if (!kelasId) return;
    const rows =
      importRows.length > 0
        ? importRows
        : parseSiswaImportText(importText);
    if (rows.length === 0) {
      toast.error(
        "Tidak ada data valid. Unggah .xlsx atau tempel NISN, NIS, dan Nama Lengkap.",
      );
      return;
    }
    try {
      await bulkImport.mutateAsync(rows);
      toast.success(`${rows.length} siswa diimpor`);
      setImportOpen(false);
      setImportText("");
      setImportRows([]);
      setImportFileName(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal impor");
    }
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "xls") {
      toast.error("Format tidak didukung. Gunakan file .xlsx atau .xls.");
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const rows = parseSiswaXlsx(buffer);
      if (rows.length === 0) {
        toast.error("File kosong atau kolom NISN/Nama tidak ditemukan.");
        return;
      }
      setImportRows(rows);
      setImportFileName(file.name);
      setImportText("");
      toast.success(`${rows.length} baris siap diimpor dari ${file.name}`);
    } catch {
      toast.error("Gagal membaca file Excel.");
    }
  }

  function openImportDialog() {
    setImportText("");
    setImportRows([]);
    setImportFileName(null);
    setImportOpen(true);
  }

  function handleImportTextChange(value: string) {
    setImportText(value);
    setImportRows([]);
    setImportFileName(null);
  }

  async function confirmSoftDelete() {
    if (!deleteTarget) return;
    try {
      await softDelete.mutateAsync(deleteTarget.id);
      toast.success("Siswa dipindah ke tong sampah");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus");
    }
  }

  async function handleRestore(s: Siswa) {
    try {
      await restore.mutateAsync(s.id);
      toast.success("Siswa dipulihkan");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memulihkan");
    }
  }

  const previewCount =
    importRows.length > 0
      ? importRows.length
      : parseSiswaImportText(importText).length;
  const saving =
    createSiswa.isPending ||
    updateSiswa.isPending ||
    bulkImport.isPending;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">
          Data Master Siswa
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola data siswa per kelas. Impor dari Excel untuk mengisi banyak
          data sekaligus.
        </p>
      </div>

      {kelasList.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="font-medium">Buat kelas terlebih dahulu</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Siswa harus terhubung ke rombel.
          </p>
          <Link
            href="/kelas"
            className={cn(buttonVariants(), "mt-4 inline-flex min-h-11")}
          >
            Ke Manajemen Kelas
          </Link>
        </div>
      ) : (
        <>
          <KelasFilterBar
            kelasId={kelasId}
            kelasList={kelasList}
            onChange={setKelasId}
            isMobile={isMobile}
            onOpenMobile={() => setFilterOpen(true)}
          />

          <KelasFilterSheet
            open={filterOpen}
            onOpenChange={setFilterOpen}
            kelasId={kelasId}
            kelasList={kelasList}
            onChange={setKelasId}
          />

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as "aktif" | "sampah")}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <TabsList className="h-10">
                <TabsTrigger value="aktif" className="min-h-9 px-4">
                  Siswa Aktif
                </TabsTrigger>
                <TabsTrigger value="sampah" className="min-h-9 gap-1.5 px-4">
                  <Trash2 className="size-3.5" />
                  Tong Sampah
                </TabsTrigger>
              </TabsList>

              {tab === "aktif" && (
                <div
                  className={cn(
                    "flex gap-2",
                    isMobile ? "w-full flex-col" : "flex-row",
                  )}
                >
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    onClick={openImportDialog}
                  >
                    <Upload className="mr-2 size-4" />
                    Impor Excel
                  </Button>
                  <Button
                    type="button"
                    className="min-h-11"
                    onClick={openCreate}
                  >
                    <Plus className="mr-2 size-4" />
                    Tambah Siswa
                  </Button>
                </div>
              )}
            </div>

            <TabsContent value="aktif" className="mt-4">
              <SiswaList
                loading={isLoading}
                siswaList={siswaList}
                isMobile={isMobile}
                kelasLabel={selectedKelas?.nama_kelas}
                mode="aktif"
                onEdit={openEdit}
                onDelete={setDeleteTarget}
              />
            </TabsContent>

            <TabsContent value="sampah" className="mt-4">
              <SiswaList
                loading={isLoading}
                siswaList={siswaList}
                isMobile={isMobile}
                kelasLabel={selectedKelas?.nama_kelas}
                mode="sampah"
                onRestore={handleRestore}
              />
            </TabsContent>
          </Tabs>
        </>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Ubah Siswa" : "Tambah Siswa"}
              </DialogTitle>
              <DialogDescription>
                {selectedKelas?.nama_kelas ?? "Kelas terpilih"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nama-siswa">Nama Lengkap</Label>
                <Input
                  id="nama-siswa"
                  className="min-h-11"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nisn">NISN (opsional)</Label>
                <Input
                  id="nisn"
                  className="min-h-11"
                  inputMode="numeric"
                  value={nisn}
                  onChange={(e) => setNisn(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nis">NIS (opsional)</Label>
                <Input
                  id="nis"
                  className="min-h-11"
                  inputMode="numeric"
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  placeholder="Kosongkan jika tidak dipakai di rapor"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
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

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Impor dari Excel</DialogTitle>
            <DialogDescription>
              Format kolom:{" "}
              <strong>NISN · NIS · Nama Lengkap</strong>. NISN dan NIS
              opsional. Unggah file Excel atau salin-tempel dari spreadsheet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 flex-1"
                onClick={() => downloadSiswaImportTemplate()}
              >
                <Download className="mr-2 size-4" />
                Unduh Template Excel
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="file-xlsx">File Excel (.xlsx / .xls)</Label>
              <input
                ref={fileInputRef}
                id="file-xlsx"
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="hidden"
                onChange={handleImportFile}
              />
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 size-4" />
                Pilih file Excel
              </Button>
              {importFileName && (
                <p className="text-sm text-muted-foreground">
                  File: <span className="font-medium">{importFileName}</span>
                </p>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  atau tempel
                </span>
              </div>
            </div>
            <Textarea
              className="min-h-[120px] font-mono text-sm"
              placeholder={
                "NISN\tNIS\tNama Lengkap\n0123456789\t12345\tBudi Santoso\n0123456790\t\tSiti Aminah"
              }
              value={importText}
              onChange={(e) => handleImportTextChange(e.target.value)}
            />
          </div>
          {previewCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {previewCount} baris siap diimpor
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setImportOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={bulkImport.isPending || previewCount === 0}
              className="min-h-10"
              onClick={handleImport}
            >
              {bulkImport.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Impor {previewCount > 0 ? `(${previewCount})` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pindah ke tong sampah?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.nama_siswa} akan disembunyikan dari daftar aktif.
              Histori nilai tetap aman dan bisa dipulihkan kapan saja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSoftDelete}>
              Pindahkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SiswaList({
  loading,
  siswaList,
  isMobile,
  kelasLabel,
  mode,
  onEdit,
  onDelete,
  onRestore,
}: {
  loading: boolean;
  siswaList: Siswa[];
  isMobile: boolean;
  kelasLabel?: string;
  mode: "aktif" | "sampah";
  onEdit?: (s: Siswa) => void;
  onDelete?: (s: Siswa) => void;
  onRestore?: (s: Siswa) => void;
}) {
  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Memuat siswa…
      </div>
    );
  }

  if (siswaList.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        {mode === "aktif"
          ? `Belum ada siswa aktif${kelasLabel ? ` di ${kelasLabel}` : ""}.`
          : "Tong sampah kosong."}
      </div>
    );
  }

  if (isMobile) {
    return (
      <ul className="space-y-3">
        {siswaList.map((s, i) => (
          <li key={s.id}>
            <Card>
              <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex min-w-0 items-start gap-2">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <CardTitle className="text-base leading-snug">
                      {s.nama_siswa}
                    </CardTitle>
                    {s.nisn && (
                      <p className="text-xs text-muted-foreground">
                        NISN {s.nisn}
                      </p>
                    )}
                    {s.nis && (
                      <p className="text-xs text-muted-foreground">
                        NIS {s.nis}
                      </p>
                    )}
                  </div>
                </div>
                {mode === "sampah" && s.deleted_at && (
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {new Date(s.deleted_at).toLocaleDateString("id-ID")}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="flex gap-2 pt-0">
                {mode === "aktif" ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 flex-1"
                      onClick={() => onEdit?.(s)}
                    >
                      <Pencil className="mr-2 size-4" />
                      Ubah
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 text-destructive"
                      onClick={() => onDelete?.(s)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 w-full"
                    onClick={() => onRestore?.(s)}
                  >
                    <RotateCcw className="mr-2 size-4" />
                    Pulihkan
                  </Button>
                )}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="w-12 px-3 py-3 text-center font-medium">#</th>
            <th className="px-4 py-3 text-left font-medium">NISN</th>
            <th className="px-4 py-3 text-left font-medium">NIS</th>
            <th className="px-4 py-3 text-left font-medium">Nama Siswa</th>
            {mode === "sampah" && (
              <th className="px-4 py-3 text-left font-medium">Dihapus</th>
            )}
            <th className="px-4 py-3 text-right font-medium">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {siswaList.map((s, i) => (
            <tr key={s.id} className="border-t hover:bg-muted/20">
              <td className="px-3 py-2.5 text-center text-muted-foreground">
                {i + 1}
              </td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                {s.nisn ?? "—"}
              </td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                {s.nis ?? "—"}
              </td>
              <td className="px-4 py-2.5 font-medium">{s.nama_siswa}</td>
              {mode === "sampah" && (
                <td className="px-4 py-2.5 text-muted-foreground">
                  {s.deleted_at
                    ? new Date(s.deleted_at).toLocaleDateString("id-ID")
                    : "—"}
                </td>
              )}
              <td className="px-4 py-2.5 text-right">
                {mode === "aktif" ? (
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit?.(s)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => onDelete?.(s)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onRestore?.(s)}
                  >
                    <RotateCcw className="mr-2 size-3.5" />
                    Pulihkan
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
