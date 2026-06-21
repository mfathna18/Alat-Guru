import type { BobotNa } from "@/lib/e-rapor/nilai-akhir";
import { DEFAULT_BOBOT } from "@/lib/e-rapor/nilai-akhir";

export type NaKomponen = "formatif" | "sumatifLm" | "sas";

export interface NaCompleteness {
  isPartial: boolean;
  missing: NaKomponen[];
  /** Bobot efektif yang dipakai (renormalisasi) */
  effectiveWeight: number;
  message: string | null;
}

const LABELS: Record<NaKomponen, string> = {
  formatif: "Formatif",
  sumatifLm: "STS",
  sas: "SAS",
};

export function analyzeNaCompleteness(
  scores: {
    nilai_formatif: number | null;
    nilai_sumatif_lm: number | null;
    nilai_sas: number | null;
    nilai_akhir: number | null;
  },
  bobot: BobotNa = DEFAULT_BOBOT,
): NaCompleteness {
  const parts: { key: NaKomponen; value: number | null; weight: number }[] = [
    { key: "formatif", value: scores.nilai_formatif, weight: bobot.formatif },
    { key: "sumatifLm", value: scores.nilai_sumatif_lm, weight: bobot.sumatifLm },
    { key: "sas", value: scores.nilai_sas, weight: bobot.sas },
  ];

  const present = parts.filter((p) => p.value != null);
  const missing = parts.filter((p) => p.value == null).map((p) => p.key);
  const effectiveWeight = present.reduce((acc, p) => acc + p.weight, 0);

  if (scores.nilai_akhir == null || missing.length === 0) {
    return {
      isPartial: false,
      missing: [],
      effectiveWeight: 100,
      message: null,
    };
  }

  const missingLabels = missing.map((m) => LABELS[m]).join(", ");
  return {
    isPartial: true,
    missing,
    effectiveWeight,
    message: `NA dihitung dari bobot tersisa (${effectiveWeight}%): belum ada ${missingLabels}.`,
  };
}
