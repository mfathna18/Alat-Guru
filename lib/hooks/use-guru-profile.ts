"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchCurrentGuru,
  updateGuruProfile,
  type GuruProfileInput,
} from "@/lib/services/guru-profile";

export function useGuruProfile() {
  return useQuery({
    queryKey: ["guru", "profile"],
    queryFn: fetchCurrentGuru,
  });
}

export function useUpdateGuruProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GuruProfileInput) => updateGuruProfile(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guru"] });
    },
  });
}
