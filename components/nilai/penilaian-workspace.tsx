"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import {
  PenilaianFilterBar,
  type PenilaianFilters,
} from "@/components/nilai/penilaian-filter-bar";
import { MobileGradeList } from "@/components/nilai/mobile-grade-list";
import { ExportPdfButton } from "@/components/nilai/export-pdf-button";
import { PenilaianMapelManagerDialog } from "@/components/nilai/penilaian-mapel-manager-dialog";
import { SpreadsheetGrid } from "@/components/nilai/spreadsheet-grid";
import { TpRubrikSummaryBar } from "@/components/nilai/penilaian-empty-state";
import {
  IntervensiPanel,
  intervensiEmptyMessage,
} from "@/components/nilai/intervensi-panel";
import { skalaLabel as formatSkalaLabel } from "@/lib/nilai/skala-label";
import { sumatifTipeLabel } from "@/lib/nilai/sumatif-tipe";
import { kkmFromPengaturan } from "@/lib/nilai/kkm-config";
import {
  analyzeIntervensi,
  filterWorkspaceStudents,
} from "@/lib/nilai/ketuntasan";
import { Badge } from "@/components/ui/badge";
import { useViewportMode } from "@/hooks/use-viewport-mode";
import { useGuruProfile } from "@/lib/hooks/use-guru-profile";
import { useMataPelajaranList } from "@/lib/hooks/use-e-rapor";
import {
  useKelasList,
  usePenilaianWorkspace,
  useUpsertNilai,
} from "@/lib/hooks/use-penilaian";
import { usePengaturanSekolah } from "@/lib/hooks/use-pengaturan";
import type { SumatifPenilaianContext } from "@/lib/services/penilaian";
import type { JenisAsesmen, NilaiUpsertInput } from "@/lib/types/database";

function sumatifContextFromFilters(
  filters: PenilaianFilters,
): SumatifPenilaianContext | undefined {
  if (filters.jenisAsesmen !== "SUMATIF") return undefined;
  return { tipe: filters.sumatifTipe };
}

