"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import {
  fetchPengaturanSekolah,
  savePengaturanSekolah,
  saveRaporPreferences,
  saveTtdSekolahUrl,
  uploadAndSaveTtdSekolah,
  uploadLogoSekolah,
  type PengaturanSekolahInput,
  type RaporPreferencesInput,
  type TtdUploadRole,
} from "@/lib/services/pengaturan";

export function usePengaturanSekolah(guruId?: number) {
  return useQuery({
    queryKey: guruId
      ? queryKeys.pengaturan.byGuru(guruId)
      : queryKeys.pengaturan.all,
    queryFn: fetchPengaturanSekolah,
    enabled: guruId != null,
  });
}

export function useSavePengaturan(guruId?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PengaturanSekolahInput) => savePengaturanSekolah(input),
    onSuccess: (pengaturan) => {
      if (guruId) {
        qc.setQueryData(queryKeys.pengaturan.byGuru(guruId), pengaturan);
      }
      qc.invalidateQueries({ queryKey: queryKeys.pengaturan.all });
      if (guruId) {
        qc.invalidateQueries({ queryKey: queryKeys.pengaturan.byGuru(guruId) });
      }
    },
  });
}

export function useSaveRaporPreferences(guruId?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RaporPreferencesInput) => saveRaporPreferences(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.pengaturan.all });
      if (guruId) {
        qc.invalidateQueries({ queryKey: queryKeys.pengaturan.byGuru(guruId) });
      }
    },
  });
}

export function useUploadLogo() {
  return useMutation({
    mutationFn: ({ file, guruId }: { file: File; guruId: number }) =>
      uploadLogoSekolah(file, guruId),
  });
}

export function useUploadTtd(guruId?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      guruId: id,
      role,
    }: {
      file: File;
      guruId: number;
      role: TtdUploadRole;
    }) => uploadAndSaveTtdSekolah(file, id, role),
    onSuccess: (result) => {
      qc.setQueryData(
        guruId
          ? queryKeys.pengaturan.byGuru(guruId)
          : queryKeys.pengaturan.all,
        result.pengaturan,
      );
      qc.invalidateQueries({ queryKey: queryKeys.pengaturan.all });
      if (guruId) {
        qc.invalidateQueries({ queryKey: queryKeys.pengaturan.byGuru(guruId) });
      }
    },
  });
}

export function useClearTtd(guruId?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (role: TtdUploadRole) => saveTtdSekolahUrl(role, null),
    onSuccess: (pengaturan) => {
      qc.setQueryData(
        guruId
          ? queryKeys.pengaturan.byGuru(guruId)
          : queryKeys.pengaturan.all,
        pengaturan,
      );
      qc.invalidateQueries({ queryKey: queryKeys.pengaturan.all });
      if (guruId) {
        qc.invalidateQueries({ queryKey: queryKeys.pengaturan.byGuru(guruId) });
      }
    },
  });
}
