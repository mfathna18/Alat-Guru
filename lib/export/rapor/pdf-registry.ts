import type { ERaporExportOptions } from "@/lib/export/e-rapor-pdf";
import { buildKmDefaultPdf } from "@/lib/export/rapor/km-default-pdf";
import { buildSemesterGanjilManPdf } from "@/lib/export/rapor/semester-ganjil-man-pdf";
import type { RaporPdfBuildResult, RaporPdfBuilder } from "@/lib/export/rapor/pdf-types";
import {
  DEFAULT_RAPOR_TEMPLATE_ID,
  parseRaporTemplateId,
  type RaporTemplateId,
} from "@/lib/rapor/types";
import type { ERaporPreviewData } from "@/lib/services/e-rapor";

const PDF_BUILDERS: Record<RaporTemplateId, RaporPdfBuilder> = {
  "km-default": buildKmDefaultPdf,
  "semester-ganjil-man": buildSemesterGanjilManPdf,
};

export async function buildRaporPdfByTemplate(
  data: ERaporPreviewData,
  options: ERaporExportOptions = {},
): Promise<RaporPdfBuildResult> {
  const templateId = parseRaporTemplateId(
    options.templateId ??
      data.pengaturan?.rapor_template_id ??
      DEFAULT_RAPOR_TEMPLATE_ID,
  );

  const builder = PDF_BUILDERS[templateId] ?? PDF_BUILDERS["km-default"];
  return builder(data, options);
}
