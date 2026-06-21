"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import {
  createKelas,
  deleteKelas,
  fetchKelasByGuru,
  updateKelas,
} from "@/lib/services/kelas";

export function useKelasList() {
  return useQuery({
    queryKey: queryKeys.kelas.all,
    queryFn: fetchKelasByGuru,
  });
}

export function useCreateKelas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      idGuru,
      namaKelas,
    }: {
      idGuru: number;
      namaKelas: string;
    }) => createKelas(idGuru, namaKelas),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.kelas.all });
    },
  });
}

export function useUpdateKelas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      kelasId,
      namaKelas,
    }: {
      kelasId: number;
      namaKelas: string;
    }) => updateKelas(kelasId, namaKelas),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.kelas.all });
    },
  });
}

export function useDeleteKelas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (kelasId: number) => deleteKelas(kelasId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.kelas.all });
      qc.invalidateQueries({ queryKey: ["siswa"] });
    },
  });
}
