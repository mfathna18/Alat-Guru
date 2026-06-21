import { buildSemesterGanjilViewModel } from "@/lib/rapor/build-view-model";
import { RaporPrintUnit } from "@/components/rapor/shared/rapor-print-unit";
import { SemesterGanjilManPage1 } from "@/components/rapor/templates/semester-ganjil-man/semester-ganjil-man-page1";
import { SemesterGanjilManPage2 } from "@/components/rapor/templates/semester-ganjil-man/semester-ganjil-man-page2";
import { RAPOR_MAN_LAYOUT_CSS, RAPOR_MAN_PRINT_MEDIA_CSS } from "@/lib/export/rapor/rapor-man-capture-css";
import {
  RAPOR_CONTENT_SCALE_CSS,
  RAPOR_PRINT_UNIT_CSS,
} from "@/lib/export/rapor/rapor-content-scale";
import type { RaporTemplateProps } from "@/lib/rapor/types";
import { cn } from "@/lib/utils";

export function SemesterGanjilManTemplate({
  data,
  viewModel: viewModelProp,
  options,
}: RaporTemplateProps) {
  const viewModel = viewModelProp ?? buildSemesterGanjilViewModel(data);

  return (
    <div
      id={options.printRoot !== false ? "rapor-print-root" : undefined}
      className={cn(
        "relative mx-auto max-w-[210mm] text-black",
        options.printMode ? "print:space-y-0" : "space-y-4",
      )}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `${RAPOR_MAN_LAYOUT_CSS}\n${RAPOR_CONTENT_SCALE_CSS}\n${RAPOR_PRINT_UNIT_CSS}\n${RAPOR_MAN_PRINT_MEDIA_CSS}`,
        }}
      />
      <div className="rapor-pages">
        <RaporPrintUnit>
          <SemesterGanjilManPage1 data={data} options={options} />
        </RaporPrintUnit>
        <RaporPrintUnit>
          <SemesterGanjilManPage2
            data={data}
            viewModel={viewModel}
            options={{ ...options, pageNumber: 2 }}
          />
        </RaporPrintUnit>
      </div>
    </div>
  );
}
