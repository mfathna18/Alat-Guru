import {
  predikatK13FromNullable,
  predikatK13Ranges,
  type PredikatK13,
} from "@/lib/rapor/predikat-k13";
import { parseMapelKelompok } from "@/lib/rapor/man-template-labels";
import { dualNilaiFromRapor } from "@/lib/rapor/nilai-dual";
import {
  buildTemplateMapelSkeleton,
  findRaporRowForMapel,
  mapelListHasManStructure,
} from "@/lib/rapor/semester-ganjil-template";
import type { ERaporPreviewData } from "@/lib/services/e-rapor";
import type { MapelKelompok, MataPelajaran, RaporMapel } from "@/lib/types/database";
import { DEFAULT_KKM } from "@/lib/nilai/kkm-config";

export type { MapelKelompok };

export interface MapelNilaiDualRow {
  id: number;
  mapelId: number | null;
  namaMapel: string;
  kelompok: MapelKelompok;
  indent: number;
  isGroupHeader: boolean;
  subLabel: string | null;
  pengetahuan: { nilai: number | null; predikat: PredikatK13 | null };
  keterampilan: { nilai: number | null; predikat: PredikatK13 | null };
}

export interface SemesterGanjilViewModel {
  kkm: number;
  rows: MapelNilaiDualRow[];
  kelompokA: MapelNilaiDualRow[];
  kelompokB: MapelNilaiDualRow[];
  kelompokC: MapelNilaiDualRow[];
  kelompokLintas: MapelNilaiDualRow[];
  totalPengetahuan: number;
  totalKeterampilan: number;
  predicateRanges: ReturnType<typeof predikatK13Ranges>;
  /** true = baris layout dari definisi template (bukan struktur DB) */
  fromTemplateStructure: boolean;
}

type RaporMapelJoined = RaporMapel & {
  mata_pelajaran?: Pick<
    MataPelajaran,
    | "nama_mapel"
    | "kode_mapel"
    | "kelompok_mapel"
    | "parent_id"
    | "urutan"
    | "is_group_header"
  > | null;
};

function subLabelForMapel(
  mapel: MataPelajaran,
  mapelList: MataPelajaran[],
): string | null {
  if (!mapel.parent_id) return null;
  const siblings = mapelList
    .filter((m) => m.parent_id === mapel.parent_id && !m.is_group_header)
    .sort(sortMapel);
  const idx = siblings.findIndex((m) => m.id === mapel.id);
  if (idx < 0) return null;
  return String.fromCharCode(97 + idx);
}

function buildScoreRow(
  id: number,
  mapel: MataPelajaran,
  mapelList: MataPelajaran[],
  rapor: RaporMapelJoined | undefined,
  kkm: number,
): MapelNilaiDualRow {
  const dual = rapor ? dualNilaiFromRapor(rapor) : { pengetahuan: null, keterampilan: null };

  return {
    id,
    mapelId: mapel.id > 0 ? mapel.id : null,
    namaMapel: mapel.nama_mapel,
    kelompok: parseMapelKelompok(mapel.kelompok_mapel),
    indent: mapel.parent_id ? 1 : 0,
    isGroupHeader: false,
    subLabel: subLabelForMapel(mapel, mapelList),
    pengetahuan: {
      nilai: dual.pengetahuan,
      predikat: predikatK13FromNullable(dual.pengetahuan, kkm),
    },
    keterampilan: {
      nilai: dual.keterampilan,
      predikat: predikatK13FromNullable(dual.keterampilan, kkm),
    },
  };
}

function buildHeaderRow(mapel: MataPelajaran): MapelNilaiDualRow {
  return {
    id: -mapel.id,
    mapelId: mapel.id > 0 ? mapel.id : null,
    namaMapel: mapel.nama_mapel,
    kelompok: parseMapelKelompok(mapel.kelompok_mapel),
    indent: 0,
    isGroupHeader: true,
    subLabel: null,
    pengetahuan: { nilai: null, predikat: null },
    keterampilan: { nilai: null, predikat: null },
  };
}

