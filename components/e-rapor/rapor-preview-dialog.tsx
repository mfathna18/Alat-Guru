"use client";

import * as React from "react";
import { ImageIcon, AlertTriangle, Printer } from "lucide-react";

import { toast } from "sonner";

import { RaporRenderer } from "@/components/rapor/rapor-renderer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { RaporPreviewSkeleton } from "@/components/e-rapor/rapor-loading-skeleton";
import {
  RaporPreviewViewport,
  RaporPreviewZoomToolbar,
  useRaporPreviewZoom,
} from "@/components/e-rapor/rapor-preview-viewport";
import { printRaporElement } from "@/lib/export/rapor/html-capture-pdf";
import { useERaporPreview } from "@/lib/hooks/use-e-rapor";
import type { RaporPreviewSource } from "@/lib/services/e-rapor";
import { analyzeNaCompleteness } from "@/lib/e-rapor/na-completeness";
import { DEFAULT_BOBOT } from "@/lib/e-rapor/nilai-akhir";
import { semesterLabel } from "@/lib/rapor/semester-labels";
import { DEFAULT_RAPOR_TEMPLATE_ID } from "@/lib/rapor/types";
import type { Siswa } from "@/lib/types/database";

const TEMPLATE_ID = DEFAULT_RAPOR_TEMPLATE_ID;

interface RaporPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siswa: Siswa;
  kelasId: number;
  semester: 1 | 2;
  tahunAjaran: string;
  watermarkLogo: boolean;
  onWatermarkLogoChange: (value: boolean) => void;
  hasLogo: boolean;
}

export function RaporPreviewDialog({
  open,
  onOpenChange,
  siswa,
  kelasId,
  semester,
  tahunAjaran,
  watermarkLogo,
  onWatermarkLogoChange,
  hasLogo,
}: RaporPreviewDialogProps) {
  const { data, isLoading, error } = useERaporPreview(
    siswa.id,
    kelasId,
    semester,
    tahunAjaran,
    open,
  );
  const raporContainerRef = React.useRef<HTMLDivElement>(null);
  const [printBusy, setPrintBusy] = React.useState(false);
  const { zoom, zoomIn, zoomOut, resetZoom, setZoom } = useRaporPreviewZoom();

  React.useEffect(() => {
    if (!open) setZoom(100);
  }, [open, setZoom]);

  function getRaporRoot(): HTMLElement | null {
    return raporContainerRef.current?.querySelector(
      "#rapor-print-root",
    ) as HTMLElement | null;
  }

  const partialNaCount = React.useMemo(() => {
    if (!data) return 0;
    const bobot = {
      formatif: data.pengaturan?.bobot_formatif ?? DEFAULT_BOBOT.formatif,
      sumatifLm: data.pengaturan?.bobot_sumatif_lm ?? DEFAULT_BOBOT.sumatifLm,
      sas: data.pengaturan?.bobot_sas ?? DEFAULT_BOBOT.sas,
    };
    return data.raporMapel.filter(
      (row) => analyzeNaCompleteness(row, bobot).isPartial,
    ).length;
  }, [data]);

  async function handlePrint() {
    if (!data || printBusy) return;
    const root = getRaporRoot();
    if (!root) {
      toast.error("Rapor belum siap. Tunggu sebentar lalu coba lagi.");
      return;
    }
    setPrintBusy(true);
    try {
      await printRaporElement(root, { contentScale: 1 });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal membuka dialog cetak.",
      );
    } finally {
      setPrintBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-full flex-col gap-4 overflow-y-auto sm:max-w-[min(96vw,75rem)] print:max-h-none print:max-w-none print:overflow-visible print:border-0 print:p-0 print:shadow-none">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex flex-wrap items-center gap-2">
            Rapor — {siswa.nama_siswa}
            {data?.raporMapelSource && (
              <RaporSourceBadge source={data.raporMapelSource} />
            )}
          </DialogTitle>
          <DialogDescription>
            Rapor Semester · Semester {semesterLabel(semester)} · {tahunAjaran}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="min-h-9"
              disabled={!data || isLoading || printBusy}
              onClick={() => void handlePrint()}
            >
              <Printer className="mr-2 size-4" />
              {printBusy ? "Menyiapkan…" : "Cetak"}
            </Button>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <RaporPreviewZoomToolbar
                zoom={zoom}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onReset={resetZoom}
                disabled={!data || isLoading}
              />

              <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-2 py-1">
                <ImageIcon className="size-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Watermark logo
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant={watermarkLogo ? "default" : "outline"}
                  className="h-7 px-2 text-xs"
                  disabled={!hasLogo}
                  onClick={() => onWatermarkLogoChange(true)}
                >
                  Ya
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={!watermarkLogo ? "default" : "outline"}
                  className="h-7 px-2 text-xs"
                  onClick={() => onWatermarkLogoChange(false)}
                >
                  Tidak
                </Button>
              </div>
            </div>
          </div>
        </div>

        {!hasLogo && (
          <p className="text-xs text-muted-foreground print:hidden">
            Unggah logo sekolah di Pengaturan untuk mengaktifkan watermark.
          </p>
        )}

        {partialNaCount > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-amber-700 print:hidden dark:text-amber-500">
            <AlertTriangle className="size-3.5 shrink-0" />
            {partialNaCount} mapel memiliki NA parsial (bobot di-renormalisasi
            karena ada komponen kosong).
          </p>
        )}

        {isLoading && <RaporPreviewSkeleton />}

        {error && (
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Gagal memuat rapor."}
          </p>
        )}

        {data && (
          <RaporPreviewViewport zoom={zoom} containerRef={raporContainerRef}>
            <RaporRenderer
              data={data}
              templateId={TEMPLATE_ID}
              watermarkLogo={watermarkLogo}
            />
          </RaporPreviewViewport>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RaporSourceBadge({ source }: { source: RaporPreviewSource }) {
  if (source === "empty") return null;

  const label =
    source === "computed"
      ? "Nilai live"
      : source === "stored"
        ? "Data tersimpan"
        : "Live + tersimpan";

  const variant =
    source === "computed"
      ? "default"
      : source === "stored"
        ? "secondary"
        : "outline";

  return (
    <Badge variant={variant} className="text-[10px] font-normal">
      {label}
    </Badge>
  );
}
