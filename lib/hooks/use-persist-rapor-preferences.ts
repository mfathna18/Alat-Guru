"use client";

import * as React from "react";
import { toast } from "sonner";

import { useSaveRaporPreferences } from "@/lib/hooks/use-pengaturan";
import { parseRaporTemplateId, type RaporTemplateId } from "@/lib/rapor/types";
import type { PengaturanSekolah } from "@/lib/types/database";
import { getErrorMessage } from "@/lib/utils";

interface PersistRaporPreferencesArgs {
  guruId?: number;
  pengaturan?: PengaturanSekolah | null;
  templateId: RaporTemplateId;
  watermarkLogo: boolean;
  /** True setelah state di-hydrate dari pengaturan */
  ready: boolean;
}

/**
 * Auto-save template & watermark ke pengaturan_sekolah (debounced).
 */
export function usePersistRaporPreferences({
  guruId,
  pengaturan,
  templateId,
  watermarkLogo,
  ready,
}: PersistRaporPreferencesArgs) {
  const savePrefs = useSaveRaporPreferences(guruId);
  const [savedAt, setSavedAt] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!ready || !pengaturan) return;

    const dbTemplate = parseRaporTemplateId(pengaturan.rapor_template_id);
    const dbWatermark = pengaturan.rapor_watermark_logo ?? false;
    if (templateId === dbTemplate && watermarkLogo === dbWatermark) return;

    const timer = window.setTimeout(() => {
      void savePrefs
        .mutateAsync({
          rapor_template_id: templateId,
          rapor_watermark_logo: watermarkLogo,
        })
        .then(() => setSavedAt(Date.now()))
        .catch((err) => {
          toast.error(
            getErrorMessage(err, "Gagal menyimpan preferensi rapor."),
          );
        });
    }, 500);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- savePrefs stable enough; avoid save loop
  }, [ready, pengaturan, templateId, watermarkLogo]);

  return { isSaving: savePrefs.isPending, savedAt };
}
