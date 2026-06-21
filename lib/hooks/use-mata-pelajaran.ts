"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import {
  createMataPelajaran,
  deleteMataPelajaran,
  seedJenjangMapel,
  updateMataPelajaran,
} from "@/lib/services/mata-pelajaran";
import type { JenjangSekolah } from "@/lib/types/database";

function invalidateMapelQueries(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: queryKeys.eRapor.mapel });
  void qc.invalidateQueries({ queryKey: queryKeys.eRapor.all });
  void qc.invalidateQueries({ queryKey: ["lingkup-materi"] });
}

export function useCreateMataPelajaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createMataPelajaran,
    onSuccess: () => invalidateMapelQueries(qc),
  });
}

export function useUpdateMataPelajaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      mapelId,
      patch,
    }: {
      mapelId: number;
      patch: { nama_mapel?: string; kode_mapel?: string | null };
    }) => updateMataPelajaran(mapelId, patch),
    onSuccess: () => invalidateMapelQueries(qc),
  });
}

export function useDeleteMataPelajaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteMataPelajaran,
    onSuccess: () => invalidateMapelQueries(qc),
  });
}

export function useSeedJenjangMapel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jenjang: JenjangSekolah) => seedJenjangMapel(jenjang),
    onSuccess: () => invalidateMapelQueries(qc),
  });
}
