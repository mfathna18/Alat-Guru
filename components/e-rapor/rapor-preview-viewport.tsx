"use client";

import * as React from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const RAPOR_PREVIEW_ZOOM_MIN = 50;
export const RAPOR_PREVIEW_ZOOM_MAX = 150;
export const RAPOR_PREVIEW_ZOOM_STEP = 10;
export const RAPOR_PREVIEW_ZOOM_DEFAULT = 100;

/** Lebar referensi konten A4 di layar (px). */
export const RAPOR_PREVIEW_A4_PX = 756;

export function useRaporPreviewAutoFit(
  containerRef: React.RefObject<HTMLDivElement | null>,
  enabled: boolean,
  setZoom: (value: number) => void,
) {
  const userAdjustedRef = React.useRef(false);

  React.useEffect(() => {
    if (!enabled) {
      userAdjustedRef.current = false;
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    const applyFit = () => {
      if (userAdjustedRef.current) return;
      const width = el.clientWidth;
      if (width <= 0 || width >= RAPOR_PREVIEW_A4_PX) return;
      const fit = Math.max(
        RAPOR_PREVIEW_ZOOM_MIN,
        Math.min(RAPOR_PREVIEW_ZOOM_DEFAULT, Math.floor((width / RAPOR_PREVIEW_A4_PX) * 100)),
      );
      setZoom(fit);
    };

    applyFit();
    const observer = new ResizeObserver(applyFit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef, enabled, setZoom]);

  const markUserAdjusted = React.useCallback(() => {
    userAdjustedRef.current = true;
  }, []);

  return { markUserAdjusted };
}

export function useRaporPreviewZoom(initial = RAPOR_PREVIEW_ZOOM_DEFAULT) {
  const [zoom, setZoom] = React.useState(initial);

  const zoomIn = React.useCallback(() => {
    setZoom((value) => Math.min(RAPOR_PREVIEW_ZOOM_MAX, value + RAPOR_PREVIEW_ZOOM_STEP));
  }, []);

  const zoomOut = React.useCallback(() => {
    setZoom((value) => Math.max(RAPOR_PREVIEW_ZOOM_MIN, value - RAPOR_PREVIEW_ZOOM_STEP));
  }, []);

  const resetZoom = React.useCallback(() => {
    setZoom(RAPOR_PREVIEW_ZOOM_DEFAULT);
  }, []);

  return { zoom, setZoom, zoomIn, zoomOut, resetZoom };
}

interface RaporPreviewZoomToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  disabled?: boolean;
  className?: string;
}

export function RaporPreviewZoomToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  disabled = false,
  className,
}: RaporPreviewZoomToolbarProps) {
  const atMin = zoom <= RAPOR_PREVIEW_ZOOM_MIN;
  const atMax = zoom >= RAPOR_PREVIEW_ZOOM_MAX;
  const atDefault = zoom === RAPOR_PREVIEW_ZOOM_DEFAULT;

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-lg border bg-muted/30 px-1.5 py-1 print:hidden",
        className,
      )}
      role="group"
      aria-label="Ukuran isi konten rapor"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        disabled={disabled || atMin}
        onClick={onZoomOut}
        aria-label="Perkecil isi konten"
      >
        <Minus className="size-3.5" />
      </Button>
      <span className="min-w-10 text-center text-xs tabular-nums text-muted-foreground">
        {zoom}%
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        disabled={disabled || atMax}
        onClick={onZoomIn}
        aria-label="Perbesar isi konten"
      >
        <Plus className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        disabled={disabled || atDefault}
        onClick={onReset}
      >
        <RotateCcw className="mr-1 size-3" />
        Reset
      </Button>
    </div>
  );
}

interface RaporPreviewViewportProps {
  zoom: number;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
  className?: string;
}

/** Mengatur skala isi konten rapor di pratinjau — ukuran kertas A4 tetap. */
export function RaporPreviewViewport({
  zoom,
  containerRef,
  children,
  className,
}: RaporPreviewViewportProps) {
  const contentScale = zoom / 100;

  return (
    <div
      ref={containerRef}
      className={cn(
        "rapor-preview-viewport max-w-full overflow-x-auto overflow-y-visible py-1 [-webkit-overflow-scrolling:touch]",
        className,
      )}
    >
      <div
        className="rapor-preview-content mx-auto w-[210mm] min-w-[210mm] max-w-[210mm]"
        style={
          { "--rapor-content-scale": contentScale } as React.CSSProperties
        }
      >
        {children}
      </div>
    </div>
  );
}
