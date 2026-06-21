"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { fetchBillingOverview } from "@/lib/services/billing";

export function useBillingOverview() {
  return useQuery({
    queryKey: queryKeys.billing.overview,
    queryFn: fetchBillingOverview,
  });
}
