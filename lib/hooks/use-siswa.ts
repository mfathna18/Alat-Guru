"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import {
  bulkCreateSiswa,
  createSiswa,
  fetchSiswaByKelas,
  restoreSiswa,
  softDeleteSiswa,
  updateSiswa,
} from "@/lib/services/siswa";

export function useSiswaList(kelasId: number | null, includeDeleted = false) {
  return useQuery({
    queryKey: queryKeys.siswa.byKelas(kelasId ?? 0, includeDeleted),
    queryFn: () => fetchSiswaByKelas(kelasId!, includeDeleted),
    enabled: kelasId != null && kelasId > 0,
  });
}

export function useCreateSiswa(kelasId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSiswa,
    onSuccess: () => {
      if (kelasId) {
        qc.invalidateQueries({ queryKey: queryKeys.siswa.byKelas(kelasId) });
        qc.invalidateQueries({ queryKey: queryKeys.kelas.all });
      }
    },
  });
}

export function useUpdateSiswa(kelasId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      siswaId,
      ...input
    }: {
      siswaId: number;
      nama_siswa: string;
      nisn?: string | null;
      nis?: string | null;
    }) => updateSiswa(siswaId, input),
    onSuccess: () => {
      if (kelasId) {
        qc.invalidateQueries({ queryKey: queryKeys.siswa.byKelas(kelasId, true) });
        qc.invalidateQueries({ queryKey: queryKeys.siswa.byKelas(kelasId, false) });
      }
    },
  });
}

export function useSoftDeleteSiswa(kelasId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: softDeleteSiswa,
    onSuccess: () => {
      if (kelasId) {
        qc.invalidateQueries({ queryKey: queryKeys.siswa.byKelas(kelasId, true) });
        qc.invalidateQueries({ queryKey: queryKeys.siswa.byKelas(kelasId, false) });
        qc.invalidateQueries({ queryKey: queryKeys.kelas.all });
      }
    },
  });
}

export function useRestoreSiswa(kelasId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: restoreSiswa,
    onSuccess: () => {
      if (kelasId) {
        qc.invalidateQueries({ queryKey: queryKeys.siswa.byKelas(kelasId, true) });
        qc.invalidateQueries({ queryKey: queryKeys.siswa.byKelas(kelasId, false) });
        qc.invalidateQueries({ queryKey: queryKeys.kelas.all });
      }
    },
  });
}

export function useBulkImportSiswa(kelasId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: {
      nama_siswa: string;
      nisn?: string | null;
      nis?: string | null;
    }[]) => bulkCreateSiswa(kelasId!, rows),
    onSuccess: () => {
      if (kelasId) {
        qc.invalidateQueries({ queryKey: queryKeys.siswa.byKelas(kelasId) });
        qc.invalidateQueries({ queryKey: queryKeys.kelas.all });
      }
    },
  });
}
