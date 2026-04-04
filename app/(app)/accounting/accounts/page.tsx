"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { MetricCard } from "@/components/layout/stats-card";
import { useAccountingAccounts } from "@/features/accounting/use-accounting-module";
import type { AccountingAccountRecord } from "@/types/accounting";

const columnHelper = createColumnHelper<AccountingAccountRecord>();

export default function AccountingAccountsPage() {
  const accountsQuery = useAccountingAccounts();
  const accountRows = accountsQuery.data ?? [];
  const totalAccounts = accountRows.length;
  const activeAccounts = accountRows.filter((row) => row.is_active).length;
  const parentAccounts = accountRows.filter((row) => row.accounts != null).length;
  const totalJournalLines = accountRows.reduce((sum, row) => sum + (row._count?.journal_lines ?? 0), 0);

  const columns = [
    columnHelper.accessor("code", {
      header: "Code",
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor("name", { header: "Account" }),
    columnHelper.accessor("account_categories", {
      header: "Category",
      cell: (info) => info.getValue()?.name ?? "-",
    }),
    columnHelper.accessor("normal_balance", {
      header: "Normal Balance",
      cell: (info) => <StatusBadge label={info.getValue()} tone="info" />,
    }),
    columnHelper.accessor("accounts", {
      header: "Parent",
      cell: (info) => {
        const parent = info.getValue();
        return parent ? `${parent.code} - ${parent.name}` : "-";
      },
    }),
    columnHelper.display({
      id: "journal_usage",
      header: "Journal Usage",
      cell: ({ row }) => <StatusBadge label={`${row.original._count?.journal_lines ?? 0} lines`} tone="neutral" />,
    }),
    columnHelper.accessor("is_active", {
      header: "Status",
      cell: (info) => (
        <StatusBadge label={info.getValue() ? "Active" : "Inactive"} tone={info.getValue() ? "success" : "neutral"} />
      ),
    }),
  ];

  return (
    <PageShell
      eyebrow="Accounting"
      title="Accounts"
      description="Lihat chart of accounts (COA) untuk memastikan struktur akun dan relasi parent tetap jelas."
    >
      {accountsQuery.isError ? (
        <EmptyState title="Failed to load accounts" description={accountsQuery.error.message} />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard title="Total accounts" value={String(totalAccounts)} subtitle="Jumlah akun yang terlihat." />
            <MetricCard title="Akun aktif" value={String(activeAccounts)} subtitle="Akun yang aktif." />
            <MetricCard title="Has parent" value={String(parentAccounts)} subtitle="Akun yang memiliki parent." />
            <MetricCard title="Journal lines" value={String(totalJournalLines)} subtitle="Total pemakaian akun di jurnal (visible)." />
          </div>
          <DataTable columns={columns} data={accountsQuery.data ?? []} emptyMessage="No accounts found." />
        </div>
      )}
    </PageShell>
  );
}
