"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { useAccountingAccounts } from "@/features/accounting/use-accounting-module";
import type { AccountingAccountRecord } from "@/types/accounting";

const columnHelper = createColumnHelper<AccountingAccountRecord>();

export default function AccountingAccountsPage() {
  const accountsQuery = useAccountingAccounts();

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
      description="Review the chart of accounts and hierarchy from the existing accounting schema."
    >
      {accountsQuery.isError ? (
        <EmptyState title="Failed to load accounts" description={accountsQuery.error.message} />
      ) : (
        <DataTable columns={columns} data={accountsQuery.data ?? []} emptyMessage="No accounts found." />
      )}
    </PageShell>
  );
}
