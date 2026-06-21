import type { ComponentType } from "react";

import { KmDefaultTemplate } from "@/components/rapor/templates/km-default/km-default-template";
import { SemesterGanjilManTemplate } from "@/components/rapor/templates/semester-ganjil-man/semester-ganjil-man-template";
import { SEMESTER_GANJIL_TEMPLATE_META } from "@/lib/rapor/semester-ganjil-template";
import type {
  RaporTemplateId,
  RaporTemplateMeta,
  RaporTemplateProps,
} from "@/lib/rapor/types";

export interface RaporTemplateDefinition extends RaporTemplateMeta {
  component: ComponentType<RaporTemplateProps>;
}

export const RAPOR_TEMPLATE_LIST: RaporTemplateDefinition[] = [
  {
    id: "km-default",
    label: "Kurikulum Merdeka",
    description: "Nilai akhir, capaian, kehadiran, dan ekstrakurikuler",
    component: KmDefaultTemplate,
  },
  {
    id: SEMESTER_GANJIL_TEMPLATE_META.id,
    label: SEMESTER_GANJIL_TEMPLATE_META.label,
    description: SEMESTER_GANJIL_TEMPLATE_META.description,
    component: SemesterGanjilManTemplate,
  },
];

export const RAPOR_TEMPLATES: Record<
  RaporTemplateId,
  RaporTemplateDefinition
> = Object.fromEntries(
  RAPOR_TEMPLATE_LIST.map((t) => [t.id, t]),
) as Record<RaporTemplateId, RaporTemplateDefinition>;

export function getRaporTemplate(id: RaporTemplateId): RaporTemplateDefinition {
  return RAPOR_TEMPLATES[id] ?? RAPOR_TEMPLATES["km-default"];
}
