/** NIS opsional — nilai kosong/whitespace dianggap tidak ada. */
export function siswaNisTrimmed(nis?: string | null): string | null {
  const v = nis?.trim();
  return v ? v : null;
}

export function siswaHasNis(nis?: string | null): boolean {
  return siswaNisTrimmed(nis) != null;
}
