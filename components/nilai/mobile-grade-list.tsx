"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PenilaianEmptyState } from "@/components/nilai/penilaian-empty-state";
import type { PenilaianWorkspace } from "@/lib/services/penilaian";
import { nilaiKey } from "@/lib/services/penilaian";
import { skalaShort } from "@/lib/nilai/skala-label";
import type {
  JenisAsesmen,
  NilaiUpsertInput,
  SkalaPenilaian,
} from "@/lib/types/database";
import { cn } from "@/lib/utils";

import { TapGradeButtons } from "./tap-grade-buttons";

interface MobileGradeListProps {
  workspace: Omit<PenilaianWorkspace, "kelas">;
  jenisAsesmen: JenisAsesmen;
  semester: 1 | 2;
  mapelNama?: string;
  onSwitchSemester?: (semester: 1 | 2) => void;
  onSave: (entry: NilaiUpsertInput) => Promise<void>;
}

function countFilled(
  siswaId: number,
  indikatorIds: number[],
  nilaiMap: PenilaianWorkspace["nilaiMap"],
) {
  return indikatorIds.filter((id) => {
    const n = nilaiMap[nilaiKey(siswaId, id)];
    return n && (n.skor_angka != null || n.skor_kualitatif);
  }).length;
}

export function MobileGradeList({
  workspace,
  jenisAsesmen,
  semester,
  mapelNama,
  onSwitchSemester,
  onSave,
}: MobileGradeListProps) {
  const { siswa, indikator, nilaiMap } = workspace;
  const indikatorIds = indikator.map((i) => i.id);

  if (indikator.length === 0) {
    return (
      <PenilaianEmptyState
        workspace={workspace}
        semester={semester}
        mapelNama={mapelNama}
        onSwitchSemester={onSwitchSemester}
      />
    );
  }

  if (siswa.length === 0) {
    return (
      <PenilaianEmptyState
        workspace={workspace}
        semester={semester}
        mapelNama={mapelNama}
        onSwitchSemester={onSwitchSemester}
      />
    );
  }

  return (
    <ul className="space-y-3">
      {siswa.map((s, index) => {
        const filled = countFilled(s.id, indikatorIds, nilaiMap);
        const complete = filled === indikator.length;

        return (
          <li key={s.id}>
            <Card
              className={cn(
                "overflow-hidden",
                complete && "border-emerald-200/80 bg-emerald-50/30 dark:bg-emerald-950/20",
              )}
            >
              <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {index + 1}
                    </span>
                    <p className="truncate text-base font-semibold leading-snug">
                      {s.nama_siswa}
                    </p>
                  </div>
                  {s.nisn && (
                    <p className="mt-0.5 pl-9 text-xs text-muted-foreground">
                      NISN {s.nisn}
                    </p>
                  )}
                </div>
                <Badge
                  variant={complete ? "default" : "secondary"}
                  className="shrink-0 gap-1"
                >
                  {complete && <CheckCircle2 className="size-3" />}
                  {filled}/{indikator.length}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4 px-4 pb-4 pt-0">
                {indikator.map((ind) => {
                  const key = nilaiKey(s.id, ind.id);
                  const existing = nilaiMap[key];

                  return (
                    <div key={ind.id} className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-primary">
                          {ind.kode_tp} · {ind.kode_indikator}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Skala: {skalaShort(ind.skala_penilaian)}
                        </p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {ind.deskripsi_indikator}
                        </p>
                      </div>
                      <TapGradeButtons
                        skala={ind.skala_penilaian}
                        siswaId={s.id}
                        indikatorId={ind.id}
                        jenisAsesmen={jenisAsesmen}
                        existing={existing}
                        onSave={onSave}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
