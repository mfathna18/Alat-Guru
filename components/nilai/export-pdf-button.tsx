"use client";

import * as React from "react";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { usePdfPreview } from "@/components/export/pdf-preview-dialog";
import { Button } from "@/components/ui/button";
import { rekapPdfBlob } from "@/lib/export/rekap-pdf";
import { jenisAsesmenLabel } from "@/lib/export/format-nilai";
import { fetchRekapExportData } from "@/lib/services/export";
import type { JenisAsesmen } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface ExportPdfButtonProps {
  kelasId: number | null;
  kelasNama?: string;
  mapelId: number | null;
  mapelNama?: string;
  defaultMapelId?: number | null;
  semester: 1 | 2;
  jenisAsesmen: JenisAsesmen;
  disabled?: boolean;
  className?: string;
}

export function ExportPdfButton({
  kelasId,
  kelasNama,
  mapelId,
  mapelNama,
  defaultMapelId,
  semester,
  jenisAsesmen,
  disabled,
  className,
}: ExportPdfButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const { showPdfPreview, pdfPreviewDialog } = usePdfPreview();

  async function handlePreview() {
    if (!kelasId || !kelasNama) {
      toast.error("Pilih kelas terlebih dahulu.");
      return;
    }
    if (!mapelId) {
      toast.error("Pilih mata pelajaran terlebih dahulu.");
      return;
    }

    setLoading(true);
    try {
      const data = await fetchRekapExportData(
        kelasId,
        kelasNama,
        semester,
        jenisAsesmen,
        mapelId,
        defaultMapelId,
      );

      if (!data.pengaturan) {
        toast.warning(
          "Profil sekolah belum lengkap. PDF tetap dibuat dengan placeholder.",
        );
      }

      if (data.workspace.siswa.length === 0) {
        toast.error("Tidak ada siswa untuk diekspor.");
        return;
      }

      if (data.workspace.indikator.length === 0) {
        toast.error("Tidak ada indikator. Atur TP terlebih dahulu.");
        return;
      }

      showPdfPreview({
        title: `Rekap ${jenisAsesmenLabel(jenisAsesmen)}`,
        description: `${kelasNama} · ${data.mapelNama} · Semester ${semester}`,
        generate: () => rekapPdfBlob(data),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyiapkan preview");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={cn("min-h-11 gap-2", className)}
        disabled={disabled || loading || !kelasId || !mapelId}
        onClick={() => void handlePreview()}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <FileText className="size-4" />
        )}
        Preview PDF
      </Button>
      {pdfPreviewDialog}
    </>
  );
}
