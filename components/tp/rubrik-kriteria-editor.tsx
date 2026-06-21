"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ANGKA_LABELS,
  HURUF_KRITERIA_LABELS,
  type RubrikKriteria,
} from "@/lib/rubrik/kriteria";
import { parseKriteriaJson } from "@/lib/rubrik/kriteria";
import type { SkalaPenilaian } from "@/lib/types/database";

interface RubrikKriteriaEditorProps {
  skala: SkalaPenilaian;
  value: RubrikKriteria;
  onChange: (value: RubrikKriteria) => void;
}

export function RubrikKriteriaEditor({
  skala,
  value,
  onChange,
}: RubrikKriteriaEditorProps) {
  function updateField(key: string, text: string) {
    onChange({ ...(value as Record<string, string>), [key]: text } as RubrikKriteria);
  }

  const labels =
    skala === "HURUF" ? HURUF_KRITERIA_LABELS : ANGKA_LABELS;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Deskripsikan kriteria penilaian per level. Kosongkan jika belum
        diperlukan.
      </p>
      {(Object.keys(labels) as (keyof typeof labels)[]).map((key) => (
        <div key={String(key)} className="space-y-1.5">
          <Label htmlFor={`kriteria-${key}`}>{labels[key]}</Label>
          <Textarea
            id={`kriteria-${key}`}
            className="min-h-[72px] text-sm"
            placeholder={`Kriteria ${labels[key]}…`}
            value={(value as Record<string, string>)[key as string] ?? ""}
            onChange={(e) => updateField(String(key), e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}

export function kriteriaFromTpRubrik(
  skala: SkalaPenilaian,
  json: Record<string, unknown> | null | undefined,
): RubrikKriteria {
  return parseKriteriaJson(skala, json);
}
