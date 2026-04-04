"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import {
  useAccountingJournalEntries,
  useAccountingJournals,
  useAccountingJournalSelection,
} from "@/features/accounting/use-accounting-module";
import type { AccountingJournalEntryLineRecord } from "@/types/accounting";

const columnHelper = createColumnHelper<AccountingJournalEntryLineRecord>();

function toDateInput(value: string) {
  return value.slice(0, 10);
}

export default function AccountingJournalEntriesPage() {
  const journalsQuery = useAccountingJournals();
  const { selectedJournalId, currentJournalId, setSelectedJournalId } = useAccountingJournalSelection(journalsQuery.data);
  const entriesQuery = useAccountingJournalEntries(currentJournalId ?? undefined);

  const selectedJournal = (journalsQuery.data ?? []).find((journal) => journal.id === currentJournalId) ?? null;

  const columns = [
    columnHelper.accessor("accounts.code", {
      header: "Account",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.accounts.code}</p>
          <p className="text-xs text-muted-foreground">{row.original.accounts.name}</p>
        </div>
      ),
    }),
    columnHelper.accessor("debit", { header: "Debit" }),
    columnHelper.accessor("credit", { header: "Credit" }),
    columnHelper.accessor("accounts.normal_balance", {
      header: "Normal",
      cell: (info) => <StatusBadge label={info.getValue()} tone="neutral" />,
    }),
    columnHelper.accessor("memo", {
      header: "Memo",
      cell: (info) => info.getValue() ?? "-",
    }),
    columnHelper.accessor("journal_entries.reference_type", {
      header: "Reference Type",
      cell: (info) => <StatusBadge label={info.getValue()} tone="info" />,
    }),
    columnHelper.accessor("journal_entries.reference_id", {
      header: "Reference",
      cell: (info) => info.getValue() ?? "-",
    }),
  ];

  return (
    <PageShell
      eyebrow="Accounting"
      title="Journal Entries"
      description="Inspect detailed journal lines and their source references using the existing accounting data."
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <label htmlFor="accounting-journal-selection" className="text-sm font-medium text-muted-foreground">
              Selected journal
            </label>
            <select
              id="accounting-journal-selection"
              className="min-w-[360px] rounded-2xl border border-input bg-background px-3 py-2 text-sm"
              value={selectedJournalId ?? currentJournalId ?? ""}
              disabled={journalsQuery.isLoading}
              onChange={(event) => setSelectedJournalId(event.target.value || null)}
            >
              {(journalsQuery.data ?? []).map((journal) => (
                <option key={journal.id} value={journal.id}>
                  {toDateInput(journal.transaction_date)} - {journal.reference_type} - {journal.description}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground">
              {selectedJournal
                ? `${selectedJournal.reference_type} · ${selectedJournal.line_count} lines · debit ${selectedJournal.total_debit} / credit ${selectedJournal.total_credit}`
                : "Choose a journal to inspect its lines."}
            </p>
          </div>
        </div>

        {journalsQuery.isError ? (
          <EmptyState title="Failed to load journals" description={journalsQuery.error.message} />
        ) : entriesQuery.isError ? (
          <EmptyState title="Failed to load journal entries" description={entriesQuery.error.message} />
        ) : currentJournalId ? (
          <DataTable columns={columns} data={entriesQuery.data ?? []} emptyMessage="No journal lines found." />
        ) : (
          <EmptyState title="Select a journal" description="Choose a journal to inspect its detailed lines." />
        )}
      </div>
    </PageShell>
  );
}
