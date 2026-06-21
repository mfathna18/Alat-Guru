import { generateDeskripsiCapaian, type TpCapaianRef } from "@/lib/e-rapor/deskripsi";
import {
  DEFAULT_BOBOT,
  hitungNilaiAkhir,
  rataAngka,
  type BobotNa,
} from "@/lib/e-rapor/nilai-akhir";
import { angkaKePredikat } from "@/lib/e-rapor/predikat";
import { nilaiToNormalized } from "@/lib/nilai/ketuntasan";
import { hitungNilaiPengetahuan, hitungNilaiKeterampilan } from "@/lib/rapor/nilai-dual";
import { createClient } from "@/lib/supabase/client";
import { fetchMataPelajaranOrdered } from "@/lib/services/mata-pelajaran";
import { filterTpByMapel } from "@/lib/services/penilaian";
import { fetchCurrentGuru } from "@/lib/services/kelas";
import { fetchPengaturanSekolah } from "@/lib/services/pengaturan";
import type {
  ERapor,
  Guru,
  Indikator,
  Kelas,
  MataPelajaran,
  Nilai,
  PengaturanSekolah,
  RaporKehadiran,
  RaporMapel,
  Rubrik,
  Siswa,
  SiswaEkstrakurikuler,
  SiswaP5Capaian,
  TujuanPembelajaran,
} from "@/lib/types/database";

export interface RaporMapelComputed {
  id_siswa: number;
  id_mata_pelajaran: number;
  nilai_formatif: number | null;
  nilai_sumatif_lm: number | null;
  nilai_sas: number | null;
  nilai_akhir: number | null;
  nilai_pengetahuan: number | null;
  nilai_keterampilan: number | null;
  predikat_kualitatif: ReturnType<typeof angkaKePredikat>;
  id_tp_tertinggi: number | null;
  id_tp_terendah: number | null;
  deskripsi_capaian: string;
}

export interface ERaporPreviewData {
  pengaturan: PengaturanSekolah | null;
  guru: Guru;
  kelas: Kelas;
  semester: 1 | 2;
  tahunAjaran: string;
  mapel: MataPelajaran;
  siswa: Siswa;
  eRapor: ERapor | null;
  raporMapel: RaporMapel[];
  /** Sumber nilai mapel: live dari penilaian, tersimpan di DB, atau campuran */
  raporMapelSource?: RaporPreviewSource;
  kehadiran: RaporKehadiran | null;
  ekstrakurikuler: (SiswaEkstrakurikuler & { nama_ekskul: string })[];
  p5Capaian: SiswaP5Capaian[];
  mapelList: MataPelajaran[];
}

function nilaiKey(siswaId: number, indikatorId: number, jenis: string, tipe?: string | null) {
  return `${siswaId}-${indikatorId}-${jenis}-${tipe ?? ""}`;
}

export async function fetchMataPelajaranList(): Promise<MataPelajaran[]> {
  return fetchMataPelajaranOrdered();
}

export async function fetchRaporMapelForKelas(
  kelasId: number,
  semester: 1 | 2,
  tahunAjaran: string,
  mapelId?: number,
): Promise<RaporMapel[]> {
  const supabase = createClient();
  let q = supabase
    .from("rapor_mapel")
    .select("*")
    .eq("id_kelas", kelasId)
    .eq("semester", semester)
    .eq("tahun_ajaran", tahunAjaran);

  if (mapelId) q = q.eq("id_mata_pelajaran", mapelId);

  const { data, error } = await q.order("id_siswa");
  if (error) throw error;
  return (data ?? []) as RaporMapel[];
}

