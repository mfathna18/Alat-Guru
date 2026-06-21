"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import {
  fetchKelasList,
  fetchPenilaianWorkspace,
  type SumatifPenilaianContext,
} from "@/lib/services/penilaian";
import { upsertNilaiBatch } from "@/lib/services/nilai";
import type { JenisAsesmen, NilaiUpsertInput } from "@/lib/types/database";

function penilaianScopeKey(
  semester: 1 | 2,
  mapelId: number,
  jenisAsesmen: JenisAsesmen,
  sumatifCtx?: SumatifPenilaianContext,
) {
  if (jenisAsesmen !== "SUMATIF") {
    return `${semester}-${mapelId}-${jenisAsesmen}`;
  }
  const tipe = sumatifCtx?.tipe ?? "SAS";
  return `${semester}-${mapelId}-${jenisAsesmen}-${tipe}`;
}

export function useKelasList() {
  return useQuery({
    queryKey: queryKeys.kelas.all,
    queryFn: fetchKelasList,
  });
}

export function usePenilaianWorkspace(
  kelasId: number | null,
  semester: 1 | 2,
  jenisAsesmen: JenisAsesmen,
  mapelId: number | null,
  defaultMapelId?: number | null,
  sumatifCtx?: SumatifPenilaianContext,
) {
  const scope = penilaianScopeKey(
    semester,
    mapelId ?? 0,
    jenisAsesmen,
    sumatifCtx,
  );

  return useQuery({
    queryKey: queryKeys.nilai.byKelas(kelasId ?? 0, scope),
    queryFn: () =>
      fetchPenilaianWorkspace(
        kelasId!,
        semester,
        jenisAsesmen,
        mapelId!,
        defaultMapelId,
        sumatifCtx,
      ),
    enabled: kelasId != null && kelasId > 0 && mapelId != null && mapelId > 0,
  });
}

export function useUpsertNilai(
  kelasId: number | null,
  semester: 1 | 2,
  jenisAsesmen: JenisAsesmen,
  mapelId: number | null,
  sumatifCtx?: SumatifPenilaianContext,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entry: NilaiUpsertInput) => upsertNilaiBatch([entry]),
    onSuccess: () => {
      if (!kelasId || !mapelId) return;

      void queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "nilai" &&
          query.queryKey[1] === "kelas" &&
          query.queryKey[2] === kelasId,
      });

      void queryClient.invalidateQueries({ queryKey: queryKeys.eRapor.all });
    },
  });
}
