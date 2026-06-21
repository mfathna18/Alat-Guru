"use client";

import * as React from "react";
import {
  ArrowRight,
  FileText,
  Loader2,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { usePdfPreview } from "@/components/export/pdf-preview-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { intervensiPdfBlob } from "@/lib/export/intervensi-pdf";
import type { IntervensiAnalysis } from "@/lib/nilai/ketuntasan";
import type { KkmConfig } from "@/lib/nilai/kkm-config";
import type { JenisAsesmen } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface IntervensiPanelProps {
  analysis: IntervensiAnalysis;
  kkm: KkmConfig;
  kelasNama?: string;
  semester: 1 | 2;
  onOpenRemedial: () => void;
  onOpenPengayaan: () => void;
  pengaturan?: {
    nama_sekolah: string;
    tahun_ajaran: string;
    logo_url: string | null;
  } | null;
  guruNama?: string;
}

export function IntervensiPanel({
  analysis,
  kkm,
  kelasNama,
  semester,
  onOpenRemedial,
  onOpenPengayaan,
  pengaturan,
  guruNama,
}: IntervensiPanelProps) {
  const [previewLoading, setPreviewLoading] = React.useState<
    "remedial" | "pengayaan" | null
  >(null);
  const { showPdfPreview, pdfPreviewDialog } = usePdfPreview();

  const hasScores = analysis.totalScoredCells > 0;

  function previewPdf(jenis: "remedial" | "pengayaan") {
    setPreviewLoading(jenis);
    try {
      const input = {
        jenis,
        analysis,
        kkm,
        kelasNama: kelasNama ?? "Kelas",
        semester,
        pengaturan: pengaturan ?? null,
        guruNama,
      };
      showPdfPreview({
        title: jenis === "remedial" ? "Daftar Remedial" : "Daftar Pengayaan",
        description: `${kelasNama ?? "Kelas"} · Semester ${semester}`,
        generate: () => intervensiPdfBlob(input),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyiapkan preview");
    } finally {
      setPreviewLoading(null);
    }
  }

  return (
    <Card className="border-primary/20 bg-primary/[0.02]">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" />
              Tindak Lanjut Otomatis
            </CardTitle>
            <CardDescription className="mt-1">
              Berdasarkan nilai <strong>Sumatif</strong> · KKM {kkm.kkmAngka} ·
              Pengayaan &gt; {kkm.ambangPengayaanAngka}
              {!hasScores && " · Belum ada nilai sumatif diinput"}
            </CardDescription>
          </div>
          {hasScores && (
            <Badge variant="outline" className="shrink-0">
              {analysis.tuntas.length} tuntas · {analysis.belumDinilai.length}{" "}
              belum dinilai
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <IntervensiList
            variant="remedial"
            title="Daftar Remedial"
            description="Nilai di bawah KKM — perlu ujian perbaikan"
            items={analysis.remedial}
            onOpen={onOpenRemedial}
            onExport={() => previewPdf("remedial")}
            exporting={previewLoading === "remedial"}
          />
          <IntervensiList
            variant="pengayaan"
            title="Daftar Pengayaan"
            description="Nilai di atas ambang — siap kegiatan pengayaan"
            items={analysis.pengayaan}
            onOpen={onOpenPengayaan}
            onExport={() => previewPdf("pengayaan")}
            exporting={previewLoading === "pengayaan"}
          />
        </div>
      </CardContent>
      {pdfPreviewDialog}
    </Card>
  );
}

function IntervensiList({
  variant,
  title,
  description,
  items,
  onOpen,
  onExport,
  exporting,
}: {
  variant: "remedial" | "pengayaan";
  title: string;
  description: string;
  items: IntervensiAnalysis["remedial"];
  onOpen: () => void;
  onExport: () => void;
  exporting: boolean;
}) {
  const isRemedial = variant === "remedial";
  const Icon = isRemedial ? TrendingDown : TrendingUp;

  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        isRemedial
          ? "border-rose-200 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20"
          : "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20",
      )}
    >
      <div className="mb-3">
        <h3 className="flex items-center gap-1.5 font-semibold">
          <Icon
            className={cn(
              "size-4",
              isRemedial ? "text-rose-600" : "text-emerald-600",
            )}
          />
          {title}
          <Badge
            variant="secondary"
            className={cn(
              "ml-1 font-normal",
              isRemedial && "bg-rose-100 text-rose-800 dark:bg-rose-900/40",
              !isRemedial &&
                "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40",
            )}
          >
            {items.length}
          </Badge>
        </h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          {isRemedial
            ? "Belum ada siswa di bawah KKM."
            : "Belum ada siswa di atas ambang pengayaan."}
        </p>
      ) : (
        <ol className="mb-4 max-h-48 space-y-2 overflow-y-auto text-sm">
          {items.map((entry, i) => (
            <li
              key={entry.siswa.id}
              className="rounded-lg border bg-background/80 px-3 py-2"
            >
              <div className="flex items-start justify-between gap-2">
                <span>
                  <span className="text-muted-foreground">{i + 1}. </span>
                  <span className="font-medium">{entry.siswa.nama_siswa}</span>
                </span>
                {entry.rataRata != null && (
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    ~{Math.round(entry.rataRata)}
                  </Badge>
                )}
              </div>
              {isRemedial && entry.indikatorRemedial.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Indikator:{" "}
                  {entry.indikatorRemedial
                    .map(
                      (ind) =>
                        `${ind.kodeTp}/${ind.kodeIndikator} (${ind.display})`,
                    )
                    .join(", ")}
                </p>
              )}
              {!isRemedial && entry.indikatorPengayaan.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Semua indikator di atas ambang (
                  {entry.indikatorPengayaan.length} indikator)
                </p>
              )}
            </li>
          ))}
        </ol>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          className={cn(
            "min-h-9 flex-1",
            isRemedial &&
              "bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600",
            !isRemedial &&
              "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600",
          )}
          disabled={items.length === 0}
          onClick={onOpen}
        >
          Isi Nilai {isRemedial ? "Remedial" : "Pengayaan"}
          <ArrowRight className="ml-1.5 size-3.5" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="min-h-9"
          disabled={items.length === 0 || exporting}
          onClick={onExport}
        >
          {exporting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <FileText className="size-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}

export function intervensiEmptyMessage(jenis: JenisAsesmen): string | null {
  if (jenis === "REMEDIAL") {
    return "Belum ada siswa di daftar remedial. Input nilai sumatif terlebih dahulu — siswa di bawah KKM akan muncul otomatis.";
  }
  if (jenis === "PENGAYAAN") {
    return "Belum ada siswa di daftar pengayaan. Input nilai sumatif terlebih dahulu — siswa di atas ambang pengayaan akan muncul otomatis.";
  }
  return null;
}
