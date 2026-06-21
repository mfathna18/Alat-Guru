import type { ERaporPreviewData } from "@/lib/services/e-rapor";
import { parseRaporTemplateId, type RaporTemplateId } from "@/lib/rapor/types";

import { RaporRenderer } from "@/components/rapor/rapor-renderer";

export type { RaporMapelRow } from "@/components/rapor/templates/km-default/km-default-template";

interface RaporPrintViewProps {
  data: ERaporPreviewData;
  printMode?: boolean;
  watermarkLogo?: boolean;
  templateId?: RaporTemplateId;
}

/** @deprecated Gunakan RaporRenderer — wrapper kompatibilitas mundur. */
export function RaporPrintView({
  data,
  printMode = false,
  watermarkLogo = false,
  templateId = "km-default",
}: RaporPrintViewProps) {
  return (
    <RaporRenderer
      data={data}
      templateId={templateId}
      watermarkLogo={watermarkLogo}
      printMode={printMode}
    />
  );
}

export { RaporRenderer };
