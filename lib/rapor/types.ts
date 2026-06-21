import type { ERaporPreviewData } from "@/lib/services/e-rapor";
import type { SemesterGanjilViewModel } from "@/lib/rapor/build-view-model";

export type RaporTemplateId = "km-default" | "semester-ganjil-man";

export interface RaporRenderOptions {
  watermarkLogo: boolean;
  printMode?: boolean;
  /** false = jangan set id rapor-print-root (untuk cetak massal) */
  printRoot?: boolean;
  pageNumber?: number;
  totalPages?: number;
}

export interface RaporTemplateProps {
  data: ERaporPreviewData;
  viewModel?: SemesterGanjilViewModel;
  options: RaporRenderOptions;
}

export interface RaporTemplateMeta {
  id: RaporTemplateId;
  label: string;
  description: string;
}

export interface RaporRendererProps {
  data: ERaporPreviewData;
  templateId: RaporTemplateId;
  watermarkLogo?: boolean;
  printMode?: boolean;
}

export const DEFAULT_RAPOR_TEMPLATE_ID: RaporTemplateId = "semester-ganjil-man";

export function isRaporTemplateId(value: string): value is RaporTemplateId {
  return value === "km-default" || value === "semester-ganjil-man";
}

export function parseRaporTemplateId(
  value: string | null | undefined,
): RaporTemplateId {
  if (value === "semester-ganjil-man") return "semester-ganjil-man";
  if (value === "km-default") return "km-default";
  return DEFAULT_RAPOR_TEMPLATE_ID;
}
