"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { AlertTriangle, Landmark, Wallet } from "lucide-react";
import { useState } from "react";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/feedback/status-badge";
import { MetricCard } from "@/components/layout/stats-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePayoutReconciliation } from "@/features/payout/use-payout-reconciliation";
import { formatMoney } from "@/lib/format";
import type { PayoutReconciliationChannelRecord, PayoutReconciliationPeriodPreset } from "@/types/payout";

const columnHelper = createColumnHelper<PayoutReconciliationChannelRecord>();

function statusTone(status: PayoutReconciliationChannelRecord["mismatch_status"]) {
  if (status === "ERROR") return "danger";
  if (status === "EXPECTED") return "warning";
  return "success";
}

function formatOutstanding(value: string) {
  const amount = Number(value);
  return formatMoney(amount);
}

function toDateInputValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function AccountingChannelReport() {
  const now = new Date();
  const today = toDateInputValue(now);
  const firstDayOfMonth = toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
  const [period, setPeriod] = useState<PayoutReconciliationPeriodPreset>("all");
  const [customFromDate, setCustomFromDate] = useState(firstDayOfMonth);
  const [customToDate, setCustomToDate] = useState(today);
  const customRangeValid =
    isIsoDate(customFromDate) && isIsoDate(customToDate) && customFromDate <= customToDate;

  const reconciliationQuery = usePayoutReconciliation(
    period === "custom"
      ? {
          period,
          fromDate: customFromDate,
          toDate: customToDate,
        }
      : { period },
    period === "custom" ? customRangeValid : true
  );
  const report = reconciliationQuery.data;
  const channels = report?.channels ?? [];

  const columns = [
    columnHelper.accessor("channel_name", {
      header: "Channel",
      cell: (info) => (
        <div className="space-y-1">
          <p className="font-medium">{info.getValue()}</p>
          <p className="text-xs text-muted-foreground">
            {info.row.original.category_name ?? "No category"} / {info.row.original.group_name ?? "No group"}
          </p>
        </div>
      ),
    }),
    columnHelper.accessor("total_sales_receivable_posted", {
      header: "Sales Posted",
      cell: (info) => formatMoney(Number(info.getValue())),
    }),
    columnHelper.accessor("total_payout_settlement_posted", {
      header: "Payout Posted",
      cell: (info) => formatMoney(Number(info.getValue())),
    }),
    columnHelper.accessor("total_saldo", {
      header: "Saldo",
      cell: (info) => formatMoney(Number(info.getValue())),
    }),
    columnHelper.accessor("total_bank_transfer", {
      header: "Transfer Bank",
      cell: (info) => formatMoney(Number(info.getValue())),
    }),
    columnHelper.accessor("sales_receivable_vs_payout_settlement_diff", {
      header: "Outstanding",
      cell: (info) => formatOutstanding(info.getValue()),
    }),
    columnHelper.accessor("mismatch_status", {
      header: "Status",
      cell: (info) => <StatusBadge label={info.getValue()} tone={statusTone(info.getValue())} />,
    }),
  ];

  if (reconciliationQuery.isError) {
    return (
      <EmptyState title="Failed to load accounting channel report" description={reconciliationQuery.error.message} />
    );
  }

  const matchedCount = channels.filter((row) => row.mismatch_status === "MATCHED").length;
  const expectedCount = channels.filter((row) => row.mismatch_status === "EXPECTED").length;
  const errorCount = channels.filter((row) => row.mismatch_status === "ERROR").length;

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm">
        <div className="space-y-3">
          <p className="text-xs font-medium tracking-[0.02em] text-foreground/80">Periode report</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant={period === "all" ? "default" : "outline"} size="sm" onClick={() => setPeriod("all")}>
              All time
            </Button>
            <Button
              variant={period === "this_month" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("this_month")}
            >
              Bulan ini
            </Button>
            <Button variant={period === "custom" ? "default" : "outline"} size="sm" onClick={() => setPeriod("custom")}>
              Custom date range
            </Button>
          </div>
          {period === "custom" ? (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1.5 text-xs font-medium tracking-[0.02em] text-foreground/80">
                Dari tanggal
                <Input type="date" value={customFromDate} onChange={(event) => setCustomFromDate(event.target.value)} />
              </label>
              <label className="space-y-1.5 text-xs font-medium tracking-[0.02em] text-foreground/80">
                Sampai tanggal
                <Input type="date" value={customToDate} onChange={(event) => setCustomToDate(event.target.value)} />
              </label>
            </div>
          ) : null}
          {period === "custom" && !customRangeValid ? (
            <p className="text-xs text-destructive">Isi rentang tanggal custom yang valid (from tidak boleh melebihi to).</p>
          ) : null}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Channels"
          value={String(report?.summary.channel_count ?? 0)}
          subtitle="Jumlah channel yang ikut dihitung dari jurnal yang ada."
          icon={<Landmark className="size-4" />}
        />
        <MetricCard
          title="Matched"
          value={String(matchedCount)}
          subtitle="Channel tanpa mismatch pada pembacaan saat ini."
          icon={<Wallet className="size-4" />}
        />
        <MetricCard
          title="Expected"
          value={String(expectedCount)}
          subtitle="Channel dengan selisih yang masih dianggap normal."
          icon={<AlertTriangle className="size-4" />}
        />
        <MetricCard
          title="Error"
          value={String(errorCount)}
          subtitle="Channel dengan data jurnal yang tidak konsisten."
          icon={<AlertTriangle className="size-4" />}
        />
      </div>
      {period === "custom" && !customRangeValid ? (
        <EmptyState title="Custom date range belum valid" description="Lengkapi tanggal from dan to untuk memuat report." />
      ) : (
        <DataTable columns={columns} data={channels} emptyMessage="No channel accounting report found." />
      )}
    </div>
  );
}
