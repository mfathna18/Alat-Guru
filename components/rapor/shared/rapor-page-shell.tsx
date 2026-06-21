import type { ReactNode } from "react";

import { RaporWatermark } from "@/components/rapor/shared/rapor-watermark";
import { cn } from "@/lib/utils";

interface RaporPageShellProps {
  watermarkLogo?: boolean;
  logoUrl?: string | null;
  printMode?: boolean;
  printRoot?: boolean;
  printPage?: boolean;
  children: ReactNode;
  className?: string;
}

export function RaporPageShell({
  watermarkLogo = false,
  logoUrl,
  printMode = false,
  printRoot = true,
  printPage = false,
  children,
  className,
}: RaporPageShellProps) {
  const showWatermark = watermarkLogo && !!logoUrl;

  return (
    <article
      id={printRoot ? "rapor-print-root" : undefined}
      className={cn(
        "rapor-a4 relative mx-auto bg-white text-black",
        printPage && "rapor-print-page",
        printMode
          ? "overflow-visible shadow-none"
          : !printRoot
            ? "overflow-visible rounded-lg border shadow-sm"
            : "max-w-[210mm] overflow-visible shadow-sm",
        printRoot && !printMode && "max-w-[210mm]",
        className,
      )}
    >
      {showWatermark && (
        <RaporWatermark enabled={watermarkLogo} logoUrl={logoUrl} />
      )}
      <div className={showWatermark ? "relative z-[1]" : undefined}>{children}</div>
    </article>
  );
}
