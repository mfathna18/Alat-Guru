import type { ERaporExportOptions } from "@/lib/export/e-rapor-pdf";
import { buildSemesterGanjilManWord } from "@/lib/export/rapor/semester-ganjil-man-word";
import type { RaporWordBuildResult, RaporWordBuilder } from "@/lib/export/rapor/word-types";
import {
  DEFAULT_RAPOR_TEMPLATE_ID,
  parseRaporTemplateId,
  type RaporTemplateId,
} from "@/lib/rapor/types";
import type { ERaporPreviewData } from "@/lib/services/e-rapor";

const WORD_BUILDERS: Record<RaporTemplateId, RaporWordBuilder> = {
  "km-default": async () => {
    throw new Error("Export Word belum tersedia untuk template Kurikulum Merdeka.");
  },
  "semester-ganjil-man": buildSemesterGanjilManWord,
};

export async function buildRaporWordByTemplate(
  data: ERaporPreviewData,
  options: ERaporExportOptions = {},
): Promise<RaporWordBuildResult> {
  const templateId = parseRaporTemplateId(
    options.templateId ??
      data.pengaturan?.rapor_template_id ??
      DEFAULT_RAPOR_TEMPLATE_ID,
  );

  const builder = WORD_BUILDERS[templateId] ?? WORD_BUILDERS["semester-ganjil-man"];
  return builder(data, options);
}
