export type MapelKelompok = "A" | "B" | "C" | "L";

export interface ManMapelSeedItem {
  key: string;
  nama_mapel: string;
  kelompok_mapel: MapelKelompok;
  urutan: number;
  is_group_header?: boolean;
  parent_key?: string;
}

/** Struktur mapel SMA IPS — acuan template MAN Semester Ganjil. */
export const MAN_SMA_IPS_MAPEL_SEED: ManMapelSeedItem[] = [
  {
    key: "quran",
    nama_mapel: "Al Qur'an Hadis",
    kelompok_mapel: "A",
    urutan: 11,
  },
  {
    key: "akidah",
    nama_mapel: "Akidah Akhlak",
    kelompok_mapel: "A",
    urutan: 12,
  },
  {
    key: "fikih",
    nama_mapel: "Fikih",
    kelompok_mapel: "A",
    urutan: 13,
  },
  {
    key: "ski",
    nama_mapel: "Sejarah Kebudayaan Islam",
    kelompok_mapel: "A",
    urutan: 14,
  },
  { key: "ppkn", nama_mapel: "PPKn", kelompok_mapel: "A", urutan: 20 },
  {
    key: "bindo",
    nama_mapel: "Bahasa Indonesia",
    kelompok_mapel: "A",
    urutan: 30,
  },
  { key: "barab", nama_mapel: "Bahasa Arab", kelompok_mapel: "A", urutan: 40 },
  { key: "mtk", nama_mapel: "Matematika", kelompok_mapel: "A", urutan: 50 },
  {
    key: "sejindo",
    nama_mapel: "Sejarah Indonesia",
    kelompok_mapel: "A",
    urutan: 60,
  },
  {
    key: "bing",
    nama_mapel: "Bahasa Inggris",
    kelompok_mapel: "A",
    urutan: 70,
  },
  {
    key: "senbud",
    nama_mapel: "Seni Budaya",
    kelompok_mapel: "B",
    urutan: 10,
  },
  { key: "pjok", nama_mapel: "PJOK", kelompok_mapel: "B", urutan: 20 },
  {
    key: "prakarya",
    nama_mapel: "Prakarya dan Kewirausahaan",
    kelompok_mapel: "B",
    urutan: 30,
  },
  { key: "geo", nama_mapel: "Geografi", kelompok_mapel: "C", urutan: 10 },
  { key: "sejarah", nama_mapel: "Sejarah", kelompok_mapel: "C", urutan: 20 },
  {
    key: "sosiologi",
    nama_mapel: "Sosiologi",
    kelompok_mapel: "C",
    urutan: 30,
  },
  { key: "ekonomi", nama_mapel: "Ekonomi", kelompok_mapel: "C", urutan: 40 },
  {
    key: "bing_sastra",
    nama_mapel: "Bahasa dan Sastra Inggris",
    kelompok_mapel: "L",
    urutan: 10,
  },
  {
    key: "informatika",
    nama_mapel: "Informatika",
    kelompok_mapel: "L",
    urutan: 20,
  },
];

export const DEFAULT_RAPOR_SLOGAN =
  "Belajar adalah Ibadah. Prestasi untuk Dakwah";