export async function computeRaporMapelForKelas(
  kelasId: number,
  semester: 1 | 2,
  mapelId: number,
  tahunAjaran: string,
  defaultMapelId?: number | null,
): Promise<RaporMapelComputed[]> {
  const supabase = createClient();
  const guru = await fetchCurrentGuru();
  const pengaturan = await fetchPengaturanSekolah();

  const bobot: BobotNa = pengaturan
    ? {
        formatif: pengaturan.bobot_formatif ?? DEFAULT_BOBOT.formatif,
        sumatifLm: pengaturan.bobot_sumatif_lm ?? DEFAULT_BOBOT.sumatifLm,
        sas: pengaturan.bobot_sas ?? DEFAULT_BOBOT.sas,
      }
    : DEFAULT_BOBOT;

  const [siswaRes, mapelRes, tpRes] = await Promise.all([
    supabase
      .from("siswa")
      .select("*")
      .eq("id_kelas", kelasId)
      .eq("is_deleted", false)
      .order("nama_siswa"),
    supabase.from("mata_pelajaran").select("*").eq("id", mapelId).single(),
    supabase
      .from("tujuan_pembelajaran")
      .select("*")
      .eq("id_kelas", kelasId)
      .eq("semester", semester),
  ]);

  if (siswaRes.error) throw siswaRes.error;
  if (mapelRes.error) throw mapelRes.error;
  if (tpRes.error) throw tpRes.error;

  const siswaList = (siswaRes.data ?? []) as Siswa[];
  const mapel = mapelRes.data as MataPelajaran;
  const tpList = filterTpByMapel(
    (tpRes.data ?? []) as TujuanPembelajaran[],
    mapelId,
    defaultMapelId,
  );
  const tpIds = tpList.map((t) => t.id);

  if (siswaList.length === 0 || tpIds.length === 0) return [];

  const [indikatorRes, rubrikRes] = await Promise.all([
    supabase.from("indikator").select("*").in("id_tp", tpIds),
    supabase.from("rubrik").select("*").in("id_tp", tpIds),
  ]);

  if (indikatorRes.error) throw indikatorRes.error;
  if (rubrikRes.error) throw rubrikRes.error;

  const indikatorList = (indikatorRes.data ?? []) as Indikator[];
  const rubrikByTp = new Map(
    ((rubrikRes.data ?? []) as Rubrik[]).map((r) => [r.id_tp, r]),
  );
  const indikatorIds = indikatorList.map((i) => i.id);
  const siswaIds = siswaList.map((s) => s.id);

  const { data: nilaiData, error: nilaiErr } = await supabase
    .from("nilai")
    .select("*")
    .in("id_siswa", siswaIds)
    .in("id_indikator", indikatorIds);

  if (nilaiErr) throw nilaiErr;

  const nilaiRows = (nilaiData ?? []) as Nilai[];
  const nilaiLookup = new Map<string, Nilai>();
  for (const n of nilaiRows) {
    nilaiLookup.set(
      nilaiKey(n.id_siswa, n.id_indikator, n.jenis_asesmen, n.tipe_sumatif),
      n,
    );
  }

  const indikatorByTp = new Map<number, Indikator[]>();
  for (const ind of indikatorList) {
    const arr = indikatorByTp.get(ind.id_tp) ?? [];
    arr.push(ind);
    indikatorByTp.set(ind.id_tp, arr);
  }

  function normalizedNilai(
    siswaId: number,
    indikatorId: number,
    jenis: Nilai["jenis_asesmen"],
    tipe?: Nilai["tipe_sumatif"],
  ): number | null {
    const key = nilaiKey(siswaId, indikatorId, jenis, tipe);
    const row = nilaiLookup.get(key);
    if (!row) return null;
    const tpId = indikatorList.find((i) => i.id === indikatorId)?.id_tp;
    const skala = tpId
      ? (rubrikByTp.get(tpId)?.skala_penilaian ?? "ANGKA")
      : "ANGKA";
    return nilaiToNormalized(row, skala);
  }

  function avgForIndikators(
    siswaId: number,
    inds: Indikator[],
    jenis: Nilai["jenis_asesmen"],
    tipe?: Nilai["tipe_sumatif"],
  ): number | null {
    return rataAngka(
      inds.map((ind) => normalizedNilai(siswaId, ind.id, jenis, tipe)),
    );
  }

  return siswaList.map((siswa) => {
    const formatifScores = indikatorList.map((ind) =>
      normalizedNilai(siswa.id, ind.id, "FORMATIF"),
    );
    const nilaiFormatif = rataAngka(formatifScores);

    const nilaiSumatifLm = avgForIndikators(
      siswa.id,
      indikatorList,
      "SUMATIF",
      "STS",
    );

    const sasInds = indikatorList;
    const nilaiSas = avgForIndikators(siswa.id, sasInds, "SUMATIF", "SAS");

    const nilaiAkhir = hitungNilaiAkhir(
      nilaiFormatif,
      nilaiSumatifLm,
      nilaiSas,
      bobot,
    );

    const nilaiPengetahuan = hitungNilaiPengetahuan(nilaiFormatif, nilaiSas);
    const nilaiKeterampilan = hitungNilaiKeterampilan(nilaiSumatifLm, nilaiSas);

    const tpScores: TpCapaianRef[] = tpList
      .map((tp) => {
        const inds = indikatorByTp.get(tp.id) ?? [];
        const sumatifScores = inds.flatMap((ind) => [
          normalizedNilai(siswa.id, ind.id, "SUMATIF", "STS"),
          normalizedNilai(siswa.id, ind.id, "SUMATIF", "SAS"),
        ]);
        const rata = rataAngka(sumatifScores);
        if (rata == null) return null;
        return {
          id: tp.id,
          kode_tp: tp.kode_tp,
          deskripsi_tp: tp.deskripsi_tp,
          rata,
        };
      })
      .filter((x): x is TpCapaianRef => x != null)
      .sort((a, b) => b.rata - a.rata);

    const tertinggi = tpScores[0] ?? null;
    const terendah = tpScores.length > 1 ? tpScores[tpScores.length - 1] : null;

    const deskripsi = generateDeskripsiCapaian(
      tertinggi,
      terendah,
      mapel.nama_mapel,
    );

    return {
      id_siswa: siswa.id,
      id_mata_pelajaran: mapelId,
      nilai_formatif: nilaiFormatif,
      nilai_sumatif_lm: nilaiSumatifLm,
      nilai_sas: nilaiSas,
      nilai_akhir: nilaiAkhir,
      nilai_pengetahuan: nilaiPengetahuan,
      nilai_keterampilan: nilaiKeterampilan,
      predikat_kualitatif: angkaKePredikat(nilaiAkhir),
      id_tp_tertinggi: tertinggi?.id ?? null,
      id_tp_terendah: terendah?.id ?? null,
      deskripsi_capaian: deskripsi,
    };
  });
}