export function PenilaianWorkspace() {
  const mode = useViewportMode();
  const isMobile = mode === "mobile";

  const [filters, setFilters] = React.useState<PenilaianFilters>({
    kelasId: null,
    mapelId: null,
    semester: 1,
    jenisAsesmen: "FORMATIF",
    sumatifTipe: "STS",
  });

  const [mapelManagerOpen, setMapelManagerOpen] = React.useState(false);

  const { data: kelasList = [], isLoading: loadingKelas } = useKelasList();
  const {
    data: mapelList = [],
    isLoading: loadingMapel,
    error: mapelError,
  } = useMataPelajaranList();
  const { data: guru } = useGuruProfile();
  const { data: pengaturan } = usePengaturanSekolah(guru?.id);

  const defaultMapelId = React.useMemo(
    () => mapelList.find((m) => m.is_default && !m.is_group_header)?.id ?? null,
    [mapelList],
  );

  const sumatifCtx = React.useMemo(
    () => sumatifContextFromFilters(filters),
    [filters],
  );

  React.useEffect(() => {
    if (filters.kelasId == null && kelasList.length > 0) {
      setFilters((f) => ({ ...f, kelasId: kelasList[0].id }));
    }
  }, [kelasList, filters.kelasId]);

  React.useEffect(() => {
    if (filters.mapelId == null && mapelList.length > 0) {
      const scorable = mapelList.filter((m) => !m.is_group_header);
      setFilters((f) => ({
        ...f,
        mapelId:
          scorable.find((m) => m.is_default)?.id ??
          scorable[0]?.id ??
          mapelList[0].id,
      }));
    }
  }, [mapelList, filters.mapelId]);

  React.useEffect(() => {
    const selected = mapelList.find((m) => m.id === filters.mapelId);
    if (!selected?.is_group_header) return;
    const subMapel = mapelList.find(
      (m) => !m.is_group_header && m.parent_id === selected.id,
    );
    const fallback =
      subMapel ??
      mapelList.find((m) => !m.is_group_header && m.is_default) ??
      mapelList.find((m) => !m.is_group_header);
    if (fallback && fallback.id !== filters.mapelId) {
      setFilters((f) => ({ ...f, mapelId: fallback.id }));
    }
  }, [mapelList, filters.mapelId]);

  const { data: workspace, isLoading: loadingWorkspace } =
    usePenilaianWorkspace(
      filters.kelasId,
      filters.semester,
      filters.jenisAsesmen,
      filters.mapelId,
      defaultMapelId,
      sumatifCtx,
    );

  const sasSumatifCtx: SumatifPenilaianContext = { tipe: "SAS" };
  const { data: sumatifWorkspace, isLoading: loadingSumatif } =
    usePenilaianWorkspace(
      filters.kelasId,
      filters.semester,
      "SUMATIF",
      filters.mapelId,
      defaultMapelId,
      sasSumatifCtx,
    );

  const upsert = useUpsertNilai(
    filters.kelasId,
    filters.semester,
    filters.jenisAsesmen,
    filters.mapelId,
    sumatifCtx,
  );

  const handleSave = React.useCallback(
    async (entry: NilaiUpsertInput) => {
      const payload: NilaiUpsertInput = { ...entry };
      if (filters.jenisAsesmen === "SUMATIF") {
        payload.tipe_sumatif = filters.sumatifTipe;
        payload.id_lingkup_materi = null;
      }
      await upsert.mutateAsync(payload);
    },
    [upsert, filters.jenisAsesmen, filters.sumatifTipe],
  );

  function patchFilters(patch: Partial<PenilaianFilters>) {
    setFilters((f) => ({ ...f, ...patch }));
  }

  const selectedKelas = kelasList.find((k) => k.id === filters.kelasId);
  const selectedMapel = mapelList.find((m) => m.id === filters.mapelId);
  const kkm = kkmFromPengaturan(pengaturan);

  const intervensi = React.useMemo(() => {
    if (!sumatifWorkspace || sumatifWorkspace.indikator.length === 0) {
      return null;
    }
    return analyzeIntervensi(sumatifWorkspace, kkm);
  }, [sumatifWorkspace, kkm]);

  const displayWorkspace = React.useMemo(() => {
    if (!workspace || !intervensi) return workspace;
    if (filters.jenisAsesmen === "REMEDIAL") {
      return filterWorkspaceStudents(
        workspace,
        intervensi.remedial.map((r) => r.siswa.id),
      );
    }
    if (filters.jenisAsesmen === "PENGAYAAN") {
      return filterWorkspaceStudents(
        workspace,
        intervensi.pengayaan.map((p) => p.siswa.id),
      );
    }
    return workspace;
  }, [workspace, intervensi, filters.jenisAsesmen]);

  const emptyIntervensiMsg = intervensiEmptyMessage(filters.jenisAsesmen);
  const showIntervensiEmpty =
    emptyIntervensiMsg != null &&
    displayWorkspace != null &&
    displayWorkspace.siswa.length === 0;

  const skalaSummary =
    workspace && workspace.tpSummaries.length > 1
      ? `${workspace.tpSummaries.length} TP · skala per kolom`
      : workspace
        ? formatSkalaLabel(workspace.skalaPenilaian)
        : "";

  const loading =
    loadingKelas ||
    loadingMapel ||
    loadingWorkspace ||
    (filters.jenisAsesmen !== "SUMATIF" && loadingSumatif);

  const sumatifLabel =
    filters.jenisAsesmen === "SUMATIF"
      ? sumatifTipeLabel(filters.sumatifTipe)
      : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 md:gap-4">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">
              Penilaian
            </h1>
            <p className="text-sm text-muted-foreground">
              Input nilai formatif dan sumatif. Data otomatis masuk ke rapor.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="shrink-0">
              {isMobile ? "On-the-Go" : "Office Mode"}
            </Badge>
            <ExportPdfButton
              kelasId={filters.kelasId}
              kelasNama={selectedKelas?.nama_kelas}
              mapelId={filters.mapelId}
              mapelNama={selectedMapel?.nama_mapel}
              defaultMapelId={defaultMapelId}
              semester={filters.semester}
              jenisAsesmen={filters.jenisAsesmen as JenisAsesmen}
            />
          </div>
        </div>

        <PenilaianFilterBar
          filters={filters}
          kelasList={kelasList}
          mapelList={mapelList}
          loadingMapel={loadingMapel}
          mapelError={mapelError instanceof Error ? mapelError : null}
          onChange={patchFilters}
          onManageMapel={() => setMapelManagerOpen(true)}
        />

        <PenilaianMapelManagerDialog
          open={mapelManagerOpen}
          onOpenChange={setMapelManagerOpen}
          mapelList={mapelList}
          selectedMapelId={filters.mapelId}
          onMapelCreated={(mapelId) => patchFilters({ mapelId })}
          onMapelDeleted={(mapelId) => {
            if (filters.mapelId === mapelId) {
              patchFilters({ mapelId: null });
            }
          }}
        />

        {workspace && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Mapel:{" "}
              <span className="font-medium">
                {selectedMapel?.nama_mapel ?? "—"}
              </span>
              {" · "}
              Rubrik: <span className="font-medium">{skalaSummary}</span>
              {" · "}
              {workspace.siswa.length} siswa · {workspace.indikator.length}{" "}
              indikator · Semester {filters.semester}
              {sumatifLabel && ` · ${sumatifLabel}`}
              {filters.jenisAsesmen === "REMEDIAL" && " · Lembar Remedial"}
              {filters.jenisAsesmen === "PENGAYAAN" && " · Lembar Pengayaan"}
            </p>
            <TpRubrikSummaryBar tpSummaries={workspace.tpSummaries} />
          </div>
        )}
      </div>

      {intervensi && sumatifWorkspace && sumatifWorkspace.indikator.length > 0 && (
        <IntervensiPanel
          analysis={intervensi}
          kkm={kkm}
          kelasNama={selectedKelas?.nama_kelas}
          semester={filters.semester}
          pengaturan={pengaturan}
          guruNama={guru?.nama_guru}
          onOpenRemedial={() => patchFilters({ jenisAsesmen: "REMEDIAL" })}
          onOpenPengayaan={() => patchFilters({ jenisAsesmen: "PENGAYAAN" })}
        />
      )}

      <div className="min-h-0 flex-1">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" />
            Memuat data penilaian…
          </div>
        ) : !filters.kelasId ? (
          <EmptyHint message="Pilih kelas untuk memulai penilaian." />
        ) : !filters.mapelId ? (
          <EmptyHint message="Pilih mata pelajaran untuk memulai penilaian." />
        ) : showIntervensiEmpty ? (
          <EmptyHint message={emptyIntervensiMsg!} />
        ) : displayWorkspace ? (
          isMobile ? (
            <MobileGradeList
              workspace={displayWorkspace}
              jenisAsesmen={filters.jenisAsesmen as JenisAsesmen}
              semester={filters.semester}
              mapelNama={selectedMapel?.nama_mapel}
              onSwitchSemester={(s) => patchFilters({ semester: s })}
              onSave={handleSave}
            />
          ) : (
            <SpreadsheetGrid
              workspace={displayWorkspace}
              jenisAsesmen={filters.jenisAsesmen as JenisAsesmen}
              semester={filters.semester}
              mapelNama={selectedMapel?.nama_mapel}
              onSwitchSemester={(s) => patchFilters({ semester: s })}
              onSave={handleSave}
            />
          )
        ) : null}
      </div>

      {!isMobile && displayWorkspace && displayWorkspace.indikator.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          Keyboard: <kbd className="rounded border px-1">Enter</kbd> /{" "}
          <kbd className="rounded border px-1">↓</kbd> baris bawah ·{" "}
          <kbd className="rounded border px-1">Tab</kbd> /{" "}
          <kbd className="rounded border px-1">→</kbd> kolom kanan · Simpan
          otomatis saat pindah sel
        </p>
      )}
    </div>
  );
}

function EmptyHint({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
