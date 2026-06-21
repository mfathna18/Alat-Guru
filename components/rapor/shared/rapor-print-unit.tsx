import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface RaporPrintUnitProps {
  children: ReactNode;
  className?: string;
}

/** Satu lembar/unit cetak — skala & page-break terisolasi per unit. */
export function RaporPrintUnit({ children, className }: RaporPrintUnitProps) {
  return (
    <section className={cn("rapor-print-unit", className)}>
      <div className="rapor-content-scale-outer">
        <div className="rapor-content-inner">{children}</div>
      </div>
    </section>
  );
}