interface RaporComputeBatchContext {
  siswaList: Siswa[];
  bobot: BobotNa;
  allTp: TujuanPembelajaran[];
  indikatorList: Indikator[];
  indikatorByTp: Map<number, Indikator[]>;
  rubrikByTp: Map<number, Rubrik>;
  nilaiLookup: Map<string, Nilai>;
}

async function loadRaporComputeBatchContext(
  kelasId: number,
  semester: 1 | 2,
): Promise<RaporComputeBatchContext | null> {
  const supabase = createClient();
  const pengaturan = await fetchPengaturanSekolah();
  const bobot: BobotNa = pengaturan
    ? {
        formatif: pengaturan.bobot_formatif ?? DEFAULT_BOBOT.formatif,
        sumatifLm: pengaturan.bobot_sumatif_lm ?? DEFAULT_BOBOT.sumatifLm,
        sas: pengaturan.bobot_sas ?? DEFAULT_BOBOT.sas,
      }
    : DEFAULT_BOBOT;

  const [siswaRes, tpRes] = await Promise.all([
    supabase
      .from("siswa")
      .select("*")
      .eq("id_kelas", kelasId)
      .eq("is_deleted", false)
      .order("nama_siswa"),
    supabase
      .from("tujuan_pembelajaran")
      .select("*")
      .eq("id_kelas", kelasId)
      .eq("semester", semester),
  ]);

  if (siswaRes.error) throw siswaRes.error;
  if (tpRes.error) throw tpRes.error;

  const siswaList = (siswaRes.data ?? []) as Siswa[];
  if (siswaList.length === 0) return null;

  const allTp = (tpRes.data ?? []) as TujuanPembelajaran[];
  const tpIds = allTp.map((t) => t.id);

  if (tpIds.length === 0) {
    return {
      siswaList,
      bobot,
      allTp,
      indikatorList: [],
      indikatorByTp: new Map(),
      rubrikByTp: new Map(),
      nilaiLookup: new Map(),
    };
  }

  const siswaIds = siswaList.map((s) => s.id);
  const [indikatorRes, rubrikRes] = await Promise.all([
    supabase.from("indikator").select("*").in("id_tp", tpIds),
    supabase.from("rubrik").select("*").in("id_tp", tpIds),
  ]);

  if (indikatorRes.error) throw indikatorRes.error;
  if (rubrikRes.error) throw rubrikRes.error;

  const indikatorList = (indikatorRes.data ?? []) as Indikator[];
  const indikatorIds = indikatorList.map((i) => i.id);
  const rubrikByTp = new Map(
    ((rubrikRes.data ?? []) as Rubrik[]).map((r) => [r.id_tp, r]),
  );
  const indikatorByTp = new Map<number, Indikator[]>();
  for (const ind of indikatorList) {
    const arr = indikatorByTp.get(ind.id_tp) ?? [];
    arr.push(ind);
    indikatorByTp.set(ind.id_tp, arr);
  }

  const nilaiLookup = new Map<string, Nilai>();
  if (indikatorIds.length > 0) {
    const { data: nilaiData, error: nilaiErr } = await supabase
      .from("nilai")
      .select("*")
      .in("id_siswa", siswaIds)
      .in("id_indikator", indikatorIds);

    if (nilaiErr) throw nilaiErr;
    for (const n of (nilaiData ?? []) as Nilai[]) {
      nilaiLookup.set(
        nilaiKey(n.id_siswa, n.id_indikator, n.jenis_asesmen, n.tipe_sumatif),
        n,
      );
    }
  }

  return {
    siswaList,
    bobot,
    allTp,
    indikatorList,
    indikatorByTp,
    rubrikByTp,
    nilaiLookup,
  };
}

