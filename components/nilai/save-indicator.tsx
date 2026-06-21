import { AlertCircle, Check, Loader2 } from "lucide-react";

import type { CellSaveStatus } from "@/lib/nilai/spreadsheet-nav";
import { cn } from "@/lib/utils";

interface SaveIndicatorProps {
  status: CellSaveStatus;
  errorMessage?: string;
}

export function SaveIndicator({ status, errorMessage }: SaveIndicatorProps) {
  if (status === "idle") return null;

  const title =
    status === "saved"
      ? "Tersimpan"
      : status === "saving"
        ? "Menyimpan…"
        : errorMessage ?? "Gagal menyimpan nilai";

  return (
    <span
      className={cn(
        "pointer-events-none absolute right-1 top-1/2 -translate-y-1/2",
        status === "saved" && "text-emerald-600",
        status === "error" && "text-destructive",
        status === "saving" && "text-muted-foreground",
      )}
      title={title}
      aria-label={title}
    >
      {status === "saving" && <Loader2 className="size-3 animate-spin" />}
      {status === "saved" && <Check className="size-3" />}
      {status === "error" && <AlertCircle className="size-3" />}
    </span>
  );
}
