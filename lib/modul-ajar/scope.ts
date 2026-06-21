/** Kunci modul per kombinasi kelas × mapel. */
export function modulScopeKey(kelasId: number, mapelId: number) {
  return `${kelasId}-${mapelId}`;
}