function computeMapelRowsFromBatchContext(
  ctx: RaporComputeBatchContext,
  mapelId: number,
  mapelNama: string,
  defaultMapelId?: number | null,
): RaporMapelComputed[] {
  const tpList = filterTpByMapel(ctx.allTp, mapelId, defaultMapelId);
  if (tpList.length === 0) return [];

  const indikatorList = tpList.flatMap((tp) => ctx.indikatorByTp.get(tp.id) ?? []);
  if (indikatorList.length === 0) return [];

  function normalizedNilai(
    siswaId: number,
    indikatorId: number,
    jenis: Nilai["jenis_asesmen"],
    tipe?: Nilai["tipe_sumatif"],
  ): number | null {
    const key = nilaiKey(siswaId, indikatorId, jenis, tipe);
    const row = ctx.nilaiLookup.get(key);
    if (!row) return null;
    const tpId = indikatorList.find((i) => i.id === indikatorId)?.id_tp;
    const skala = tpId
      ? (ctx.rubrikByTp.get(tpId)?.skala_penilaian ?? "ANGKA")
      : "ANGKA";
    return nilaiToNormalized(row, skala);
  }

  function avgForIndikators(
    siswaId: number,
    inds: Indikator[],
    jenis: Nilai["jenis_asesmen"],
    tipe?: Nilai["tipe_sumatif"],
  ): number | null {
    return rataAngka(
      inds.map((ind) => normalizedNilai(siswaId, ind.id, jenis, tipe)),
    );
  }

  return ctx.siswaList.map((siswa) => {
    const nilaiFormatif = rataAngka(
      indikatorList.map((ind) =>
        normalizedNilai(siswa.id, ind.id, "FORMATIF"),
      ),
    );

    const nilaiSumatifLm = avgForIndikators(
      siswa.id,
      indikatorList,
      "SUMATIF",
      "STS",
    );
    const nilaiSas = avgForIndikators(
      siswa.id,
      indikatorList,
      "SUMATIF",
      "SAS",
    );

    const nilaiAkhir = hitungNilaiAkhir(
      nilaiFormatif,
      nilaiSumatifLm,
      nilaiSas,
      ctx.bobot,
    );

    const nilaiPengetahuan = hitungNilaiPengetahuan(nilaiFormatif, nilaiSas);
    const nilaiKeterampilan = hitungNilaiKeterampilan(nilaiSumatifLm, nilaiSas);

    const tpScores: TpCapaianRef[] = tpList
      .map((tp) => {
        const inds = ctx.indikatorByTp.get(tp.id) ?? [];
        const sumatifScores = inds.flatMap((ind) => [
          normalizedNilai(siswa.id, ind.id, "SUMATIF", "STS"),
          normalizedNilai(siswa.id, ind.id, "SUMATIF", "SAS"),
        ]);
        const rata = rataAngka(sumatifScores);
        if (rata == null) return null;
        return {
          id: tp.id,
          kode_tp: tp.kode_tp,
          deskripsi_tp: tp.deskripsi_tp,
          rata,
        };
      })
      .filter((x): x is TpCapaianRef => x != null)
      .sort((a, b) => b.rata - a.rata);

    const tertinggi = tpScores[0] ?? null;
    const terendah = tpScores.length > 1 ? tpScores[tpScores.length - 1] : null;

    return {
      id_siswa: siswa.id,
      id_mata_pelajaran: mapelId,
      nilai_formatif: nilaiFormatif,
      nilai_sumatif_lm: nilaiSumatifLm,
      nilai_sas: nilaiSas,
      nilai_akhir: nilaiAkhir,
      nilai_pengetahuan: nilaiPengetahuan,
      nilai_keterampilan: nilaiKeterampilan,
      predikat_kualitatif: angkaKePredikat(nilaiAkhir),
      id_tp_tertinggi: tertinggi?.id ?? null,
      id_tp_terendah: terendah?.id ?? null,
      deskripsi_capaian: generateDeskripsiCapaian(
        tertinggi,
        terendah,
        mapelNama,
      ),
    };
  });
}

