import type {
  AccountingAccountRecord,
  AccountingJournalEntryLineRecord,
  AccountingJournalRecord,
  AccountingOperationalExpenseBarterRecord,
  AccountingOperationalExpenseRecord,
} from "@/types/accounting";
import type {
  OperationalExpenseBarterInput,
  OperationalExpenseBarterItemInput,
  OperationalExpenseInput,
} from "@/schemas/accounting-module";
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
  operationalExpenses: {
    list: () => requestJson<AccountingOperationalExpenseRecord[]>("/api/accounting/operational-expenses"),
    create: (payload: OperationalExpenseInput) =>
      requestJson<AccountingOperationalExpenseRecord>("/api/accounting/operational-expenses", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: Partial<OperationalExpenseInput>) =>
      requestJson<AccountingOperationalExpenseRecord>(`/api/accounting/operational-expenses/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    post: (id: string) =>
      requestJson<AccountingOperationalExpenseRecord>(`/api/accounting/operational-expenses/${encodeURIComponent(id)}/post`, {
        method: "POST",
        body: JSON.stringify({}),
      }),
    remove: (id: string) =>
      requestJson<{ ok: true }>(`/api/accounting/operational-expenses/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
  },
  operationalExpenseBarter: {
    list: () => requestJson<AccountingOperationalExpenseBarterRecord[]>("/api/accounting/operational-expense-barter"),
    create: (payload: OperationalExpenseBarterInput) =>
      requestJson<AccountingOperationalExpenseBarterRecord>("/api/accounting/operational-expense-barter", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: Partial<OperationalExpenseBarterInput>) =>
      requestJson<AccountingOperationalExpenseBarterRecord>(
        `/api/accounting/operational-expense-barter/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        }
      ),
    remove: (id: string) =>
      requestJson<{ ok: true }>(`/api/accounting/operational-expense-barter/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
    post: (id: string) =>
      requestJson<AccountingOperationalExpenseBarterRecord>(
        `/api/accounting/operational-expense-barter/${encodeURIComponent(id)}/post`,
        {
          method: "POST",
          body: JSON.stringify({}),
        }
      ),
    void: (id: string) =>
      requestJson<AccountingOperationalExpenseBarterRecord>(
        `/api/accounting/operational-expense-barter/${encodeURIComponent(id)}/void`,
        {
          method: "POST",
          body: JSON.stringify({}),
        }
      ),
    createItem: (id: string, payload: OperationalExpenseBarterItemInput) =>
      requestJson<AccountingOperationalExpenseBarterRecord>(
        `/api/accounting/operational-expense-barter/${encodeURIComponent(id)}/items`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      ),
    updateItem: (id: string, itemId: string, payload: Partial<OperationalExpenseBarterItemInput>) =>
      requestJson<AccountingOperationalExpenseBarterRecord>(
        `/api/accounting/operational-expense-barter/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        }
      ),
    removeItem: (id: string, itemId: string) =>
      requestJson<AccountingOperationalExpenseBarterRecord>(
        `/api/accounting/operational-expense-barter/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}`,
        {
          method: "DELETE",
        }
      ),
  },
};
