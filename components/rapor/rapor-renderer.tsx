"use client";

import * as React from "react";

import { getRaporTemplate } from "@/components/rapor/template-registry";
import { buildSemesterGanjilViewModel } from "@/lib/rapor/build-view-model";
import type {
  RaporRendererProps,
  RaporTemplateId,
} from "@/lib/rapor/types";

export function RaporRenderer({
  data,
  templateId,
  watermarkLogo = false,
  printMode = false,
  printRoot = true,
}: RaporRendererProps & { printRoot?: boolean }) {
  const definition = getRaporTemplate(templateId);
  const Template = definition.component;

  const viewModel = React.useMemo(() => {
    if (templateId === "semester-ganjil-man") {
      return buildSemesterGanjilViewModel(data);
    }
    return undefined;
  }, [data, templateId]);

  return (
    <Template
      key={templateId}
      data={data}
      viewModel={viewModel}
      options={{
        watermarkLogo,
        printMode,
        printRoot,
        pageNumber: templateId === "semester-ganjil-man" ? 2 : 1,
        totalPages: templateId === "semester-ganjil-man" ? 2 : 1,
      }}
    />
  );
}

export type { RaporTemplateId };
