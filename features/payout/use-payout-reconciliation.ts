"use client";

import { useQuery } from "@tanstack/react-query";
import { payoutApi } from "@/features/payout/api";
import type { PayoutReconciliationFilter, PayoutReconciliationReport } from "@/types/payout";

const PAYOUT_RECONCILIATION_KEY = "payout-reconciliation";

export function usePayoutReconciliation(filter: PayoutReconciliationFilter, enabled = true) {
  return useQuery({
    queryKey: [PAYOUT_RECONCILIATION_KEY, filter.period, filter.fromDate ?? null, filter.toDate ?? null],
    queryFn: () => payoutApi.reconciliation.list(filter),
    enabled,
  }) as ReturnType<typeof useQuery<PayoutReconciliationReport>>;
}
