export const queryKeys = {
  guru: {
    profile: ["guru", "profile"] as const,
  },
  pengaturan: {
    all: ["pengaturan-sekolah"] as const,
    byGuru: (guruId: number) => ["pengaturan-sekolah", guruId] as const,
  },
  kelas: {
    all: ["kelas"] as const,
    byGuru: (guruId: number) => ["kelas", "guru", guruId] as const,
    detail: (kelasId: number) => ["kelas", kelasId] as const,
  },
  siswa: {
    byKelas: (kelasId: number, includeDeleted = false) =>
      ["siswa", "kelas", kelasId, { includeDeleted }] as const,
    detail: (siswaId: number) => ["siswa", siswaId] as const,
  },
  tp: {
    byKelas: (kelasId: number, semester?: 1 | 2) =>
      ["tp", "kelas", kelasId, semester ?? "all"] as const,
    detail: (tpId: number) => ["tp", tpId] as const,
  },
  indikator: {
    byTp: (tpId: number) => ["indikator", "tp", tpId] as const,
  },
  rubrik: {
    byTp: (tpId: number) => ["rubrik", "tp", tpId] as const,
  },
  nilai: {
    byKelas: (kelasId: number, jenisAsesmen?: string) =>
      ["nilai", "kelas", kelasId, jenisAsesmen ?? "all"] as const,
    bySiswa: (siswaId: number) => ["nilai", "siswa", siswaId] as const,
  },
  absensi: {
    byKelasDate: (kelasId: number, tanggal: string) =>
      ["absensi", "kelas", kelasId, tanggal] as const,
    byKelasRange: (kelasId: number, start: string, end: string) =>
      ["absensi", "kelas", kelasId, "range", start, end] as const,
  },
  modulAjar: {
    all: ["modul-ajar"] as const,
    byKelas: (kelasId: number) => ["modul-ajar", "kelas", kelasId] as const,
    byKelasMapel: (kelasId: number, mapelId: number) =>
      ["modul-ajar", "kelas", kelasId, "mapel", mapelId] as const,
  },
  billing: {
    overview: ["billing", "overview"] as const,
  },
  eRapor: {
    all: ["e-rapor"] as const,
    mapel: ["e-rapor", "mapel"] as const,
    raporMapel: (
      kelasId: number,
      semester: 1 | 2,
      tahunAjaran: string,
      mapelId: number,
    ) => ["e-rapor", "mapel-rows", kelasId, semester, tahunAjaran, mapelId] as const,
    computed: (
      kelasId: number,
      semester: 1 | 2,
      tahunAjaran: string,
      mapelId: number,
    ) => ["e-rapor", "computed", kelasId, semester, tahunAjaran, mapelId] as const,
    preview: (siswaId: number, semester: 1 | 2, tahunAjaran: string) =>
      ["e-rapor", "preview", siswaId, semester, tahunAjaran] as const,
  },
  sikapRapor: {
    workspace: (kelasId: number, semester: 1 | 2, tahunAjaran: string) =>
      ["sikap-rapor", "workspace", kelasId, semester, tahunAjaran] as const,
  },
} as const;
