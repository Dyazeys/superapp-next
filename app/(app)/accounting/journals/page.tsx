"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { MetricCard } from "@/components/layout/stats-card";
import { useAccountingJournals } from "@/features/accounting/use-accounting-module";
import type { AccountingJournalRecord } from "@/types/accounting";

const columnHelper = createColumnHelper<AccountingJournalRecord>();

function toDateInput(value: string) {
  return value.slice(0, 10);
}

export default function AccountingJournalsPage() {
  const journalsQuery = useAccountingJournals();
  const journalRows = journalsQuery.data ?? [];
  const totalJournals = journalRows.length;
  const totalLines = journalRows.reduce((sum, row) => sum + Number(row.line_count || 0), 0);
  const totalDebit = journalRows.reduce((sum, row) => sum + Number(row.total_debit || 0), 0);
  const totalCredit = journalRows.reduce((sum, row) => sum + Number(row.total_credit || 0), 0);
  const latestDate =
    journalRows.length === 0
      ? "-"
      : journalRows
          .map((row) => row.transaction_date)
          .reduce((latest, next) => (next > latest ? next : latest))
          .slice(0, 10);

  const columns = [
    columnHelper.accessor("transaction_date", {
      header: "Date",
      cell: (info) => toDateInput(info.getValue()),
    }),
    columnHelper.accessor("reference_type", {
      header: "Reference Type",
      cell: (info) => <StatusBadge label={info.getValue()} tone="info" />,
    }),
    columnHelper.accessor("reference_id", {
      header: "Reference",
      cell: (info) => info.getValue() ?? "-",
    }),
    columnHelper.accessor("description", { header: "Description" }),
    columnHelper.accessor("line_count", {
      header: "Lines",
      cell: (info) => <StatusBadge label={String(info.getValue())} tone="neutral" />,
    }),
    columnHelper.accessor("total_debit", { header: "Total Debit" }),
    columnHelper.accessor("total_credit", { header: "Total Credit" }),
  ];

  return (
    <PageShell
      eyebrow="Accounting"
      title="Journals"
      description="Lihat header jurnal yang sudah terbentuk untuk pengecekan cepat tanpa mengubah perilaku posting."
    >
      {journalsQuery.isError ? (
        <EmptyState title="Failed to load journals" description={journalsQuery.error.message} />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard title="Total journals" value={String(totalJournals)} subtitle="Jumlah header jurnal yang terlihat." />
            <MetricCard title="Total lines" value={String(totalLines)} subtitle="Akumulasi line count dari jurnal." />
            <MetricCard
              title="Total debit / credit"
              value={`${totalDebit.toLocaleString("id-ID", { maximumFractionDigits: 0 })} / ${totalCredit.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`}
              subtitle="Akumulasi dari jurnal yang terlihat."
            />
            <MetricCard title="Latest date" value={latestDate} subtitle="Tanggal transaksi terbaru." />
          </div>
          <DataTable columns={columns} data={journalsQuery.data ?? []} emptyMessage="No journals found." />
        </div>
      )}
    </PageShell>
  );
}
