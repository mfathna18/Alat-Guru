import type { SkalaPenilaian } from "@/lib/types/database";

export function skalaLabel(skala: SkalaPenilaian | string) {
  switch (skala) {
    case "ANGKA":
      return "Angka 1–100";
    case "HURUF":
      return "Huruf A–E";
    default:
      return skala;
  }
}

export function skalaShort(skala: SkalaPenilaian | string) {
  switch (skala) {
    case "ANGKA":
      return "1–100";
    case "HURUF":
      return "A–E";
    default:
      return String(skala);
  }
}
