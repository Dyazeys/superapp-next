"use client";

import { useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Boxes, Package2, ReceiptText, Wallet } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { MetricCard } from "@/components/layout/stats-card";
import { Input } from "@/components/ui/input";
import { useAccountingOperationalExpenseBarter } from "@/features/accounting/use-accounting-module";
import { formatMoney, formatShortDate } from "@/lib/format";
import type { AccountingOperationalExpenseBarterRecord } from "@/types/accounting";

type BarterBreakdownRow = {
  key: string;
  expense_code: string;
  expense_name: string;
  expense_label: string | null;
  transaction_count: number;
  item_count: number;
  total_amount: number;
};

type InventoryBreakdownRow = {
  key: string;
  inv_code: string;
  inv_name: string;
  item_count: number;
  total_qty: number;
  total_amount: number;
};

const barterColumnHelper = createColumnHelper<AccountingOperationalExpenseBarterRecord>();
const breakdownColumnHelper = createColumnHelper<BarterBreakdownRow>();
const inventoryColumnHelper = createColumnHelper<InventoryBreakdownRow>();

function toDateInputValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function OperationalExpenseBarterReport() {
  const now = new Date();
  const today = toDateInputValue(now);
  const firstDayOfMonth = toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
  const barterQuery = useAccountingOperationalExpenseBarter();
  const [fromDate, setFromDate] = useState(firstDayOfMonth);
  const [toDate, setToDate] = useState(today);
  const rangeValid = isIsoDate(fromDate) && isIsoDate(toDate) && fromDate <= toDate;

  const postedRows = useMemo(() => {
    const rows = barterQuery.data ?? [];
    return rows.filter((row) => row.status === "POSTED");
  }, [barterQuery.data]);

  const filteredRows = useMemo(() => {
    if (!rangeValid) return [];
    return postedRows.filter((row) => {
      const dateOnly = row.barter_date.slice(0, 10);
      return dateOnly >= fromDate && dateOnly <= toDate;
    });
  }, [fromDate, postedRows, rangeValid, toDate]);

  const totalTransactions = filteredRows.length;
  const totalItems = filteredRows.reduce((sum, row) => sum + row.operational_expense_barter_items.length, 0);
  const totalQty = filteredRows.reduce(
    (sum, row) => sum + row.operational_expense_barter_items.reduce((acc, item) => acc + Number(item.qty), 0),
    0
  );
  const totalAmount = filteredRows.reduce((sum, row) => sum + Number(row.total_amount), 0);

  const breakdownRows = useMemo<BarterBreakdownRow[]>(() => {
    const map = new Map<string, BarterBreakdownRow>();

    for (const row of filteredRows) {
      const account = row.accounts;
      const key = `${account.code}:${row.expense_label ?? "__none__"}`;
      const current = map.get(key) ?? {
        key,
        expense_code: account.code,
        expense_name: account.name,
        expense_label: row.expense_label,
        transaction_count: 0,
        item_count: 0,
        total_amount: 0,
      };

      current.transaction_count += 1;
      current.item_count += row.operational_expense_barter_items.length;
      current.total_amount += Number(row.total_amount);
      map.set(key, current);
    }

    return Array.from(map.values()).sort((left, right) => right.total_amount - left.total_amount);
  }, [filteredRows]);

  const inventoryRows = useMemo<InventoryBreakdownRow[]>(() => {
    const map = new Map<string, InventoryBreakdownRow>();

    for (const row of filteredRows) {
      for (const item of row.operational_expense_barter_items) {
        const key = item.inv_code;
        const current = map.get(key) ?? {
          key,
          inv_code: item.inv_code,
          inv_name: item.master_inventory.inv_name,
          item_count: 0,
          total_qty: 0,
          total_amount: 0,
        };

        current.item_count += 1;
        current.total_qty += Number(item.qty);
        current.total_amount += Number(item.line_amount);
        map.set(key, current);
      }
    }

    return Array.from(map.values()).sort((left, right) => right.total_amount - left.total_amount);
  }, [filteredRows]);

  const barterColumns = [
    barterColumnHelper.accessor("barter_date", {
      header: "Tanggal",
      cell: (info) => formatShortDate(info.getValue()),
    }),
    barterColumnHelper.display({
      id: "account",
      header: "Akun / Label",
      cell: ({ row }) => {
        const account = row.original.accounts;
        return (
          <div className="min-w-[220px]">
            <p className="font-medium">{account.code} - {account.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.expense_label ?? "Tanpa label detail"}</p>
          </div>
        );
      },
    }),
    barterColumnHelper.display({
      id: "items",
      header: "Items",
      cell: ({ row }) => String(row.original.operational_expense_barter_items.length),
    }),
    barterColumnHelper.accessor("total_amount", {
      header: "Total",
      cell: (info) => formatMoney(Number(info.getValue())),
    }),
    barterColumnHelper.accessor("description", {
      header: "Deskripsi",
      cell: ({ getValue }) => <div className="min-w-[220px] whitespace-normal break-words">{getValue()}</div>,
    }),
  ];

  const breakdownColumns = [
    breakdownColumnHelper.display({
      id: "account",
      header: "Akun / Label",
      cell: ({ row }) => (
        <div className="min-w-[220px]">
          <p className="font-medium">{row.original.expense_code} - {row.original.expense_name}</p>
          <p className="text-xs text-muted-foreground">{row.original.expense_label ?? "Tanpa label detail"}</p>
        </div>
      ),
    }),
    breakdownColumnHelper.accessor("transaction_count", {
      header: "Transaksi",
    }),
    breakdownColumnHelper.accessor("item_count", {
      header: "Item",
    }),
    breakdownColumnHelper.accessor("total_amount", {
      header: "Total Nilai",
      cell: (info) => formatMoney(info.getValue()),
    }),
  ];

  const inventoryColumns = [
    inventoryColumnHelper.display({
      id: "inventory",
      header: "Inventory",
      cell: ({ row }) => (
        <div className="min-w-[220px]">
          <p className="font-medium">{row.original.inv_code}</p>
          <p className="text-xs text-muted-foreground">{row.original.inv_name}</p>
        </div>
      ),
    }),
    inventoryColumnHelper.accessor("item_count", {
      header: "Baris Item",
    }),
    inventoryColumnHelper.accessor("total_qty", {
      header: "Total Qty",
    }),
    inventoryColumnHelper.accessor("total_amount", {
      header: "Total Nilai",
      cell: (info) => formatMoney(info.getValue()),
    }),
  ];

  if (barterQuery.isError) {
    return <EmptyState title="Gagal memuat report barter" description={barterQuery.error.message} />;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1.5 text-xs font-medium tracking-[0.02em] text-foreground/80">
            Dari tanggal
            <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          </label>
          <label className="space-y-1.5 text-xs font-medium tracking-[0.02em] text-foreground/80">
            Sampai tanggal
            <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </label>
        </div>
        {!rangeValid ? (
          <p className="mt-3 text-xs text-destructive">Isi rentang tanggal yang valid. From tidak boleh melebihi to.</p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Posted barter" value={String(totalTransactions)} subtitle="Jumlah transaksi posted dalam periode." icon={<ReceiptText className="size-4" />} />
        <MetricCard title="Item rows" value={String(totalItems)} subtitle="Total baris item yang keluar." icon={<Boxes className="size-4" />} />
        <MetricCard title="Qty keluar" value={String(totalQty)} subtitle="Akumulasi qty inventory release." icon={<Package2 className="size-4" />} />
        <MetricCard title="Nilai barter" value={formatMoney(totalAmount)} subtitle="Total beban barter yang diposting." icon={<Wallet className="size-4" />} />
      </div>

      {!rangeValid ? (
        <EmptyState title="Rentang tanggal belum valid" description="Lengkapi tanggal from dan to untuk memuat report barter." />
      ) : (
        <div className="space-y-5">
          <div className="rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Breakdown akun dan label</h2>
            <p className="mt-1 text-sm text-muted-foreground">Melihat nilai barter yang diposting per akun beban dan label detail.</p>
            <div className="mt-4">
              <DataTable columns={breakdownColumns} data={breakdownRows} emptyMessage="Belum ada breakdown barter untuk periode ini." />
            </div>
          </div>

          <div className="rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Breakdown inventory</h2>
            <p className="mt-1 text-sm text-muted-foreground">Menunjukkan inventory mana yang paling banyak keluar lewat barter.</p>
            <div className="mt-4">
              <DataTable columns={inventoryColumns} data={inventoryRows} emptyMessage="Belum ada item barter untuk periode ini." />
            </div>
          </div>

          <div className="rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Recent posted transactions</h2>
            <p className="mt-1 text-sm text-muted-foreground">Audit cepat transaksi barter yang sudah diposting pada periode aktif.</p>
            <div className="mt-4">
              <DataTable
                columns={barterColumns}
                data={filteredRows}
                emptyMessage="Belum ada transaksi barter posted untuk periode ini."
                pagination={{ enabled: true, pageSize: 10, pageSizeOptions: [10, 20, 50] }}
                getRowId={(row) => row.id}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
