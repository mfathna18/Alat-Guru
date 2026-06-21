"use client";

import * as React from "react";
import { Download, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  downloadPdfBlob,
  printPdfBlob,
  type PdfBlobResult,
} from "@/lib/export/pdf-utils";

export interface PdfPreviewRequest {
  title: string;
  description?: string;
  /** Sembunyikan tombol cetak (mis. sudah ada cetak di layar sebelumnya) */
  hidePrint?: boolean;
  generate: () => Promise<PdfBlobResult>;
}

interface PdfPreviewDialogProps {
  request: PdfPreviewRequest | null;
  onClose: () => void;
}

export function PdfPreviewDialog({ request, onClose }: PdfPreviewDialogProps) {
  const open = Boolean(request);
  const [loading, setLoading] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [filename, setFilename] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const blobRef = React.useRef<Blob | null>(null);

  React.useEffect(() => {
    if (!open || !request) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      blobRef.current = null;
      setFilename("");
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void request
      .generate()
      .then(({ blob, filename: fn }) => {
        if (cancelled) return;
        blobRef.current = blob;
        setFilename(fn);
        setPreviewUrl(URL.createObjectURL(blob));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Gagal membuat preview.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, request]);

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleDownload() {
    if (!blobRef.current) return;
    downloadPdfBlob(blobRef.current, filename);
    toast.success("PDF diunduh");
  }

  function handlePrint() {
    if (!blobRef.current) return;
    try {
      printPdfBlob(blobRef.current);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mencetak");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[92vh] w-full flex-col gap-3 sm:max-w-[min(96vw,75rem)]">
        <DialogHeader>
          <DialogTitle>{request?.title ?? "Preview PDF"}</DialogTitle>
          {request?.description && (
            <DialogDescription>{request.description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="flex flex-wrap gap-2 print:hidden">
          {!request?.hidePrint && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-9"
              disabled={loading || !previewUrl}
              onClick={handlePrint}
            >
              <Printer className="mr-2 size-4" />
              Cetak
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            className="min-h-9"
            disabled={loading || !previewUrl}
            onClick={handleDownload}
          >
            <Download className="mr-2 size-4" />
            Unduh PDF
          </Button>
        </div>

        <div className="min-h-[480px] flex-1 overflow-hidden rounded-lg border bg-muted/30">
          {loading && (
            <div className="flex h-[min(75vh,640px)] items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 size-5 animate-spin" />
              Menyiapkan preview…
            </div>
          )}
          {error && (
            <div className="flex h-[min(75vh,640px)] items-center justify-center p-4 text-sm text-destructive">
              {error}
            </div>
          )}
          {!loading && !error && previewUrl && (
            <iframe
              title={request?.title ?? "Preview PDF"}
              src={previewUrl}
              className="h-[min(75vh,640px)] w-full bg-white"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function usePdfPreview() {
  const [request, setRequest] = React.useState<PdfPreviewRequest | null>(null);

  const dialog = (
    <PdfPreviewDialog request={request} onClose={() => setRequest(null)} />
  );

  return { showPdfPreview: setRequest, pdfPreviewDialog: dialog };
}
