"use client";

import { AlertTriangle } from "lucide-react";

import { analyzeNaCompleteness } from "@/lib/e-rapor/na-completeness";
import type { BobotNa } from "@/lib/e-rapor/nilai-akhir";
import { cn } from "@/lib/utils";

interface NaPartialHintProps {
  scores: {
    nilai_formatif: number | null;
    nilai_sumatif_lm: number | null;
    nilai_sas: number | null;
    nilai_akhir: number | null;
  };
  bobot?: BobotNa;
  className?: string;
}

export function NaPartialHint({ scores, bobot, className }: NaPartialHintProps) {
  const info = analyzeNaCompleteness(scores, bobot);
  if (!info.isPartial || !info.message) return null;

  return (
    <span
      title={info.message}
      className={cn(
        "inline-flex cursor-help text-amber-600 dark:text-amber-500",
        className,
      )}
      aria-label={info.message}
    >
      <AlertTriangle className="size-3.5 shrink-0" />
    </span>
  );
}
