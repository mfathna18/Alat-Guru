import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function RaporPreviewSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rapor-a4 mx-auto space-y-4 rounded-lg border bg-white p-8",
        className,
      )}
    >
      <div className="space-y-2 text-center">
        <Skeleton className="mx-auto h-14 w-14 rounded-full" />
        <Skeleton className="mx-auto h-4 w-48" />
        <Skeleton className="mx-auto h-5 w-64" />
        <Skeleton className="mx-auto h-3 w-40" />
      </div>
      <div className="grid grid-cols-2 gap-3 pt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>
      <Skeleton className="h-8 w-full" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    </div>
  );
}

export function RaporRekapTableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="overflow-hidden rounded-md border">
        <div className="flex gap-4 border-b bg-muted/40 px-3 py-2">
          {["Siswa", "Fmt", "STS", "SAS", "NA", "Pred", "Desk"].map((h) => (
            <Skeleton key={h} className="h-3 w-12 shrink-0" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, row) => (
          <div
            key={row}
            className="flex items-center gap-4 border-b px-3 py-3 last:border-0"
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
