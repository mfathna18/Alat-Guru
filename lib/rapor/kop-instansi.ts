export const DEFAULT_KOP_INSTANSI = "Pemerintah · Dinas Pendidikan";

export function getKopInstansiText(
  pengaturan: { kop_instansi?: string | null } | null | undefined,
): string {
  const custom = pengaturan?.kop_instansi?.trim();
  return custom || DEFAULT_KOP_INSTANSI;
}
