"use client";

import * as React from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  Archive,
  Users,
  ImageIcon,
  Loader2,
  Printer,
} from "lucide-react";
import { toast } from "sonner";

import { MapelStrukturPanel } from "@/components/e-rapor/mapel-struktur-panel";
import { BulkRaporPrintDialog } from "@/components/e-rapor/bulk-rapor-print-dialog";
import { RaporPreviewDialog } from "@/components/e-rapor/rapor-preview-dialog";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useMataPelajaranList,
} from "@/lib/hooks/use-e-rapor";
import { useGuruProfile } from "@/lib/hooks/use-guru-profile";
import { useKelasList } from "@/lib/hooks/use-penilaian";
import { usePersistRaporPreferences } from "@/lib/hooks/use-persist-rapor-preferences";
import { usePengaturanSekolah } from "@/lib/hooks/use-pengaturan";
import { useSiswaList } from "@/lib/hooks/use-siswa";
import { queryKeys } from "@/lib/query-keys";
import { DEFAULT_RAPOR_TEMPLATE_ID } from "@/lib/rapor/types";
import { semesterLabel } from "@/lib/rapor/semester-labels";
import {
  buildKelasRaporZipBlob,
  downloadBlob,
} from "@/lib/export/rapor/bulk-kelas-zip";
import { getErrorMessage } from "@/lib/utils";
import type { Siswa } from "@/lib/types/database";

