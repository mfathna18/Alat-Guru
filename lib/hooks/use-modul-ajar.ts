"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import {
  createModulAjar,
  deleteModulAjar,
  duplicateModulAjar,
  fetchModulAjarWorkspace,
  fetchModulByKelasMapel,
  updateModulAjar,
  upsertModulProgress,
} from "@/lib/services/modul-ajar";

export function useModulAjarWorkspace() {
  return useQuery({
    queryKey: queryKeys.modulAjar.all,
    queryFn: fetchModulAjarWorkspace,
  });
}

export function useModulByKelasMapel(kelasId: number, mapelId: number) {
  return useQuery({
    queryKey: queryKeys.modulAjar.byKelasMapel(kelasId, mapelId),
    queryFn: () => fetchModulByKelasMapel(kelasId, mapelId),
    enabled: kelasId > 0 && mapelId > 0,
  });
}

export function useCreateModulAjar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      kelasId,
      mapelId,
      judul,
    }: {
      kelasId: number;
      mapelId: number;
      judul: string;
    }) => createModulAjar(kelasId, mapelId, judul),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.modulAjar.all });
    },
  });
}

export function useDuplicateModulAjar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sourceModulId,
      targetKelasId,
      targetMapelId,
    }: {
      sourceModulId: number;
      targetKelasId: number;
      targetMapelId: number;
    }) => duplicateModulAjar(sourceModulId, targetKelasId, targetMapelId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.modulAjar.all });
    },
  });
}

export function useUpdateModulAjar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ modulId, judul }: { modulId: number; judul: string }) =>
      updateModulAjar(modulId, judul),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.modulAjar.all });
    },
  });
}

export function useDeleteModulAjar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteModulAjar,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.modulAjar.all });
    },
  });
}

export function useUpsertModulProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      kelasId,
      modulId,
      selesai,
    }: {
      kelasId: number;
      modulId: number;
      selesai: boolean;
    }) => upsertModulProgress(kelasId, modulId, selesai),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.modulAjar.all });
    },
  });
}
