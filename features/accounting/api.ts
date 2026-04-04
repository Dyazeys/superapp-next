import type {
  AccountingAccountRecord,
  AccountingJournalEntryLineRecord,
  AccountingJournalRecord,
} from "@/types/accounting";
import { requestJson } from "@/lib/request";

export const accountingApi = {
  accounts: {
    list: () => requestJson<AccountingAccountRecord[]>("/api/accounting/accounts"),
  },
  journals: {
    list: () => requestJson<AccountingJournalRecord[]>("/api/accounting/journals"),
  },
  journalEntries: {
    list: (journalId?: string) =>
      requestJson<AccountingJournalEntryLineRecord[]>(
        journalId ? `/api/accounting/journal-entries?journalId=${encodeURIComponent(journalId)}` : "/api/accounting/journal-entries"
      ),
  },
};
