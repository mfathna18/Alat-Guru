import type { JenjangSekolah } from "@/lib/types/database";

export const JENJANG_SEKOLAH_OPTIONS: {
  value: JenjangSekolah;
  label: string;
}[] = [
  { value: "SD", label: "Sekolah Dasar (SD/MI)" },
  { value: "SMP", label: "Sekolah Menengah Pertama (SMP/MTS)" },
  { value: "SMA", label: "Sekolah Menengah Atas (SMA/MA/SMK)" },
];

export const JENJANG_SEKOLAH_LABEL: Record<JenjangSekolah, string> = {
  SD: "Sekolah Dasar (SD/MI)",
  SMP: "Sekolah Menengah Pertama (SMP/MTS)",
  SMA: "Sekolah Menengah Atas (SMA/MA/SMK)",
};

/** Mapel inti per jenjang — hanya ditambahkan jika belum ada (tidak menghapus mapel kustom). */
export const JENJANG_MAPEL_SEED: Record<JenjangSekolah, readonly string[]> = {
  SD: [
    "Pendidikan Agama dan Budi Pekerti",
    "Pendidikan Pancasila",
    "Bahasa Indonesia",
    "Matematika",
    "Ilmu Pengetahuan Alam dan Sosial",
    "Pendidikan Jasmani, Olahraga, dan Kesehatan",
    "Seni dan Budaya",
    "Bahasa Inggris",
  ],
  SMP: [
    "Pendidikan Agama dan Budi Pekerti",
    "Pendidikan Pancasila",
    "Bahasa Indonesia",
    "Matematika",
    "Ilmu Pengetahuan Alam",
    "Ilmu Pengetahuan Sosial",
    "Bahasa Inggris",
    "Informatika",
    "Pendidikan Jasmani, Olahraga, dan Kesehatan",
    "Seni dan Prakarya",
  ],
  SMA: [
    "Pendidikan Agama dan Budi Pekerti",
    "Pendidikan Pancasila",
    "Bahasa Indonesia",
    "Matematika",
    "Bahasa Inggris",
    "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)",
    "Sejarah",
    "Seni dan Budaya",
  ],
};

export function isJenjangSekolah(value: string): value is JenjangSekolah {
  return value === "SD" || value === "SMP" || value === "SMA";
}