export function ERaporManager() {
  const queryClient = useQueryClient();
  const { data: kelasList = [], isLoading: loadingKelas } = useKelasList();
  const { data: mapelList = [] } = useMataPelajaranList();
  const { data: guru } = useGuruProfile();
  const { data: pengaturan } = usePengaturanSekolah(guru?.id);

  const [kelasId, setKelasId] = React.useState<number | null>(null);
  const [semester, setSemester] = React.useState<1 | 2>(1);
  const [tahunAjaran, setTahunAjaran] = React.useState("2025/2026");
  const [previewSiswa, setPreviewSiswa] = React.useState<Siswa | null>(null);
  const [bulkPrintOpen, setBulkPrintOpen] = React.useState(false);
  const [zipBusy, setZipBusy] = React.useState(false);
  const [watermarkLogo, setWatermarkLogo] = React.useState(false);
  const templateId = DEFAULT_RAPOR_TEMPLATE_ID;
  const prefsInit = React.useRef(false);
  const [prefsReady, setPrefsReady] = React.useState(false);

  React.useEffect(() => {
    if (pengaturan && !prefsInit.current) {
      setWatermarkLogo(pengaturan.rapor_watermark_logo ?? false);
      prefsInit.current = true;
      setPrefsReady(true);
    }
  }, [pengaturan]);

  const { isSaving: savingRaporPrefs } = usePersistRaporPreferences({
    guruId: guru?.id,
    pengaturan,
    templateId,
    watermarkLogo,
    ready: prefsReady && Boolean(pengaturan),
  });

  React.useEffect(() => {
    if (kelasId == null && kelasList.length > 0) {
      setKelasId(kelasList[0].id);
    }
  }, [kelasList, kelasId]);

  React.useEffect(() => {
    if (pengaturan?.tahun_ajaran) {
      setTahunAjaran(pengaturan.tahun_ajaran);
    }
  }, [pengaturan?.tahun_ajaran]);

  const selectedKelas = kelasList.find((k) => k.id === kelasId);
  const { data: siswaList = [], isLoading: loadingSiswa } = useSiswaList(kelasId);

  async function handleDownloadZip() {
    if (!kelasId || siswaList.length === 0) return;
    setZipBusy(true);
    const toastId = toast.loading(
      `Menyiapkan ZIP (${siswaList.length} siswa)…`,
    );
    try {
      const { blob, filename } = await buildKelasRaporZipBlob(
        siswaList,
        kelasId,
        semester,
        tahunAjaran,
        { templateId, watermarkLogo },
        (p) => {
          if (p.currentName) {
            toast.loading(`${p.done + 1}/${p.total} · ${p.currentName}`, {
              id: toastId,
            });
          }
        },
      );
      downloadBlob(blob, filename);
      toast.success(`ZIP berisi ${siswaList.length} rapor PDF.`, { id: toastId });
    } catch (err) {
      toast.error(
        getErrorMessage(err, "Gagal membuat ZIP PDF."),
        { id: toastId },
      );
    } finally {
      setZipBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">E-Rapor</h1>
        <p className="text-sm text-muted-foreground">
          Preview dan cetak rapor semester per siswa.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filter Rapor</CardTitle>
          <CardDescription>Pilih kelas dan semester</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FilterDropdown
              label="Kelas"
              value={kelasId != null ? String(kelasId) : null}
              options={kelasList.map((k) => ({
                value: String(k.id),
                label: k.nama_kelas,
              }))}
              onChange={(v) => setKelasId(Number(v))}
              placeholder="Pilih kelas"
              emptyMessage="Belum ada kelas"
              disabled={loadingKelas}
            />

            <FilterDropdown
              label="Semester"
              value={String(semester)}
              options={([1, 2] as const).map((s) => ({
                value: String(s),
                label: `Semester ${semesterLabel(s)}`,
              }))}
              onChange={(v) => setSemester(Number(v) as 1 | 2)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t pt-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Tahun ajaran</span>
              <Input
                value={tahunAjaran}
                onChange={(e) => setTahunAjaran(e.target.value)}
                className="h-8 w-32"
                placeholder="2025/2026"
              />
            </div>

            <Button
              variant="outline"
              className="min-h-9"
              disabled={!kelasId || siswaList.length === 0}
              onClick={() => setBulkPrintOpen(true)}
            >
              <Printer className="mr-2 size-4" />
              Cetak Kelas
            </Button>

            <Button
              variant="outline"
              className="min-h-9"
              disabled={!kelasId || siswaList.length === 0 || zipBusy}
              onClick={() => void handleDownloadZip()}
            >
              {zipBusy ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Archive className="mr-2 size-4" />
              )}
              Unduh ZIP PDF
            </Button>
          </div>

          {savingRaporPrefs && (
            <p className="text-xs text-muted-foreground">
              Menyimpan preferensi watermark…
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
            <ImageIcon className="size-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Watermark logo sekolah
            </span>
            <Button
              type="button"
              size="sm"
              variant={watermarkLogo ? "default" : "outline"}
              className="h-8"
              disabled={!pengaturan?.logo_url}
              onClick={() => setWatermarkLogo(true)}
            >
              Ya
            </Button>
            <Button
              type="button"
              size="sm"
              variant={!watermarkLogo ? "default" : "outline"}
              className="h-8"
              onClick={() => setWatermarkLogo(false)}
            >
              Tidak
            </Button>
            {!pengaturan?.logo_url ? (
              <span className="text-xs text-muted-foreground">
                Unggah logo di{" "}
                <Link
                  href="/pengaturan"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Pengaturan
                </Link>
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                Logo transparan di latar rapor (cetak & PDF)
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <MapelStrukturPanel
        mapelList={mapelList}
        onSeeded={() => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.eRapor.mapel });
        }}
      />

      {loadingKelas && (
        <div className="flex h-32 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" />
          Memuat…
        </div>
      )}

      {kelasId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              <Users className="size-4" />
              Daftar Siswa — {selectedKelas?.nama_kelas ?? "Kelas"}
            </CardTitle>
            <CardDescription>
              Semester {semesterLabel(semester)} · {tahunAjaran}. Nilai rapor
              dihitung otomatis dari data penilaian seluruh mapel.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loadingSiswa ? (
              <div className="flex h-24 items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 size-5 animate-spin" />
                Memuat siswa…
              </div>
            ) : siswaList.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Belum ada siswa di kelas ini. Tambahkan siswa di{" "}
                <Link
                  href="/siswa"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Data Siswa
                </Link>
                .
              </p>
            ) : (
              <table className="w-full min-w-[360px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">No</th>
                    <th className="pb-2 pr-3 font-medium">Nama Siswa</th>
                    <th className="pb-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {siswaList.map((siswa, index) => (
                    <tr key={siswa.id} className="border-b last:border-0">
                      <td className="py-2.5 pr-3 tabular-nums text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="py-2.5 pr-3 font-medium">
                        {siswa.nama_siswa}
                      </td>
                      <td className="py-2.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="min-h-9"
                          onClick={() => setPreviewSiswa(siswa)}
                        >
                          <Eye className="mr-1 size-4" />
                          Rapor
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {previewSiswa && kelasId && (
        <RaporPreviewDialog
          open={Boolean(previewSiswa)}
          onOpenChange={(o) => !o && setPreviewSiswa(null)}
          siswa={previewSiswa}
          kelasId={kelasId}
          semester={semester}
          tahunAjaran={tahunAjaran}
          watermarkLogo={watermarkLogo}
          onWatermarkLogoChange={setWatermarkLogo}
          hasLogo={Boolean(pengaturan?.logo_url)}
        />
      )}

      {kelasId && (
        <BulkRaporPrintDialog
          open={bulkPrintOpen}
          onOpenChange={setBulkPrintOpen}
          siswaList={siswaList}
          kelasId={kelasId}
          semester={semester}
          tahunAjaran={tahunAjaran}
          templateId={templateId}
          watermarkLogo={watermarkLogo}
          kelasNama={selectedKelas?.nama_kelas}
        />
      )}
    </div>
  );
}
