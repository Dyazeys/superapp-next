"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { accountingApi } from "@/features/accounting/api";
import type {
  AccountingAccountRecord,
  AccountingJournalEntryLineRecord,
  AccountingJournalRecord,
} from "@/types/accounting";

export function useAccountingAccounts() {
  return useQuery({
    queryKey: ["accounting-accounts"],
    queryFn: accountingApi.accounts.list,
  }) as UseQueryResult<AccountingAccountRecord[]>;
}

export function useAccountingJournals() {
  return useQuery({
    queryKey: ["accounting-journals"],
    queryFn: accountingApi.journals.list,
  }) as UseQueryResult<AccountingJournalRecord[]>;
}

export function useAccountingJournalSelection(journals: AccountingJournalRecord[] | undefined) {
  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);
  const currentJournalId = useMemo(
    () => selectedJournalId ?? journals?.[0]?.id ?? null,
    [journals, selectedJournalId]
  );

  return { selectedJournalId, currentJournalId, setSelectedJournalId };
}

export function useAccountingJournalEntries(journalId?: string) {
  return useQuery({
    queryKey: ["accounting-journal-entries", journalId ?? "all"],
    queryFn: () => accountingApi.journalEntries.list(journalId),
    enabled: Boolean(journalId),
  }) as UseQueryResult<AccountingJournalEntryLineRecord[]>;
}
