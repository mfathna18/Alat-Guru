"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import {
  createIndikator,
  createTp,
  deleteIndikator,
  deleteTp,
  fetchTpWithRelations,
  updateIndikator,
  updateTp,
  upsertRubrik,
} from "@/lib/services/tp";
import type { SkalaPenilaian } from "@/lib/types/database";

function tpQueryKey(
  kelasId: number,
  semester: 1 | 2,
  mapelId?: number | null,
) {
  return [...queryKeys.tp.byKelas(kelasId, semester), mapelId ?? 0] as const;
}

export function useTpList(
  kelasId: number | null,
  semester: 1 | 2,
  mapelId?: number | null,
  defaultMapelId?: number | null,
) {
  return useQuery({
    queryKey: tpQueryKey(kelasId ?? 0, semester, mapelId),
    queryFn: () =>
      fetchTpWithRelations(kelasId!, semester, mapelId, defaultMapelId),
    enabled: kelasId != null && kelasId > 0 && mapelId != null && mapelId > 0,
  });
}

export function useCreateTp(kelasId: number | null, semester: 1 | 2) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTp,
    onSuccess: () => {
      if (kelasId) {
        qc.invalidateQueries({
          queryKey: queryKeys.tp.byKelas(kelasId, semester),
        });
        qc.invalidateQueries({ queryKey: ["nilai"] });
      }
    },
  });
}

export function useUpdateTp(
  kelasId: number | null,
  semester: 1 | 2,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      tpId,
      ...input
    }: {
      tpId: number;
      kode_tp: string;
      deskripsi_tp: string;
      id_mata_pelajaran?: number;
    }) => updateTp(tpId, input),
    onSuccess: () => {
      if (kelasId) {
        qc.invalidateQueries({
          queryKey: queryKeys.tp.byKelas(kelasId, semester),
        });
        qc.invalidateQueries({ queryKey: ["nilai"] });
      }
    },
  });
}

export function useDeleteTp(kelasId: number | null, semester: 1 | 2) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTp,
    onSuccess: () => {
      if (kelasId) {
        qc.invalidateQueries({
          queryKey: queryKeys.tp.byKelas(kelasId, semester),
        });
        qc.invalidateQueries({ queryKey: ["nilai"] });
      }
    },
  });
}

export function useCreateIndikator(kelasId: number | null, semester: 1 | 2) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createIndikator,
    onSuccess: () => {
      if (kelasId) {
        qc.invalidateQueries({
          queryKey: queryKeys.tp.byKelas(kelasId, semester),
        });
      }
    },
  });
}

export function useUpdateIndikator(kelasId: number | null, semester: 1 | 2) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      indikatorId,
      ...input
    }: {
      indikatorId: number;
      kode_indikator: string;
      deskripsi_indikator: string;
    }) => updateIndikator(indikatorId, input),
    onSuccess: () => {
      if (kelasId) {
        qc.invalidateQueries({
          queryKey: queryKeys.tp.byKelas(kelasId, semester),
        });
      }
    },
  });
}

export function useDeleteIndikator(kelasId: number | null, semester: 1 | 2) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteIndikator,
    onSuccess: () => {
      if (kelasId) {
        qc.invalidateQueries({
          queryKey: queryKeys.tp.byKelas(kelasId, semester),
        });
        qc.invalidateQueries({ queryKey: ["nilai"] });
      }
    },
  });
}

export function useUpsertRubrik(kelasId: number | null, semester: 1 | 2) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      tpId,
      skala,
      kriteria_json,
    }: {
      tpId: number;
      skala: SkalaPenilaian;
      kriteria_json?: Record<string, string> | null;
    }) => upsertRubrik(tpId, skala, kriteria_json),
    onSuccess: () => {
      if (kelasId) {
        qc.invalidateQueries({
          queryKey: queryKeys.tp.byKelas(kelasId, semester),
        });
      }
    },
  });
}
