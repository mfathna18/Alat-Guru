"use client";

import * as React from "react";
import { toast } from "sonner";

import { SaveIndicator } from "@/components/nilai/save-indicator";
import { PenilaianEmptyState } from "@/components/nilai/penilaian-empty-state";
import { handleSpreadsheetKeyDown } from "@/lib/nilai/spreadsheet-nav";
import type { CellSaveStatus } from "@/lib/nilai/spreadsheet-nav";
import { skalaShort } from "@/lib/nilai/skala-label";
import type { PenilaianWorkspace } from "@/lib/services/penilaian";
import { nilaiKey } from "@/lib/services/penilaian";
import { HURUF_OPTIONS } from "@/lib/nilai/skala-huruf";
import {
  parseSkorAngka,
  sanitizeSkorAngkaInput,
  skorAngkaRangeMessage,
} from "@/lib/nilai/skala-angka";
import type {
  JenisAsesmen,
  NilaiUpsertInput,
  SkalaPenilaian,
  SkorHuruf,
} from "@/lib/types/database";
import { cn } from "@/lib/utils";

const HURUF_SELECT_OPTIONS: SkorHuruf[] = HURUF_OPTIONS;

interface SpreadsheetGridProps {
  workspace: Omit<PenilaianWorkspace, "kelas">;
  jenisAsesmen: JenisAsesmen;
  semester: 1 | 2;
  mapelNama?: string;
  onSwitchSemester?: (semester: 1 | 2) => void;
  onSave: (entry: NilaiUpsertInput) => Promise<void>;
}

function getCellValue(
  skala: SkalaPenilaian,
  nilai: PenilaianWorkspace["nilaiMap"][string] | undefined,
) {
  if (!nilai) return "";
  if (skala === "HURUF") return nilai.skor_kualitatif ?? "";
  return nilai.skor_angka != null ? String(nilai.skor_angka) : "";
}

function buildTpGroups(indikator: PenilaianWorkspace["indikator"]) {
  const groups: {
    tpId: number;
    kode: string;
    skala: SkalaPenilaian;
    count: number;
  }[] = [];

  for (const col of indikator) {
    const last = groups[groups.length - 1];
    if (last && last.tpId === col.tp_id) {
      last.count += 1;
    } else {
      groups.push({
        tpId: col.tp_id,
        kode: col.kode_tp,
        skala: col.skala_penilaian,
        count: 1,
      });
    }
  }
  return groups;
}

