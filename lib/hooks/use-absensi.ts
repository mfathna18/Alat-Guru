"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import {
  fetchAbsensiByKelasDate,
  fetchAbsensiByKelasRange,
  resetAbsensiByKelasDate,
  upsertAbsensi,
  upsertAbsensiBatch,
} from "@/lib/services/absensi";
import type { StatusAbsensi } from "@/lib/types/database";

function absensiQueryKey(kelasId: number, tanggal: string) {
  return queryKeys.absensi.byKelasDate(kelasId, tanggal);
}

export function useAbsensiByDate(kelasId: number | null, tanggal: string) {
  return useQuery({
    queryKey: absensiQueryKey(kelasId ?? 0, tanggal),
    queryFn: () => fetchAbsensiByKelasDate(kelasId!, tanggal),
    enabled: kelasId != null && kelasId > 0 && tanggal.length > 0,
  });
}

export function useAbsensiRange(
  kelasId: number | null,
  startDate: string,
  endDate: string,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.absensi.byKelasRange(kelasId ?? 0, startDate, endDate),
    queryFn: () => fetchAbsensiByKelasRange(kelasId!, startDate, endDate),
    enabled:
      enabled &&
      kelasId != null &&
      kelasId > 0 &&
      startDate.length > 0 &&
      endDate.length > 0,
  });
}

function invalidateAbsensi(qc: ReturnType<typeof useQueryClient>, kelasId: number, tanggal: string) {
  qc.invalidateQueries({ queryKey: absensiQueryKey(kelasId, tanggal) });
  qc.invalidateQueries({ queryKey: ["absensi"] });
}

export function useUpsertAbsensi(kelasId: number | null, tanggal: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id_siswa: number;
      status: StatusAbsensi;
      keterangan?: string | null;
    }) =>
      upsertAbsensi({
        id_siswa: input.id_siswa,
        tanggal,
        status: input.status,
        keterangan: input.keterangan,
      }),
    onSuccess: () => {
      if (kelasId) invalidateAbsensi(qc, kelasId, tanggal);
    },
  });
}

export function useBulkUpsertAbsensi(kelasId: number | null, tanggal: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      entries: {
        id_siswa: number;
        status: StatusAbsensi;
        keterangan?: string | null;
      }[],
    ) =>
      upsertAbsensiBatch(
        entries.map((e) => ({
          id_siswa: e.id_siswa,
          tanggal,
          status: e.status,
          keterangan: e.keterangan,
        })),
      ),
    onSuccess: () => {
      if (kelasId) invalidateAbsensi(qc, kelasId, tanggal);
    },
  });
}

export function useResetAbsensi(kelasId: number | null, tanggal: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => resetAbsensiByKelasDate(kelasId!, tanggal),
    onSuccess: () => {
      if (kelasId) invalidateAbsensi(qc, kelasId, tanggal);
    },
  });
}