/** Hitung NA semua mapel scorable dalam satu batch query (optimasi preview siswa). */
export async function computeRaporMapelBatchForKelas(
  kelasId: number,
  semester: 1 | 2,
  _tahunAjaran: string,
  defaultMapelId?: number | null,
): Promise<Map<number, RaporMapelComputed[]>> {
  const ctx = await loadRaporComputeBatchContext(kelasId, semester);
  const result = new Map<number, RaporMapelComputed[]>();
  if (!ctx) return result;

  const defaultId = defaultMapelId ?? (await resolveDefaultMapelId());
  const mapelList = await fetchMataPelajaranOrdered();

  for (const mapel of mapelList.filter((m) => !m.is_group_header)) {
    result.set(
      mapel.id,
      computeMapelRowsFromBatchContext(ctx, mapel.id, mapel.nama_mapel, defaultId),
    );
  }

  return result;
}

async function fetchP5CapaianForSiswa(
  siswaId: number,
  kelasId: number,
  semester: 1 | 2,
): Promise<SiswaP5Capaian[]> {
  const supabase = createClient();
  const { data: projekRows, error: projekErr } = await supabase
    .from("projek_p5")
    .select("id")
    .eq("id_kelas", kelasId)
    .eq("semester", semester);

  if (projekErr) throw projekErr;

  const projekIds = (projekRows ?? []).map((p) => p.id);
  if (projekIds.length === 0) return [];

  const { data: p5Rows, error: p5Err } = await supabase
    .from("siswa_p5_capaian")
    .select("*")
    .eq("id_siswa", siswaId)
    .in("id_projek", projekIds);

  if (p5Err) throw p5Err;
  return (p5Rows ?? []) as SiswaP5Capaian[];
}

function mapStoredRaporToComputed(row: RaporMapel): RaporMapelComputed {
  return {
    id_siswa: row.id_siswa,
    id_mata_pelajaran: row.id_mata_pelajaran,
    nilai_formatif: row.nilai_formatif,
    nilai_sumatif_lm: row.nilai_sumatif_lm,
    nilai_sas: row.nilai_sas,
    nilai_akhir: row.nilai_akhir,
    nilai_pengetahuan: row.nilai_pengetahuan ?? null,
    nilai_keterampilan: row.nilai_keterampilan ?? null,
    predikat_kualitatif: row.predikat_kualitatif,
    id_tp_tertinggi: row.id_tp_tertinggi,
    id_tp_terendah: row.id_tp_terendah,
    deskripsi_capaian: row.deskripsi_capaian ?? "",
  };
}

export type RaporPreviewSource = "computed" | "stored" | "empty" | "mixed";

export interface RaporPreviewResult {
  rows: RaporMapelComputed[];
  source: RaporPreviewSource;
}

/**
 * Pratinjau NA: hitung dari penilaian (TP) bila ada;
 * fallback ke baris rapor_mapel tersimpan (mis. setelah seed / Simpan Mapel).
 */