export function SpreadsheetGrid({
  workspace,
  jenisAsesmen,
  semester,
  mapelNama,
  onSwitchSemester,
  onSave,
}: SpreadsheetGridProps) {
  const { siswa, indikator, nilaiMap } = workspace;
  const [saveStatus, setSaveStatus] = React.useState<
    Record<string, CellSaveStatus>
  >({});
  const [saveErrors, setSaveErrors] = React.useState<Record<string, string>>(
    {},
  );

  const tpGroups = React.useMemo(() => buildTpGroups(indikator), [indikator]);

  const maxRow = siswa.length - 1;
  const maxCol = indikator.length - 1;

  async function persist(
    siswaId: number,
    indikatorId: number,
    skala: SkalaPenilaian,
    rawValue: string,
    key: string,
  ) {
    const trimmed = rawValue.trim();
    const prev = nilaiMap[key];
    const prevValue = getCellValue(skala, prev);

    if (trimmed === prevValue) return;

    setSaveStatus((s) => ({ ...s, [key]: "saving" }));
    setSaveErrors((e) => {
      const next = { ...e };
      delete next[key];
      return next;
    });

    const entry: NilaiUpsertInput = {
      id_siswa: siswaId,
      id_indikator: indikatorId,
      jenis_asesmen: jenisAsesmen,
    };

    if (skala === "HURUF") {
      entry.skor_kualitatif = (trimmed || null) as SkorHuruf | null;
      entry.skor_angka = null;
    } else {
      const num = parseSkorAngka(trimmed);
      if (trimmed && num == null) {
        const msg = skorAngkaRangeMessage();
        setSaveStatus((s) => ({ ...s, [key]: "error" }));
        setSaveErrors((e) => ({ ...e, [key]: msg }));
        toast.error(msg);
        return;
      }
      entry.skor_angka = num;
      entry.skor_kualitatif = null;
    }

    try {
      await onSave(entry);
      setSaveStatus((s) => ({ ...s, [key]: "saved" }));
      setSaveErrors((e) => {
        const next = { ...e };
        delete next[key];
        return next;
      });
      window.setTimeout(() => {
        setSaveStatus((s) =>
          s[key] === "saved" ? { ...s, [key]: "idle" } : s,
        );
      }, 1800);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Gagal menyimpan ke database.";
      setSaveStatus((s) => ({ ...s, [key]: "error" }));
      setSaveErrors((e) => ({ ...e, [key]: msg }));
      toast.error(msg);
    }
  }

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
    <div className="overflow-auto rounded-lg border bg-background shadow-sm">
      <table className="w-max min-w-full border-collapse text-xs">
        <thead className="sticky top-0 z-20 bg-muted/95 backdrop-blur">
          <tr>
            <th
              rowSpan={2}
              className="sticky left-0 z-30 min-w-10 border-b border-r bg-muted/95 px-2 py-2 text-center font-semibold"
            >
              #
            </th>
            <th
              rowSpan={2}
              className="sticky left-10 z-30 min-w-[180px] border-b border-r bg-muted/95 px-2 py-2 text-left font-semibold"
            >
              Nama Siswa
            </th>
            {tpGroups.map((g) => (
              <th
                key={g.tpId}
                colSpan={g.count}
                className="border-b border-r px-1 py-1.5 text-center font-semibold"
              >
                <span className="block truncate">{g.kode}</span>
                <span className="block text-[10px] font-normal text-primary">
                  {skalaShort(g.skala)}
                </span>
              </th>
            ))}
          </tr>
          <tr>
            {indikator.map((col) => (
              <th
                key={col.id}
                className="min-w-[88px] max-w-[120px] border-b border-r px-1 py-2 text-center font-medium"
                title={`${col.deskripsi_indikator}\nSkala: ${skalaShort(col.skala_penilaian)}`}
              >
                <span className="block truncate">{col.kode_indikator}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {siswa.map((s, rowIndex) => (
            <tr key={s.id} className="hover:bg-muted/30">
              <td className="sticky left-0 z-10 border-b border-r bg-background px-2 py-0.5 text-center text-muted-foreground">
                {rowIndex + 1}
              </td>
              <td className="sticky left-10 z-10 border-b border-r bg-background px-2 py-1 font-medium">
                {s.nama_siswa}
              </td>
              {indikator.map((col, colIndex) => {
                const key = nilaiKey(s.id, col.id);
                const value = getCellValue(col.skala_penilaian, nilaiMap[key]);
                const status = saveStatus[key] ?? "idle";
                const errorMessage = saveErrors[key];

                return (
                  <td key={col.id} className="relative border-b border-r p-0">
                    <GridCell
                      skala={col.skala_penilaian}
                      value={value}
                      row={rowIndex}
                      col={colIndex}
                      maxRow={maxRow}
                      maxCol={maxCol}
                      status={status}
                      errorMessage={errorMessage}
                      onFocus={() => {
                        setSaveStatus((s) =>
                          s[key] === "error" ? { ...s, [key]: "idle" } : s,
                        );
                        setSaveErrors((e) => {
                          const next = { ...e };
                          delete next[key];
                          return next;
                        });
                      }}
                      onBlur={(v) =>
                        persist(s.id, col.id, col.skala_penilaian, v, key)
                      }
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GridCell({
  skala,
  value,
  row,
  col,
  maxRow,
  maxCol,
  status,
  errorMessage,
  onFocus,
  onBlur,
}: {
  skala: SkalaPenilaian;
  value: string;
  row: number;
  col: number;
  maxRow: number;
  maxCol: number;
  status: CellSaveStatus;
  errorMessage?: string;
  onFocus: () => void;
  onBlur: (value: string) => void;
}) {
  const [local, setLocal] = React.useState(value);

  React.useEffect(() => {
    setLocal(value);
  }, [value]);

  const commonProps = {
    "data-grid-row": row,
    "data-grid-col": col,
    onKeyDown: (e: React.KeyboardEvent) =>
      handleSpreadsheetKeyDown(e, row, col, maxRow, maxCol),
    onBlur: () => onBlur(local),
    onFocus,
    className: cn(
      "h-8 w-full min-w-[84px] border-0 bg-transparent px-2 pr-5 text-center text-xs outline-none",
      "focus:bg-primary/5 focus:ring-1 focus:ring-inset focus:ring-primary/40",
      status === "error" && "ring-1 ring-inset ring-destructive/50 bg-destructive/5",
    ),
  };

  return (
    <div className="relative">
      {skala === "HURUF" ? (
        <select
          {...commonProps}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
        >
          <option value="">—</option>
          {HURUF_SELECT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...commonProps}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={3}
          value={local}
          onChange={(e) => setLocal(sanitizeSkorAngkaInput(e.target.value))}
        />
      )}
      <SaveIndicator status={status} errorMessage={errorMessage} />
    </div>
  );
}
