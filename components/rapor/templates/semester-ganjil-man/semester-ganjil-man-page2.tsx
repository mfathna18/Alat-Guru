import { buildSemesterGanjilViewModel } from "@/lib/rapor/build-view-model";
import { RaporPageShell } from "@/components/rapor/shared/rapor-page-shell";
import {
  RaporBiodataStrip,
  RaporSekolahHeader,
} from "@/components/rapor/templates/semester-ganjil-man/rapor-man-header";
import { PengetahuanKeterampilanTable } from "@/components/rapor/templates/semester-ganjil-man/pengetahuan-keterampilan-table";
import { RaporPredicateLegend } from "@/components/rapor/templates/semester-ganjil-man/rapor-man-footer-legend";
import type { RaporTemplateProps } from "@/lib/rapor/types";
import type { SemesterGanjilViewModel } from "@/lib/rapor/build-view-model";

export function SemesterGanjilManPage2({
  data,
  viewModel,
  options,
}: Pick<RaporTemplateProps, "data" | "viewModel" | "options">) {
  const vm = viewModel ?? buildSemesterGanjilViewModel(data);

  return (
    <RaporPageShell
      printRoot={false}
      watermarkLogo={options.watermarkLogo}
      logoUrl={data.pengaturan?.logo_url}
      printMode={options.printMode}
      className="rapor-man-page"
    >
      <div className="rapor-man-page-body">
        <RaporSekolahHeader data={data} />
        <RaporBiodataStrip data={data} />
        <PengetahuanKeterampilanTable viewModel={vm} />
        <RaporPredicateLegend ranges={vm.predicateRanges} kkm={vm.kkm} />
      </div>
    </RaporPageShell>
  );
}

export type { SemesterGanjilViewModel };
