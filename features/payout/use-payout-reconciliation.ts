"use client";

import { useQuery } from "@tanstack/react-query";
import { payoutApi } from "@/features/payout/api";
import type { PayoutReconciliationReport } from "@/types/payout";

const PAYOUT_RECONCILIATION_KEY = ["payout-reconciliation"] as const;

export function usePayoutReconciliation() {
  return useQuery({
    queryKey: PAYOUT_RECONCILIATION_KEY,
    queryFn: payoutApi.reconciliation.list,
  }) as ReturnType<typeof useQuery<PayoutReconciliationReport>>;
}
