"use client";

import * as React from "react";
import { FileText, Loader2, RotateCcw, Users } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { AbsensiStudentRow } from "@/components/absensi/absensi-student-row";
import { usePdfPreview } from "@/components/export/pdf-preview-dialog";
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
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useViewportMode } from "@/hooks/use-viewport-mode";
import {
  STATUS_OPTIONS,
  STATUS_STYLE,
} from "@/lib/absensi/status-config";
import { absensiRekapPdfBlob } from "@/lib/export/absensi-rekap-pdf";
import { daftarHadirPdfBlob } from "@/lib/export/daftar-hadir-pdf";
import {
  useAbsensiByDate,
  useBulkUpsertAbsensi,
  useResetAbsensi,
  useUpsertAbsensi,
} from "@/lib/hooks/use-absensi";
import { useKelasList } from "@/lib/hooks/use-kelas";
import { useGuruProfile } from "@/lib/hooks/use-guru-profile";
import { usePengaturanSekolah } from "@/lib/hooks/use-pengaturan";
import { useSiswaList } from "@/lib/hooks/use-siswa";
import {
  currentMonthIso,
  fetchAbsensiByKelasRange,
  schoolDaysInMonth,
  todayIso,
} from "@/lib/services/absensi";
import type { Absensi, StatusAbsensi } from "@/lib/types/database";
import { cn } from "@/lib/utils";

