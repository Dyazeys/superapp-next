"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/data/data-table";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { MetricCard } from "@/components/layout/stats-card";
import { useWarehouseStockBalances } from "@/features/warehouse/use-warehouse-module";
import type { StockBalanceRecord } from "@/types/warehouse";

const columnHelper = createColumnHelper<StockBalanceRecord>();

export default function WarehouseStockBalancesPage() {
  const stockBalancesQuery = useWarehouseStockBalances();
  const balanceRows = stockBalancesQuery.data ?? [];
  const totalCodes = balanceRows.length;
  const codesWithStock = balanceRows.filter((row) => row.qty_on_hand > 0).length;
  const negativeCodes = balanceRows.filter((row) => row.qty_on_hand < 0).length;
  const totalQty = balanceRows.reduce((sum, row) => sum + Number(row.qty_on_hand || 0), 0);
  const latestUpdate =
    balanceRows.length === 0
      ? "-"
      : balanceRows
          .map((row) => row.last_updated)
          .reduce((latest, next) => (next > latest ? next : latest))
          .slice(0, 19)
          .replace("T", " ");

  const columns = [
    columnHelper.accessor("inv_code", {
      header: "Inventory",
      cell: (info) => (
        <div>
          <p className="font-medium">{info.getValue()}</p>
          <p className="text-xs text-muted-foreground">{info.row.original.master_inventory?.inv_name ?? ""}</p>
        </div>
      ),
    }),
    columnHelper.accessor("qty_on_hand", {
      header: "On Hand",
      cell: (info) => (
        <StatusBadge
          label={String(info.getValue())}
          tone={info.getValue() > 0 ? "success" : info.getValue() < 0 ? "danger" : "neutral"}
        />
      ),
    }),
    columnHelper.accessor("master_inventory", {
      header: "Unit Price",
      cell: (info) => info.getValue()?.unit_price ?? "-",
    }),
    columnHelper.accessor("last_updated", {
      header: "Last Updated",
      cell: (info) => new Date(info.getValue()).toLocaleString("en-US"),
    }),
  ];

  return (
    <PageShell
      eyebrow="Warehouse"
      title="Stock Balances"
      description="Lihat saldo on-hand terkini untuk memantau kondisi stok berdasarkan ledger yang sudah ada."
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-5">
          <MetricCard title="Total codes" value={String(totalCodes)} subtitle="Jumlah inventory codes yang terlihat." />
          <MetricCard title="Codes with stock" value={String(codesWithStock)} subtitle="Qty on-hand > 0." />
          <MetricCard title="Negative codes" value={String(negativeCodes)} subtitle="Qty on-hand < 0." />
          <MetricCard title="Total qty" value={totalQty.toLocaleString("id-ID")} subtitle="Akumulasi qty yang terlihat." />
          <MetricCard title="Latest update" value={latestUpdate} subtitle="Update terbaru dari data yang terlihat." />
        </div>
        <DataTable columns={columns} data={stockBalancesQuery.data ?? []} emptyMessage="No stock balances yet." />
      </div>
    </PageShell>
  );
}
