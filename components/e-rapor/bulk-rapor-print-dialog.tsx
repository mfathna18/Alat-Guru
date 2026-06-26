"use client";

import * as React from "react";
import { Archive, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";

import { RaporPreviewSkeleton } from "@/components/e-rapor/rapor-loading-skeleton";
import {
  RaporPreviewViewport,
  RaporPreviewZoomToolbar,
  useRaporPreviewZoom,
} from "@/components/e-rapor/rapor-preview-viewport";
import { RaporRenderer } from "@/components/rapor/rapor-renderer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  buildKelasRaporZipBlob,
  downloadBlob,
} from "@/lib/export/rapor/bulk-kelas-zip";
import { fetchERaporPreview } from "@/lib/services/e-rapor";
import { printRaporElement } from "@/lib/export/rapor/html-capture-pdf";
import { semesterLabel } from "@/lib/rapor/semester-labels";
import type { RaporTemplateId } from "@/lib/rapor/types";
import type { Siswa } from "@/lib/types/database";
import { getErrorMessage } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface BulkRaporPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siswaList: Siswa[];
  kelasId: number;
  semester: 1 | 2;
  tahunAjaran: string;
  templateId: RaporTemplateId;
  watermarkLogo: boolean;
  kelasNama?: string;
}

export function BulkRaporPrintDialog({
  open,
  onOpenChange,
  siswaList,
  kelasId,
  semester,
  tahunAjaran,
  templateId,
  watermarkLogo,
  kelasNama,
}: BulkRaporPrintDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const bulkRootRef = React.useRef<HTMLDivElement>(null);
  const [previews, setPreviews] = React.useState<
    Awaited<ReturnType<typeof fetchERaporPreview>>[]
  >([]);
  const [error, setError] = React.useState<string | null>(null);
  const [zipBusy, setZipBusy] = React.useState(false);
  const [zipProgress, setZipProgress] = React.useState<string | null>(null);
  const [printBusy, setPrintBusy] = React.useState(false);
  const { zoom, zoomIn, zoomOut, resetZoom, setZoom } = useRaporPreviewZoom();

  React.useEffect(() => {
    if (!open) setZoom(100);
  }, [open, setZoom]);

  React.useEffect(() => {
    if (!open) {
      setPreviews([]);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const chunkSize = 4;
        const rows: Awaited<ReturnType<typeof fetchERaporPreview>>[] = [];
        for (let i = 0; i < siswaList.length; i += chunkSize) {
          const chunk = siswaList.slice(i, i + chunkSize);
          const batch = await Promise.all(
            chunk.map((s) =>
              fetchERaporPreview(s.id, kelasId, semester, tahunAjaran),
            ),
          );
          rows.push(...batch);
          if (cancelled) return;
        }
        if (!cancelled) setPreviews(rows);
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Gagal memuat rapor kelas."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, siswaList, kelasId, semester, tahunAjaran]);

  async function handlePrint() {
    if (previews.length === 0 || printBusy) return;
    const root = bulkRootRef.current?.querySelector(
      "#rapor-print-root",
    ) as HTMLElement | null;
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

  async function handleDownloadZip() {
    if (siswaList.length === 0) return;
    setZipBusy(true);
    setZipProgress(null);
    const toastId = toast.loading("Menyiapkan ZIP PDF…");
    try {
      const { blob, filename } = await buildKelasRaporZipBlob(
        siswaList,
        kelasId,
        semester,
        tahunAjaran,
        { templateId, watermarkLogo },
        (p) => {
          setZipProgress(
            p.currentName
              ? `${p.done + 1}/${p.total} · ${p.currentName}`
              : `${p.done}/${p.total}`,
          );
        },
      );
      downloadBlob(blob, filename);
      toast.success(`ZIP berisi ${siswaList.length} rapor PDF.`, { id: toastId });
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal membuat ZIP PDF."), { id: toastId });
    } finally {
      setZipBusy(false);
      setZipProgress(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-full flex-col gap-4 overflow-y-auto sm:max-w-[min(96vw,75rem)] print:max-h-none print:max-w-none print:overflow-visible print:border-0 print:p-0 print:shadow-none">
        <DialogHeader className="print:hidden">
          <DialogTitle>
            Cetak Rapor Kelas {kelasNama ?? ""}
          </DialogTitle>
          <DialogDescription>
            Semester {semesterLabel(semester)} · {tahunAjaran} ·{" "}
            {siswaList.length} siswa
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            disabled={loading || previews.length === 0 || printBusy}
            onClick={() => void handlePrint()}
          >
            <Printer className="mr-2 size-4" />
            {printBusy ? "Menyiapkan…" : `Cetak Semua (${previews.length})`}
          </Button>
          <RaporPreviewZoomToolbar
            zoom={zoom}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onReset={resetZoom}
            disabled={loading || previews.length === 0}
          />
          <Button
            variant="secondary"
            size="sm"
            disabled={loading || zipBusy || siswaList.length === 0}
            onClick={() => void handleDownloadZip()}
          >
            {zipBusy ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Archive className="mr-2 size-4" />
            )}
            Unduh ZIP PDF
          </Button>
          {zipProgress && (
            <span className="text-xs text-muted-foreground">{zipProgress}</span>
          )}
        </div>

        {loading && (
          <div className="space-y-4 print:hidden">
            <p className="text-sm text-muted-foreground">
              Memuat rapor siswa…
            </p>
            <RaporPreviewSkeleton />
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive print:hidden">{error}</p>
        )}

        {previews.length > 0 && (
          <RaporPreviewViewport zoom={zoom} containerRef={bulkRootRef}>
            <div id="rapor-print-root" className="space-y-4 print:space-y-0">
            {previews.map((data) => (
              <div key={data.siswa.id} className="rapor-bulk-student">
                <RaporRenderer
                  data={data}
                  templateId={templateId}
                  watermarkLogo={watermarkLogo}
                  printRoot={false}
                />
              </div>
            ))}
            </div>
          </RaporPreviewViewport>
        )}

        {!loading && previews.length === 0 && !error && open && (
          <p className="text-sm text-muted-foreground print:hidden">
            Tidak ada siswa untuk dicetak.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
