"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import {
  fetchERaporPreview,
  fetchMataPelajaranList,
  fetchRaporMapelForKelas,
  previewRaporMapelForKelas,
  syncRaporMapelToDatabase,
  syncAllRaporMapelForKelas,
} from "@/lib/services/e-rapor";
import { updateMataPelajaranMeta } from "@/lib/services/mata-pelajaran";
import type { MapelKelompok } from "@/lib/types/database";

export function useMataPelajaranList() {
  return useQuery({
    queryKey: queryKeys.eRapor.mapel,
    queryFn: fetchMataPelajaranList,
  });
}

export function useRaporMapel(
  kelasId: number | null,
  semester: 1 | 2,
  tahunAjaran: string,
  mapelId: number | null,
) {
  return useQuery({
    queryKey: queryKeys.eRapor.raporMapel(
      kelasId ?? 0,
      semester,
      tahunAjaran,
      mapelId ?? 0,
    ),
    queryFn: () =>
      fetchRaporMapelForKelas(kelasId!, semester, tahunAjaran, mapelId!),
    enabled: Boolean(kelasId && mapelId && tahunAjaran),
  });
}

export function useRaporComputed(
  kelasId: number | null,
  semester: 1 | 2,
  mapelId: number | null,
  tahunAjaran: string,
  enabled: boolean,
  defaultMapelId?: number | null,
) {
  return useQuery({
    queryKey: queryKeys.eRapor.computed(
      kelasId ?? 0,
      semester,
      tahunAjaran,
      mapelId ?? 0,
    ),
    queryFn: () =>
      previewRaporMapelForKelas(
        kelasId!,
        semester,
        mapelId!,
        tahunAjaran,
        defaultMapelId,
      ),
    enabled: Boolean(enabled && kelasId && mapelId && tahunAjaran),
  });
}

export function useSyncRaporMapel(
  kelasId: number,
  semester: 1 | 2,
  mapelId: number,
  tahunAjaran: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      syncRaporMapelToDatabase(kelasId, semester, mapelId, tahunAjaran),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.eRapor.all });
    },
  });
}

export function useSyncAllRaporMapel(
  kelasId: number,
  semester: 1 | 2,
  tahunAjaran: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      syncAllRaporMapelForKelas(kelasId, semester, tahunAjaran),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.eRapor.all });
    },
  });
}

export function useERaporPreview(
  siswaId: number,
  kelasId: number,
  semester: 1 | 2,
  tahunAjaran: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.eRapor.preview(siswaId, semester, tahunAjaran),
    queryFn: () =>
      fetchERaporPreview(siswaId, kelasId, semester, tahunAjaran),
    enabled: Boolean(enabled && siswaId && kelasId && tahunAjaran),
  });
}

export function useUpdateMapelKelompok() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      mapelId,
      kelompok,
    }: {
      mapelId: number;
      kelompok: MapelKelompok;
    }) => updateMataPelajaranMeta(mapelId, { kelompok_mapel: kelompok }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.eRapor.mapel });
      void qc.invalidateQueries({ queryKey: queryKeys.eRapor.all });
    },
  });
}
