"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";

import {
  HURUF_HINTS,
  HURUF_LABELS,
  HURUF_OPTIONS,
} from "@/lib/nilai/skala-huruf";
import {
  parseSkorAngka,
  sanitizeSkorAngkaInput,
  SKOR_ANGKA_MAX,
  SKOR_ANGKA_MIN,
} from "@/lib/nilai/skala-angka";
import type { Nilai, NilaiUpsertInput, SkalaPenilaian } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface TapGradeButtonsProps {
  skala: SkalaPenilaian;
  siswaId: number;
  indikatorId: number;
  jenisAsesmen: NilaiUpsertInput["jenis_asesmen"];
  existing?: Nilai;
  onSave: (entry: NilaiUpsertInput) => Promise<void>;
}

export function TapGradeButtons({
  skala,
  siswaId,
  indikatorId,
  jenisAsesmen,
  existing,
  onSave,
}: TapGradeButtonsProps) {
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [draftAngka, setDraftAngka] = React.useState<string | null>(null);

  async function saveValue(entry: NilaiUpsertInput) {
    setSaving(true);
    setSaved(false);
    try {
      await onSave(entry);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  const selectedHuruf = existing?.skor_kualitatif;
  const selectedAngka =
    existing?.skor_angka != null ? String(existing.skor_angka) : null;
  const angkaInput = draftAngka ?? selectedAngka ?? "";

  if (skala === "HURUF") {
    return (
      <div className="relative">
        <div className="grid grid-cols-5 gap-2">
          {HURUF_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              disabled={saving}
              title={`${HURUF_LABELS[opt]} · ${HURUF_HINTS[opt]}`}
              onClick={() =>
                saveValue({
                  id_siswa: siswaId,
                  id_indikator: indikatorId,
                  jenis_asesmen: jenisAsesmen,
                  skor_kualitatif: opt,
                  skor_angka: null,
                })
              }
              className={cn(
                "flex min-h-11 min-w-11 flex-col items-center justify-center rounded-full border-2 text-sm font-bold transition-all active:scale-95",
                selectedHuruf === opt
                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                  : "border-border bg-background hover:border-primary/50",
              )}
            >
              {opt}
            </button>
          ))}
        </div>
        <SaveFlash saving={saving} saved={saved} />
      </div>
    );
  }

  return (
    <div className="relative space-y-2">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={3}
        disabled={saving}
        placeholder={`${SKOR_ANGKA_MIN}–${SKOR_ANGKA_MAX}`}
        value={angkaInput}
        onChange={(e) => {
          const v = sanitizeSkorAngkaInput(e.target.value);
          setDraftAngka(v);
          const n = parseSkorAngka(v);
          if (n != null) {
            void saveValue({
              id_siswa: siswaId,
              id_indikator: indikatorId,
              jenis_asesmen: jenisAsesmen,
              skor_angka: n,
              skor_kualitatif: null,
            }).then(() => setDraftAngka(null));
          }
        }}
        onBlur={() => setDraftAngka(null)}
        className="h-11 w-full rounded-lg border bg-background px-3 text-center text-sm"
      />
      <div className="grid grid-cols-5 gap-2">
        {[100, 85, 75, 65, 50].map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={saving}
            onClick={() =>
              saveValue({
                id_siswa: siswaId,
                id_indikator: indikatorId,
                jenis_asesmen: jenisAsesmen,
                skor_angka: opt,
                skor_kualitatif: null,
              })
            }
            className={cn(
              "flex min-h-9 items-center justify-center rounded-lg border text-xs font-semibold transition-all active:scale-95",
              selectedAngka === String(opt)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:border-primary/50",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
      <SaveFlash saving={saving} saved={saved} />
    </div>
  );
}

function SaveFlash({ saving, saved }: { saving: boolean; saved: boolean }) {
  if (!saving && !saved) return null;
  return (
    <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-background shadow-sm">
      {saving ? (
        <Loader2 className="size-3 animate-spin text-muted-foreground" />
      ) : (
        <Check className="size-3 text-emerald-600" />
      )}
    </span>
  );
}