export async function previewRaporMapelForKelas(
  kelasId: number,
  semester: 1 | 2,
  mapelId: number,
  tahunAjaran: string,
  defaultMapelId?: number | null,
): Promise<RaporPreviewResult> {
  const supabase = createClient();
  const { data: mapelRow, error: mapelErr } = await supabase
    .from("mata_pelajaran")
    .select("*")
    .eq("id", mapelId)
    .maybeSingle();

  if (mapelErr) throw mapelErr;
  const mapel = mapelRow as MataPelajaran | null;
  if (!mapel || !mapel.is_active || mapel.is_group_header) {
    return { rows: [], source: "empty" };
  }

  const computed = await computeRaporMapelForKelas(
    kelasId,
    semester,
    mapelId,
    tahunAjaran,
    defaultMapelId,
  );
  if (computed.length > 0) {
    return { rows: computed, source: "computed" };
  }

  const stored = await fetchRaporMapelForKelas(
    kelasId,
    semester,
    tahunAjaran,
    mapelId,
  );
  if (stored.length > 0) {
    return {
      rows: stored.map(mapStoredRaporToComputed),
      source: "stored",
    };
  }

  return { rows: [], source: "empty" };
}

async function resolveDefaultMapelId(): Promise<number | null> {
  const mapelList = await fetchMataPelajaranOrdered();
  return (
    mapelList.find((m) => m.is_default && !m.is_group_header)?.id ??
    mapelList.find((m) => !m.is_group_header)?.id ??
    null
  );
}

function computedHasScores(row: RaporMapelComputed): boolean {
  return (
    row.nilai_akhir != null ||
    row.nilai_formatif != null ||
    row.nilai_sas != null ||
    row.nilai_sumatif_lm != null
  );
}

function computedToRaporMapelRow(
  computed: RaporMapelComputed,
  stored: RaporMapel | undefined,
  kelasId: number,
  guruId: number,
  semester: 1 | 2,
  tahunAjaran: string,
  mapel: MataPelajaran,
): RaporMapel & {
  mata_pelajaran?: Pick<
    MataPelajaran,
    "nama_mapel" | "kode_mapel" | "kelompok_mapel" | "parent_id" | "urutan" | "is_group_header"
  >;
} {
  const manualDeskripsi =
    stored?.deskripsi_sumber === "manual" ? stored.deskripsi_capaian : null;

  return {
    id: stored?.id ?? 0,
    id_siswa: computed.id_siswa,
    id_kelas: kelasId,
    id_mata_pelajaran: computed.id_mata_pelajaran,
    id_guru: stored?.id_guru ?? guruId,
    semester,
    tahun_ajaran: tahunAjaran,
    nilai_formatif: computed.nilai_formatif,
    nilai_sumatif_lm: computed.nilai_sumatif_lm,
    nilai_sas: computed.nilai_sas,
    nilai_akhir: computed.nilai_akhir,
    nilai_pengetahuan: computed.nilai_pengetahuan,
    nilai_keterampilan: computed.nilai_keterampilan,
    predikat_kualitatif: computed.predikat_kualitatif,
    predikat_huruf: stored?.predikat_huruf ?? null,
    id_tp_tertinggi: computed.id_tp_tertinggi,
    id_tp_terendah: computed.id_tp_terendah,
    deskripsi_capaian: manualDeskripsi ?? computed.deskripsi_capaian,
    deskripsi_sumber: manualDeskripsi != null ? "manual" : "auto",
    updated_at: stored?.updated_at ?? new Date().toISOString(),
    mata_pelajaran: {
      nama_mapel: mapel.nama_mapel,
      kode_mapel: mapel.kode_mapel,
      kelompok_mapel: mapel.kelompok_mapel,
      parent_id: mapel.parent_id,
      urutan: mapel.urutan,
      is_group_header: mapel.is_group_header,
    },
  };
}

