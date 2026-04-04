"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { MetricCard } from "@/components/layout/stats-card";
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
  const journalRows = journalsQuery.data ?? [];
  const totalJournals = journalRows.length;
  const totalJournalLines = journalRows.reduce((sum, row) => sum + Number(row.line_count || 0), 0);
  const selectedLineCount = selectedJournal?.line_count ?? null;
  const selectedDebit = selectedJournal?.total_debit ?? null;
  const selectedCredit = selectedJournal?.total_credit ?? null;
  const currentLinesVisible = (entriesQuery.data ?? []).length;

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
      description="Cek detail debit/kredit per jurnal untuk kebutuhan audit dan rekonsiliasi cepat."
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Total journals" value={String(totalJournals)} subtitle="Jumlah header jurnal yang terlihat." />
          <MetricCard title="Total journal lines" value={String(totalJournalLines)} subtitle="Akumulasi line count dari jurnal." />
          <MetricCard
            title="Selected journal"
            value={selectedJournal ? toDateInput(selectedJournal.transaction_date) : "-"}
            subtitle={selectedJournal ? `${selectedJournal.reference_type}` : "Pilih jurnal untuk melihat detail."}
          />
          <MetricCard
            title="Lines / debit / credit"
            value={
              selectedJournal
                ? `${selectedLineCount} / ${selectedDebit} / ${selectedCredit}`
                : String(currentLinesVisible)
            }
            subtitle={selectedJournal ? "Ringkas dari header jurnal terpilih." : "Baris yang sedang terlihat."}
          />
        </div>

        <div className="flex flex-col gap-3 rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <label htmlFor="accounting-journal-selection" className="text-xs font-medium tracking-[0.02em] text-foreground/80">
              Selected journal
            </label>
            <select
              id="accounting-journal-selection"
              className="min-w-[360px] rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm shadow-slate-900/5"
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
