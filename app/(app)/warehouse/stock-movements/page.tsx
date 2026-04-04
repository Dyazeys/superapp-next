"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/data/data-table";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { MetricCard } from "@/components/layout/stats-card";
import { movementTone, toDateInput, useWarehouseStockMovements } from "@/features/warehouse/use-warehouse-module";
import type { StockMovementRecord } from "@/types/warehouse";

const columnHelper = createColumnHelper<StockMovementRecord>();

export default function WarehouseStockMovementsPage() {
  const stockMovementsQuery = useWarehouseStockMovements();
  const movementRows = stockMovementsQuery.data ?? [];
  const totalMovements = movementRows.length;
  const uniqueInventory = new Set(movementRows.map((row) => row.inv_code)).size;
  const netQty = movementRows.reduce((sum, row) => sum + Number(row.qty_change || 0), 0);
  const latestMovementDate =
    movementRows.length === 0
      ? "-"
      : movementRows
          .map((row) => row.movement_date)
          .reduce((latest, next) => (next > latest ? next : latest))
          .slice(0, 10);

  const columns = [
    columnHelper.accessor("movement_date", {
      header: "Date",
      cell: (info) => toDateInput(info.getValue()),
    }),
    columnHelper.accessor("inv_code", {
      header: "Inventory",
      cell: (info) => (
        <div>
          <p className="font-medium">{info.getValue()}</p>
          <p className="text-xs text-muted-foreground">{info.row.original.master_inventory?.inv_name ?? ""}</p>
        </div>
      ),
    }),
    columnHelper.accessor("reference_type", {
      header: "Source",
      cell: (info) => <StatusBadge label={info.getValue()} tone={movementTone(info.getValue())} />,
    }),
    columnHelper.accessor("reference_id", {
      header: "Reference",
      cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
    }),
    columnHelper.accessor("qty_change", {
      header: "Change",
      cell: (info) => (
        <span className={info.getValue() >= 0 ? "font-medium tabular-nums text-foreground" : "font-medium tabular-nums text-muted-foreground"}>
          {info.getValue() > 0 ? `+${info.getValue()}` : info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("running_balance", { header: "Running" }),
    columnHelper.accessor("notes", {
      header: "Notes",
      cell: (info) => info.getValue() ?? "-",
    }),
  ];

  return (
    <PageShell
      eyebrow="Warehouse"
      title="Stock Movements"
      description="Lihat ledger pergerakan stok untuk audit cepat dari inbound, adjustment, dan sales."
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Total rows" value={String(totalMovements)} subtitle="Jumlah movement rows yang terlihat." />
          <MetricCard title="Inventory codes" value={String(uniqueInventory)} subtitle="Jumlah inventory unik di ledger." />
          <MetricCard title="Net qty change" value={netQty.toLocaleString("id-ID")} subtitle="Σ qty_change dari data yang terlihat." />
          <MetricCard title="Latest date" value={latestMovementDate} subtitle="Tanggal movement terbaru." />
        </div>
        <DataTable columns={columns} data={stockMovementsQuery.data ?? []} emptyMessage="No stock movements yet." />
      </div>
    </PageShell>
  );
}