async function mergeLiveRaporMapelForSiswa(
  siswaId: number,
  kelasId: number,
  semester: 1 | 2,
  tahunAjaran: string,
  storedRows: RaporMapel[],
  guruId: number,
): Promise<{ rows: RaporMapel[]; source: RaporPreviewSource }> {
  const mapelList = await fetchMataPelajaranOrdered();
  const defaultMapelId = await resolveDefaultMapelId();
  const scorable = mapelList.filter((m) => !m.is_group_header);
  const storedByMapel = new Map(
    storedRows.map((row) => [row.id_mata_pelajaran, row]),
  );

  const computedBatch = await computeRaporMapelBatchForKelas(
    kelasId,
    semester,
    tahunAjaran,
    defaultMapelId,
  );

  const merged: RaporMapel[] = [];
  let liveCount = 0;
  let storedOnlyCount = 0;

  for (const mapel of scorable) {
    const computed = computedBatch.get(mapel.id) ?? [];
    const live = computed.find((c) => c.id_siswa === siswaId);
    const stored = storedByMapel.get(mapel.id);
    storedByMapel.delete(mapel.id);

    if (live && computedHasScores(live)) {
      merged.push(
        computedToRaporMapelRow(
          live,
          stored,
          kelasId,
          guruId,
          semester,
          tahunAjaran,
          mapel,
        ),
      );
      liveCount += 1;
    } else if (stored) {
      merged.push(stored);
      storedOnlyCount += 1;
    }
  }

  const source: RaporPreviewSource =
    liveCount > 0 && storedOnlyCount > 0
      ? "mixed"
      : liveCount > 0
        ? "computed"
        : storedOnlyCount > 0
          ? "stored"
          : "empty";

  return { rows: merged, source };
}

export async function syncRaporMapelToDatabase(
  kelasId: number,
  semester: 1 | 2,
  mapelId: number,
  tahunAjaran: string,
  defaultMapelId?: number | null,
): Promise<number> {
  const guru = await fetchCurrentGuru();
  const defaultId = defaultMapelId ?? (await resolveDefaultMapelId());
  const computed = await computeRaporMapelForKelas(
    kelasId,
    semester,
    mapelId,
    tahunAjaran,
    defaultId,
  );

  if (computed.length === 0) return 0;

  const supabase = createClient();
  const rows = computed.map((c) => ({
    id_siswa: c.id_siswa,
    id_kelas: kelasId,
    id_mata_pelajaran: mapelId,
    id_guru: guru.id,
    semester,
    tahun_ajaran: tahunAjaran,
    nilai_formatif: c.nilai_formatif,
    nilai_sumatif_lm: c.nilai_sumatif_lm,
    nilai_sas: c.nilai_sas,
    nilai_akhir: c.nilai_akhir,
    nilai_pengetahuan: c.nilai_pengetahuan,
    nilai_keterampilan: c.nilai_keterampilan,
    predikat_kualitatif: c.predikat_kualitatif,
    id_tp_tertinggi: c.id_tp_tertinggi,
    id_tp_terendah: c.id_tp_terendah,
    deskripsi_capaian: c.deskripsi_capaian,
    deskripsi_sumber: "auto" as const,
  }));

  const { error } = await upsertRaporMapelRows(supabase, rows);
  if (error) throw error;
  return rows.length;
}

async function upsertRaporMapelRows(
  supabase: ReturnType<typeof createClient>,
  rows: Array<Record<string, unknown>>,
) {
  let result = await supabase.from("rapor_mapel").upsert(rows, {
    onConflict: "id_siswa,id_mata_pelajaran,semester,tahun_ajaran",
  });
  if (
    result.error &&
    (result.error.message.includes("nilai_pengetahuan") ||
      result.error.message.includes("nilai_keterampilan") ||
      result.error.message.includes("Could not find") ||
      result.error.message.includes("does not exist"))
  ) {
    const slim = rows.map(({ nilai_pengetahuan, nilai_keterampilan, ...rest }) => rest);
    result = await supabase.from("rapor_mapel").upsert(slim, {
      onConflict: "id_siswa,id_mata_pelajaran,semester,tahun_ajaran",
    });
  }
  return result;
}

/** Simpan rekap rapor untuk semua mapel aktif guru (kecuali baris header grup). */
export async function syncAllRaporMapelForKelas(
  kelasId: number,
  semester: 1 | 2,
  tahunAjaran: string,
): Promise<number> {
  const mapelList = await fetchMataPelajaranOrdered();
  const scorable = mapelList.filter((m) => !m.is_group_header);

  let total = 0;
  for (const mapel of scorable) {
    total += await syncRaporMapelToDatabase(
      kelasId,
      semester,
      mapel.id,
      tahunAjaran,
    );
  }
  return total;
}

