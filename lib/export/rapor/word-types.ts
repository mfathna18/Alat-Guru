import type { ERaporExportOptions } from "@/lib/export/e-rapor-pdf";
import type { ERaporPreviewData } from "@/lib/services/e-rapor";

export interface RaporWordBuildResult {
  filename: string;
  blob: Blob;
}

export type RaporWordBuilder = (
  data: ERaporPreviewData,
  options: ERaporExportOptions,
) => Promise<RaporWordBuildResult>;
