import { HURUF_TO_NORMALIZED, isSkorHuruf } from "@/lib/nilai/skala-huruf";
import type { KkmConfig } from "@/lib/nilai/kkm-config";
import type { PenilaianWorkspace } from "@/lib/services/penilaian";
import { nilaiKey } from "@/lib/services/penilaian";
import type { Nilai, Siswa, SkalaPenilaian } from "@/lib/types/database";

export type StatusCapaian = "REMEDIAL" | "TUNTAS" | "PENGAYAAN" | "BELUM_DINILAI";

export interface IndikatorCapaian {
  indikatorId: number;
  kodeIndikator: string;
  kodeTp: string;
  skala: SkalaPenilaian;
  normalized: number | null;
  status: StatusCapaian;
  display: string;
}

export interface SiswaIntervensi {
  siswa: Siswa;
  rataRata: number | null;
  indikatorRemedial: IndikatorCapaian[];
  indikatorPengayaan: IndikatorCapaian[];
}

export interface IntervensiAnalysis {
  remedial: SiswaIntervensi[];
  pengayaan: SiswaIntervensi[];
  tuntas: Siswa[];
  belumDinilai: Siswa[];
  totalScoredCells: number;
}

export function nilaiToNormalized(
  nilai: Nilai | undefined,
  skala: SkalaPenilaian,
): number | null {
  if (!nilai) return null;

  if (skala === "HURUF") {
    if (!isSkorHuruf(nilai.skor_kualitatif)) return null;
    return HURUF_TO_NORMALIZED[nilai.skor_kualitatif];
  }

  if (nilai.skor_angka == null) return null;
  return nilai.skor_angka;
}

export function formatNilaiDisplay(
  nilai: Nilai | undefined,
  skala: SkalaPenilaian,
): string {
  if (!nilai) return "—";
  if (skala === "HURUF") return nilai.skor_kualitatif ?? "—";
  if (nilai.skor_angka != null) return String(nilai.skor_angka);
  return "—";
}

function classifyIndikator(
  normalized: number,
  skala: SkalaPenilaian,
  kkm: KkmConfig,
): StatusCapaian {
  const kkmThreshold =
    skala === "HURUF"
      ? HURUF_TO_NORMALIZED[kkm.kkmHuruf]
      : kkm.kkmAngka;

  const pengayaanThreshold =
    skala === "HURUF"
      ? HURUF_TO_NORMALIZED[kkm.ambangPengayaanHuruf]
      : kkm.ambangPengayaanAngka;

  if (normalized < kkmThreshold) return "REMEDIAL";
  if (normalized > pengayaanThreshold) return "PENGAYAAN";
  return "TUNTAS";
}

export function analyzeIntervensi(
  workspace: Omit<PenilaianWorkspace, "kelas">,
  kkm: KkmConfig,
): IntervensiAnalysis {
  const remedial: SiswaIntervensi[] = [];
  const pengayaan: SiswaIntervensi[] = [];
  const tuntas: Siswa[] = [];
  const belumDinilai: Siswa[] = [];
  let totalScoredCells = 0;

  for (const siswa of workspace.siswa) {
    const indikatorRemedial: IndikatorCapaian[] = [];
    const indikatorPengayaan: IndikatorCapaian[] = [];
    const scored: IndikatorCapaian[] = [];

    for (const ind of workspace.indikator) {
      const key = nilaiKey(siswa.id, ind.id);
      const nilai = workspace.nilaiMap[key];
      const normalized = nilaiToNormalized(nilai, ind.skala_penilaian);

      if (normalized == null) continue;

      totalScoredCells += 1;
      const status = classifyIndikator(normalized, ind.skala_penilaian, kkm);
      const capaian: IndikatorCapaian = {
        indikatorId: ind.id,
        kodeIndikator: ind.kode_indikator,
        kodeTp: ind.kode_tp,
        skala: ind.skala_penilaian,
        normalized,
        status,
        display: formatNilaiDisplay(nilai, ind.skala_penilaian),
      };
      scored.push(capaian);

      if (status === "REMEDIAL") indikatorRemedial.push(capaian);
      if (status === "PENGAYAAN") indikatorPengayaan.push(capaian);
    }

    if (scored.length === 0) {
      belumDinilai.push(siswa);
      continue;
    }

    const rataRata =
      scored.reduce((sum, s) => sum + (s.normalized ?? 0), 0) / scored.length;

    if (indikatorRemedial.length > 0) {
      remedial.push({
        siswa,
        rataRata,
        indikatorRemedial,
        indikatorPengayaan,
      });
    } else if (
      indikatorPengayaan.length > 0 &&
      indikatorPengayaan.length === scored.length
    ) {
      pengayaan.push({
        siswa,
        rataRata,
        indikatorRemedial,
        indikatorPengayaan,
      });
    } else {
      tuntas.push(siswa);
    }
  }

  return {
    remedial,
    pengayaan,
    tuntas,
    belumDinilai,
    totalScoredCells,
  };
}

export function filterWorkspaceStudents(
  workspace: Omit<PenilaianWorkspace, "kelas">,
  siswaIds: number[],
): Omit<PenilaianWorkspace, "kelas"> {
  const idSet = new Set(siswaIds);
  return {
    ...workspace,
    siswa: workspace.siswa.filter((s) => idSet.has(s.id)),
  };
}
