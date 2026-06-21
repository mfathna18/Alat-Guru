import type { SkalaPenilaian } from "@/lib/types/database";

export type HurufKriteria = {
  A: string;
  B: string;
  C: string;
  D: string;
  E: string;
};

export type AngkaKriteria = {
  "86-100": string;
  "71-85": string;
  "61-70": string;
  "51-60": string;
  "1-50": string;
};

export type RubrikKriteria = HurufKriteria | AngkaKriteria;

export const HURUF_KRITERIA_LABELS: Record<keyof HurufKriteria, string> = {
  A: "A (86 – 100)",
  B: "B (71 – 85)",
  C: "C (61 – 70)",
  D: "D (51 – 60)",
  E: "E (1 – 50)",
};

export const ANGKA_LABELS: Record<keyof AngkaKriteria, string> = {
  "86-100": "86 – 100 (A)",
  "71-85": "71 – 85 (B)",
  "61-70": "61 – 70 (C)",
  "51-60": "51 – 60 (D)",
  "1-50": "1 – 50 (E)",
};

export function defaultKriteria(skala: SkalaPenilaian): RubrikKriteria {
  switch (skala) {
    case "HURUF":
      return { A: "", B: "", C: "", D: "", E: "" };
    case "ANGKA":
      return {
        "86-100": "",
        "71-85": "",
        "61-70": "",
        "51-60": "",
        "1-50": "",
      };
  }
}

export function parseKriteriaJson(
  skala: SkalaPenilaian,
  json: Record<string, unknown> | null | undefined,
): RubrikKriteria {
  const defaults = defaultKriteria(skala);
  if (!json) return defaults;

  const merged = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof typeof defaults)[]) {
    const val = json[key as string];
    if (typeof val === "string") {
      (merged as Record<string, string>)[key as string] = val;
    }
  }
  return merged as RubrikKriteria;
}

export function kriteriaToJson(
  kriteria: RubrikKriteria,
): Record<string, string> {
  return { ...(kriteria as Record<string, string>) };
}

export function hasKriteriaContent(kriteria: RubrikKriteria): boolean {
  return Object.values(kriteria).some((v) => v.trim().length > 0);
}