export async function fetchERaporPreview(
  siswaId: number,
  kelasId: number,
  semester: 1 | 2,
  tahunAjaran: string,
): Promise<ERaporPreviewData> {
  const supabase = createClient();
  const guru = await fetchCurrentGuru();
  const pengaturan = await fetchPengaturanSekolah();

  const mapelJoinSelect =
    "*, mata_pelajaran(nama_mapel, kode_mapel, kelompok_mapel, parent_id, urutan, is_group_header)";
  const mapelJoinFallback = "*, mata_pelajaran(nama_mapel, kode_mapel)";

  let raporMapelRes = await supabase
    .from("rapor_mapel")
    .select(mapelJoinSelect)
    .eq("id_siswa", siswaId)
    .eq("semester", semester)
    .eq("tahun_ajaran", tahunAjaran);
  if (
    raporMapelRes.error &&
    (raporMapelRes.error.message.includes("Could not find") ||
      raporMapelRes.error.message.includes("does not exist"))
  ) {
    raporMapelRes = await supabase
      .from("rapor_mapel")
      .select(mapelJoinFallback)
      .eq("id_siswa", siswaId)
      .eq("semester", semester)
      .eq("tahun_ajaran", tahunAjaran);
  }

  const [kelasRes, siswaRes, eRaporRes, kehadiranRes] = await Promise.all([
      supabase.from("kelas").select("*").eq("id", kelasId).single(),
      supabase.from("siswa").select("*").eq("id", siswaId).single(),
      supabase
        .from("e_rapor")
        .select("*")
        .eq("id_siswa", siswaId)
        .eq("semester", semester)
        .eq("tahun_ajaran", tahunAjaran)
        .maybeSingle(),
      supabase
        .from("rapor_kehadiran")
        .select("*")
        .eq("id_siswa", siswaId)
        .eq("semester", semester)
        .eq("tahun_ajaran", tahunAjaran)
        .maybeSingle(),
    ]);

  if (kelasRes.error) throw kelasRes.error;
  if (siswaRes.error) throw siswaRes.error;
  if (raporMapelRes.error) throw raporMapelRes.error;

  const { data: ekskulRows } = await supabase
    .from("siswa_ekstrakurikuler")
    .select("*, ekstrakurikuler(nama_ekskul)")
    .eq("id_siswa", siswaId)
    .eq("semester", semester)
    .eq("tahun_ajaran", tahunAjaran);

  const p5Capaian = await fetchP5CapaianForSiswa(siswaId, kelasId, semester);

  const defaultMapel: MataPelajaran = {
    id: 0,
    id_guru: guru.id,
    kode_mapel: null,
    nama_mapel: guru.mata_pelajaran,
    is_default: true,
    is_active: true,
    created_at: "",
  };

  const ekskul = (ekskulRows ?? []).map((row) => {
    const r = row as SiswaEkstrakurikuler & {
      ekstrakurikuler: { nama_ekskul: string } | null;
    };
    return {
      ...r,
      nama_ekskul: r.ekstrakurikuler?.nama_ekskul ?? "Ekstrakurikuler",
    };
  });

  const mapelList = await fetchMataPelajaranOrdered();

  const storedRaporMapel = (raporMapelRes.data ?? []) as RaporMapel[];
  const { rows: raporMapel, source: raporMapelSource } =
    await mergeLiveRaporMapelForSiswa(
      siswaId,
      kelasId,
      semester,
      tahunAjaran,
      storedRaporMapel,
      guru.id,
    );

  return {
    pengaturan,
    guru,
    kelas: kelasRes.data as Kelas,
    semester,
    tahunAjaran,
    mapel: defaultMapel,
    siswa: siswaRes.data as Siswa,
    eRapor: (eRaporRes.data as ERapor | null) ?? null,
    raporMapel,
    raporMapelSource,
    kehadiran: (kehadiranRes.data as RaporKehadiran | null) ?? null,
    ekstrakurikuler: ekskul,
    p5Capaian,
    mapelList,
  };
}

export async function updateDeskripsiRaporMapel(
  raporMapelId: number,
  deskripsi: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("rapor_mapel")
    .update({ deskripsi_capaian: deskripsi, deskripsi_sumber: "manual" })
    .eq("id", raporMapelId);

  if (error) throw error;
}