function sortMapel(a: MataPelajaran, b: MataPelajaran): number {
  const ka = parseMapelKelompok(a.kelompok_mapel);
  const kb = parseMapelKelompok(b.kelompok_mapel);
  if (ka !== kb) return ka.localeCompare(kb);
  const ua = a.urutan ?? 0;
  const ub = b.urutan ?? 0;
  if (ua !== ub) return ua - ub;
  return a.nama_mapel.localeCompare(b.nama_mapel, "id");
}

function finalizeViewModel(
  kkm: number,
  rows: MapelNilaiDualRow[],
  fromTemplateStructure: boolean,
): SemesterGanjilViewModel {
  const scoreRows = rows.filter((r) => !r.isGroupHeader);
  const sum = (key: "pengetahuan" | "keterampilan") =>
    scoreRows.reduce((acc, r) => acc + (r[key].nilai ?? 0), 0);

  return {
    kkm,
    rows,
    kelompokA: rows.filter((r) => r.kelompok === "A"),
    kelompokB: rows.filter((r) => r.kelompok === "B"),
    kelompokC: rows.filter((r) => r.kelompok === "C"),
    kelompokLintas: rows.filter((r) => r.kelompok === "L"),
    totalPengetahuan: sum("pengetahuan"),
    totalKeterampilan: sum("keterampilan"),
    predicateRanges: predikatK13Ranges(kkm),
    fromTemplateStructure,
  };
}

/**
 * View model template Rapor Semester Ganjil MAN.
 * Layout kelompok mapel dari definisi template; nilai dari rapor_mapel / compute E-Rapor.
 */
export function buildSemesterGanjilViewModel(
  data: ERaporPreviewData,
): SemesterGanjilViewModel {
  const kkm = data.pengaturan?.kkm_angka ?? DEFAULT_KKM.kkmAngka;
  const activeMapelIds = new Set((data.mapelList ?? []).map((m) => m.id));
  const raporRows = (data.raporMapel as RaporMapelJoined[]).filter((row) =>
    activeMapelIds.has(row.id_mata_pelajaran),
  );
  const mapelById = new Map<number, MataPelajaran>(
    (data.mapelList ?? []).map((m) => [m.id, m]),
  );

  const dbMapelList = [...(data.mapelList ?? [])].sort(sortMapel);
  const useTemplateSkeleton = !mapelListHasManStructure(dbMapelList);
  const layoutMapel = useTemplateSkeleton
    ? buildTemplateMapelSkeleton()
    : dbMapelList;

  const rows: MapelNilaiDualRow[] = [];
  const seenRealMapelIds = new Set<number>();

  for (const mapel of layoutMapel) {
    if (mapel.is_group_header) {
      rows.push(buildHeaderRow(mapel));
      continue;
    }

    const rapor = useTemplateSkeleton
      ? findRaporRowForMapel(mapel, raporRows, mapelById)
      : raporRows.find((r) => r.id_mata_pelajaran === mapel.id);

    if (mapel.id > 0) seenRealMapelIds.add(mapel.id);

    rows.push(
      buildScoreRow(
        mapel.id,
        mapel,
        layoutMapel,
        rapor as RaporMapelJoined | undefined,
        kkm,
      ),
    );
  }

  if (!useTemplateSkeleton) {
    for (const row of raporRows) {
      if (seenRealMapelIds.has(row.id_mata_pelajaran)) continue;
      if (!activeMapelIds.has(row.id_mata_pelajaran)) continue;

      const joined = row.mata_pelajaran;
      const pseudo: MataPelajaran = {
        id: row.id_mata_pelajaran,
        id_guru: 0,
        nama_mapel: joined?.nama_mapel ?? "Mata Pelajaran",
        kode_mapel: joined?.kode_mapel ?? null,
        kelompok_mapel: parseMapelKelompok(joined?.kelompok_mapel),
        parent_id: joined?.parent_id ?? null,
        urutan: joined?.urutan ?? 0,
        is_group_header: false,
        is_default: false,
        is_active: true,
        created_at: "",
      };

      rows.push(buildScoreRow(row.id, pseudo, layoutMapel, row, kkm));
    }
  }

  return finalizeViewModel(kkm, rows, useTemplateSkeleton);
}