export function AbsensiManager() {
  const mode = useViewportMode();
  const isMobile = mode === "mobile";

  const { data: kelasList = [] } = useKelasList();
  const [kelasId, setKelasId] = React.useState<number | null>(null);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [tanggal, setTanggal] = React.useState(todayIso());
  const [bulan, setBulan] = React.useState(currentMonthIso());
  const [previewLoading, setPreviewLoading] = React.useState<
    "hadir" | "rekap" | null
  >(null);
  const { showPdfPreview, pdfPreviewDialog } = usePdfPreview();
  const [confirmMarkAll, setConfirmMarkAll] = React.useState(false);
  const [confirmReset, setConfirmReset] = React.useState(false);
  const [savingIds, setSavingIds] = React.useState<Set<number>>(new Set());
  const [optimistic, setOptimistic] = React.useState<
    Map<number, Pick<Absensi, "status" | "keterangan">>
  >(new Map());

  React.useEffect(() => {
    if (kelasId == null && kelasList.length > 0) {
      setKelasId(kelasList[0].id);
    }
  }, [kelasList, kelasId]);

  React.useEffect(() => {
    setOptimistic(new Map());
  }, [kelasId, tanggal]);

  const { data: siswaList = [], isLoading: loadingSiswa } = useSiswaList(
    kelasId,
    false,
  );
  const { data: absensiList = [], isLoading: loadingAbsensi } =
    useAbsensiByDate(kelasId, tanggal);
  const upsert = useUpsertAbsensi(kelasId, tanggal);
  const bulkUpsert = useBulkUpsertAbsensi(kelasId, tanggal);
  const resetAbsensi = useResetAbsensi(kelasId, tanggal);

  const { data: guru } = useGuruProfile();
  const { data: pengaturan } = usePengaturanSekolah(guru?.id);

  const selectedKelas = kelasList.find((k) => k.id === kelasId);

  const mergedRows = React.useMemo(() => {
    const serverMap = new Map(absensiList.map((a) => [a.id_siswa, a]));
    return siswaList.map((s) => {
      const opt = optimistic.get(s.id);
      const srv = serverMap.get(s.id);
      return {
        id: s.id,
        nama_siswa: s.nama_siswa,
        nisn: s.nisn,
        status: opt?.status ?? srv?.status,
        keterangan: opt?.keterangan ?? srv?.keterangan ?? null,
      };
    });
  }, [siswaList, absensiList, optimistic]);

  const counts = React.useMemo(() => {
    const c = { H: 0, I: 0, S: 0, A: 0, unset: 0 };
    for (const row of mergedRows) {
      if (!row.status) c.unset++;
      else c[row.status]++;
    }
    return c;
  }, [mergedRows]);

  async function saveStatus(
    siswaId: number,
    status: StatusAbsensi,
    keterangan: string | null,
  ) {
    setSavingIds((prev) => new Set(prev).add(siswaId));
    setOptimistic((prev) => {
      const next = new Map(prev);
      next.set(siswaId, { status, keterangan });
      return next;
    });

    try {
      await upsert.mutateAsync({ id_siswa: siswaId, status, keterangan });
    } catch (err) {
      setOptimistic((prev) => {
        const next = new Map(prev);
        next.delete(siswaId);
        return next;
      });
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
      throw err;
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(siswaId);
        return next;
      });
    }
  }

  async function markAllPresent() {
    if (siswaList.length === 0) return;
    setConfirmMarkAll(false);

    const entries = siswaList.map((s) => ({
      id_siswa: s.id,
      status: "H" as const,
      keterangan: null,
    }));

    setOptimistic((prev) => {
      const next = new Map(prev);
      for (const s of siswaList) {
        next.set(s.id, { status: "H", keterangan: null });
      }
      return next;
    });

    try {
      await bulkUpsert.mutateAsync(entries);
      toast.success(`${siswaList.length} siswa ditandai hadir`);
    } catch (err) {
      setOptimistic(new Map());
      toast.error(err instanceof Error ? err.message : "Gagal hadirkan semua");
    }
  }

  async function handleReset() {
    setConfirmReset(false);
    try {
      await resetAbsensi.mutateAsync();
      setOptimistic(new Map());
      toast.success("Absensi direset untuk tanggal ini");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal reset absensi");
    }
  }

  async function previewDaftarHadir() {
    if (!guru || !selectedKelas) {
      toast.error("Data guru atau kelas belum tersedia.");
      return;
    }
    setPreviewLoading("hadir");
    try {
      const input = {
        pengaturan: pengaturan ?? null,
        guru,
        kelasNama: selectedKelas.nama_kelas,
        tanggal,
        siswa: siswaList,
      };
      showPdfPreview({
        title: "Daftar Hadir",
        description: `${selectedKelas.nama_kelas} · ${tanggal}`,
        generate: () => daftarHadirPdfBlob(input),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyiapkan preview");
    } finally {
      setPreviewLoading(null);
    }
  }

  async function previewRekapBulan() {
    if (!guru || !selectedKelas || !kelasId) {
      toast.error("Data guru atau kelas belum tersedia.");
      return;
    }
    setPreviewLoading("rekap");
    try {
      const tanggalList = schoolDaysInMonth(bulan);
      const { start, end } = {
        start: `${bulan}-01`,
        end: tanggalList[tanggalList.length - 1] ?? `${bulan}-28`,
      };
      const absensi = await fetchAbsensiByKelasRange(kelasId, start, end);
      const input = {
        pengaturan: pengaturan ?? null,
        guru,
        kelasNama: selectedKelas.nama_kelas,
        bulan,
        siswa: siswaList,
        absensi,
        tanggalList,
      };
      showPdfPreview({
        title: "Rekap Absensi Bulanan",
        description: `${selectedKelas.nama_kelas} · ${bulan}`,
        generate: () => absensiRekapPdfBlob(input),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyiapkan preview");
    } finally {
      setPreviewLoading(null);
    }
  }

  const loading = loadingSiswa || loadingAbsensi;
  const bulkBusy = bulkUpsert.isPending || resetAbsensi.isPending;

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Absensi</h1>
          <p className="text-sm text-muted-foreground">
            Catat kehadiran siswa harian dan unduh rekap absensi.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-10"
            disabled={previewLoading != null || siswaList.length === 0}
            onClick={() => void previewDaftarHadir()}
          >
            {previewLoading === "hadir" ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <FileText className="mr-2 size-4" />
            )}
            Preview Daftar Hadir
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-10"
            disabled={previewLoading != null || siswaList.length === 0}
            onClick={() => void previewRekapBulan()}
          >
            {previewLoading === "rekap" ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <FileText className="mr-2 size-4" />
            )}
            Preview Rekap Bulan
          </Button>
        </div>
      </div>

      {kelasList.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Belum ada kelas</CardTitle>
            <CardDescription>
              Buat kelas terlebih dahulu agar absensi bisa dicatat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/kelas" className={buttonVariants()}>
              Kelola Kelas
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {isMobile ? (
            <>
              <KelasFilterBar
                kelasList={kelasList}
                kelasId={kelasId}
                onChange={setKelasId}
                isMobile
                onOpenMobile={() => setFilterOpen(true)}
              />
              <KelasFilterSheet
                open={filterOpen}
                onOpenChange={setFilterOpen}
                kelasList={kelasList}
                kelasId={kelasId}
                onChange={setKelasId}
                title="Pilih Kelas"
              />
            </>
          ) : (
            <KelasFilterBar
              kelasList={kelasList}
              kelasId={kelasId}
              onChange={setKelasId}
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="tanggal-absensi">Tanggal</Label>
              <Input
                id="tanggal-absensi"
                type="date"
                className="min-h-11"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulan-rekap">Bulan rekap PDF</Label>
              <Input
                id="bulan-rekap"
                type="month"
                className="min-h-11"
                value={bulan}
                onChange={(e) => setBulan(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <div className="flex w-full flex-wrap gap-2 rounded-xl border bg-muted/30 px-3 py-2">
                {(Object.keys(STATUS_STYLE) as StatusAbsensi[]).map((st) => (
                  <Badge
                    key={st}
                    variant="outline"
                    className={cn("gap-1.5 font-normal", STATUS_STYLE[st].badge)}
                  >
                    <span
                      className={cn("size-1.5 rounded-full", STATUS_STYLE[st].dot)}
                    />
                    {STATUS_STYLE[st].label}: {counts[st]}
                  </Badge>
                ))}
                {counts.unset > 0 && (
                  <Badge variant="outline" className="font-normal text-muted-foreground">
                    Belum diisi: {counts.unset}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              className="min-h-11 flex-1 sm:flex-none"
              disabled={siswaList.length === 0 || bulkBusy}
              onClick={() => setConfirmMarkAll(true)}
            >
              {bulkUpsert.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Users className="mr-2 size-4" />
              )}
              Hadirkan Semua Siswa
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 flex-1 sm:flex-none"
              disabled={siswaList.length === 0 || bulkBusy || absensiList.length === 0}
              onClick={() => setConfirmReset(true)}
            >
              {resetAbsensi.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 size-4" />
              )}
              Reset Absensi
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {selectedKelas?.nama_kelas ?? "—"}
              </CardTitle>
              <CardDescription>
                Langkah 1: Hadirkan semua · Langkah 2: Ubah yang izin/sakit/alpa
                (keterangan wajib untuk izin & sakit).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : siswaList.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Belum ada siswa aktif.{" "}
                  <Link href="/siswa" className="text-primary hover:underline">
                    Impor atau tambah siswa
                  </Link>
                </p>
              ) : isMobile ? (
                <ul className="space-y-3">
                  {mergedRows.map((row, idx) => (
                    <AbsensiStudentRow
                      key={row.id}
                      siswa={row}
                      index={idx}
                      isMobile
                      saving={savingIds.has(row.id)}
                      onSave={saveStatus}
                    />
                  ))}
                </ul>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium">No</th>
                        <th className="px-3 py-2 text-left font-medium">
                          Nama Siswa
                        </th>
                        <th className="px-3 py-2 text-left font-medium">NISN</th>
                        <th className="px-3 py-2 text-left font-medium">
                          Status
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Ubah
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Keterangan
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {mergedRows.map((row, idx) => (
                        <AbsensiStudentRow
                          key={row.id}
                          siswa={row}
                          index={idx}
                          saving={savingIds.has(row.id)}
                          onSave={saveStatus}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {STATUS_OPTIONS.map((o) => (
              <Badge key={o.value} variant="outline">
                {o.short} = {o.label}
              </Badge>
            ))}
          </div>
        </>
      )}

      <AlertDialog open={confirmMarkAll} onOpenChange={setConfirmMarkAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hadirkan semua siswa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tandai <strong>{siswaList.length} siswa</strong> di{" "}
              {selectedKelas?.nama_kelas} sebagai <strong>Hadir</strong> untuk
              tanggal {tanggal}. Anda masih bisa mengubah status per siswa
              setelahnya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={markAllPresent}>
              Ya, Hadirkan Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset absensi hari ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Hapus semua catatan absensi untuk tanggal {tanggal} di kelas{" "}
              {selectedKelas?.nama_kelas}. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleReset}
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {pdfPreviewDialog}
    </div>
  );
}
