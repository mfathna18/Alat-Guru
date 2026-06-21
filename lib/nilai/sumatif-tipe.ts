import type { TipeSumatif } from "@/lib/types/database";

export const SUMATIF_TIPE_OPTIONS: {
  value: TipeSumatif;
  label: string;
  shortLabel: string;
}[] = [
  {
    value: "STS",
    label: "Sumatif Tengah Semester (STS)",
    shortLabel: "STS",
  },
  {
    value: "SAS",
    label: "Sumatif Akhir Semester (SAS)",
    shortLabel: "SAS",
  },
];

export function sumatifTipeLabel(tipe: TipeSumatif, short = false): string {
  const found = SUMATIF_TIPE_OPTIONS.find((o) => o.value === tipe);
  if (!found) return tipe;
  return short ? found.shortLabel : found.label;
}

/** Label kolom NA rapor — nilai tersimpan di kolom `nilai_sumatif_lm`. */
export const RAPOR_KOLOM_STS_LABEL = "STS";
