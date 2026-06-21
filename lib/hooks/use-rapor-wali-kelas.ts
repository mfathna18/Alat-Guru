"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import {
  createEkstrakurikuler,
  deleteEkstrakurikuler,
  deleteSiswaEkstrakurikuler,
  fetchRaporWaliKelasWorkspace,
  upsertERaporSikapCatatan,
  upsertSiswaEkstrakurikuler,
  type ERaporSikapCatatanInput,
  type SiswaEkstrakurikulerInput,
} from "@/lib/services/rapor-wali-kelas";

function workspaceKey(
  kelasId: number,
  semester: 1 | 2,
  tahunAjaran: string,
) {
  return queryKeys.sikapRapor.workspace(kelasId, semester, tahunAjaran);
}

export function useRaporWaliKelasWorkspace(
  kelasId: number | null,
  semester: 1 | 2,
  tahunAjaran: string,
) {
  return useQuery({
    queryKey: workspaceKey(kelasId ?? 0, semester, tahunAjaran),
    queryFn: () =>
      fetchRaporWaliKelasWorkspace(kelasId!, semester, tahunAjaran),
    enabled: Boolean(kelasId && tahunAjaran),
  });
}

export function useUpsertERaporSikapCatatan(
  kelasId: number | null,
  semester: 1 | 2,
  tahunAjaran: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ERaporSikapCatatanInput) =>
      upsertERaporSikapCatatan(input),
    onSuccess: () => {
      if (!kelasId) return;
      void qc.invalidateQueries({
        queryKey: workspaceKey(kelasId, semester, tahunAjaran),
      });
      void qc.invalidateQueries({ queryKey: queryKeys.eRapor.all });
    },
  });
}

export function useCreateEkstrakurikuler(
  kelasId: number | null,
  semester: 1 | 2,
  tahunAjaran: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      nama,
      pembina,
    }: {
      nama: string;
      pembina?: string | null;
    }) => createEkstrakurikuler(nama, pembina),
    onSuccess: () => {
      if (!kelasId) return;
      void qc.invalidateQueries({
        queryKey: workspaceKey(kelasId, semester, tahunAjaran),
      });
      void qc.invalidateQueries({ queryKey: queryKeys.eRapor.all });
    },
  });
}

export function useDeleteEkstrakurikuler(
  kelasId: number | null,
  semester: 1 | 2,
  tahunAjaran: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteEkstrakurikuler(id),
    onSuccess: () => {
      if (!kelasId) return;
      void qc.invalidateQueries({
        queryKey: workspaceKey(kelasId, semester, tahunAjaran),
      });
      void qc.invalidateQueries({ queryKey: queryKeys.eRapor.all });
    },
  });
}

export function useUpsertSiswaEkstrakurikuler(
  kelasId: number | null,
  semester: 1 | 2,
  tahunAjaran: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SiswaEkstrakurikulerInput) =>
      upsertSiswaEkstrakurikuler(input),
    onSuccess: () => {
      if (!kelasId) return;
      void qc.invalidateQueries({
        queryKey: workspaceKey(kelasId, semester, tahunAjaran),
      });
      void qc.invalidateQueries({ queryKey: queryKeys.eRapor.all });
    },
  });
}

export function useDeleteSiswaEkstrakurikuler(
  kelasId: number | null,
  semester: 1 | 2,
  tahunAjaran: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSiswaEkstrakurikuler(id),
    onSuccess: () => {
      if (!kelasId) return;
      void qc.invalidateQueries({
        queryKey: workspaceKey(kelasId, semester, tahunAjaran),
      });
      void qc.invalidateQueries({ queryKey: queryKeys.eRapor.all });
    },
  });
}
