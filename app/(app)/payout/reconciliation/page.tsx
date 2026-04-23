"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { AlertTriangle, BanknoteArrowDown, Landmark, Wallet } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { MetricCard } from "@/components/layout/stats-card";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import { usePayoutReconciliation } from "@/features/payout/use-payout-reconciliation";
import { formatMoney } from "@/lib/format";
import type { PayoutReconciliationChannelRecord } from "@/types/payout";

const columnHelper = createColumnHelper<PayoutReconciliationChannelRecord>();

function formatDelta(value: string) {
  const amount = Number(value);
  const sign = amount > 0 ? "+" : "";
  return `${sign}${formatMoney(amount)}`;
}

function mismatchTone(status: PayoutReconciliationChannelRecord["mismatch_status"]) {
  if (status === "ERROR") return "danger";
  if (status === "EXPECTED") return "warning";
  return "success";
}

function areaTone(
  mismatches: PayoutReconciliationChannelRecord["mismatches"],
  area: "PIUTANG_VS_PAYOUT" | "SALDO_VS_BANK_TRANSFER"
) {
  const areaMismatches = mismatches.filter((item) => item.area === area);
  if (areaMismatches.some((item) => item.category === "ERROR")) return "danger";
  if (areaMismatches.some((item) => item.category === "EXPECTED")) return "warning";
  return "success";
}

function toDateInputValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildHref(pathname: string, params: Record<string, string | number | null | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export default function PayoutReconciliationPage() {
  const today = useMemo(() => new Date(), []);
  const [period, setPeriod] = useState<"all" | "this_month" | "custom">("all");
  const [fromDate, setFromDate] = useState(toDateInputValue(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [toDate, setToDate] = useState(toDateInputValue(today));
  const reconciliationFilter = useMemo(
    () =>
      period === "custom"
        ? {
            period,
            fromDate,
            toDate,
          }
        : { period },
    [period, fromDate, toDate]
  );
  const reconciliationEnabled = period !== "custom" || Boolean(fromDate && toDate);
  const reconciliationQuery = usePayoutReconciliation(reconciliationFilter, reconciliationEnabled);
  const report = reconciliationQuery.data;
  const channels = report?.channels ?? [];
  const rules = report?.rules ?? [];

  const columns = [
    columnHelper.accessor("channel_name", {
      header: "Channel",
      cell: (info) => (
        <div className="space-y-1">
          <p className="font-medium">{info.getValue()}</p>
          <p className="text-xs text-muted-foreground">
            Piutang {info.row.original.piutang_account_code ?? "-"} / Saldo {info.row.original.saldo_account_code ?? "-"}
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link
              href={buildHref("/payout/records", { channel_id: info.row.original.channel_id })}
              className="rounded-full border border-border/70 px-2 py-1 text-foreground/80 transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-foreground"
            >
              Lihat payout
            </Link>
            <Link
              href={buildHref("/payout/adjustments", { channel_id: info.row.original.channel_id })}
              className="rounded-full border border-border/70 px-2 py-1 text-foreground/80 transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-foreground"
            >
              Lihat adjustment
            </Link>
            <Link
              href={buildHref("/payout/transfers", { channel_id: info.row.original.channel_id })}
              className="rounded-full border border-border/70 px-2 py-1 text-foreground/80 transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-foreground"
            >
              Lihat transfer
            </Link>
          </div>
          {info.row.original.ref_breakdowns.length > 0 ? (
            <div className="space-y-1 text-xs text-muted-foreground">
              {info.row.original.ref_breakdowns.map((item) => (
                <div key={item.ref} className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2">
                  <p>
                    Ref {item.ref}: sales {formatMoney(Number(item.sales_posted))}, payout{" "}
                    {formatMoney(Number(item.payout_posted))}, delta {formatDelta(item.delta)}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Link
                      href={buildHref("/payout/records", { ref: item.ref, channel_id: info.row.original.channel_id })}
                      className="text-foreground/80 underline underline-offset-4 hover:text-foreground"
                    >
                      Buka payout ref ini
                    </Link>
                    <Link
                      href={buildHref("/payout/adjustments", { ref: item.ref, channel_id: info.row.original.channel_id })}
                      className="text-foreground/80 underline underline-offset-4 hover:text-foreground"
                    >
                      Buka adjustment ref ini
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ),
    }),
    columnHelper.accessor("total_sales_receivable_posted", {
      header: "Piutang Terposting",
      cell: (info) => formatMoney(Number(info.getValue())),
    }),
    columnHelper.accessor("total_payout_settlement_posted", {
      header: "Payout Terposting",
      cell: (info) => formatMoney(Number(info.getValue())),
    }),
    columnHelper.accessor("sales_receivable_vs_payout_settlement_diff", {
      header: "Selisih Sales vs Payout",
      cell: (info) => (
        <StatusBadge
          label={formatDelta(info.getValue())}
          tone={areaTone(info.row.original.mismatches, "PIUTANG_VS_PAYOUT")}
        />
      ),
    }),
    columnHelper.accessor("total_saldo", {
      header: "Saldo",
      cell: (info) => formatMoney(Number(info.getValue())),
    }),
    columnHelper.accessor("total_bank_transfer", {
      header: "Transfer ke Bank",
      cell: (info) => formatMoney(Number(info.getValue())),
    }),
    columnHelper.accessor("saldo_vs_bank_transfer_diff", {
      header: "Selisih Saldo vs Transfer",
      cell: (info) => (
        <StatusBadge
          label={formatDelta(info.getValue())}
          tone={areaTone(info.row.original.mismatches, "SALDO_VS_BANK_TRANSFER")}
        />
      ),
    }),
    columnHelper.accessor("mismatches", {
      header: "Status Audit",
      cell: (info) => {
        const mismatches = info.getValue();
        if (mismatches.length === 0) {
          return <StatusBadge label="MATCHED" tone="success" />;
        }

        return (
          <div className="space-y-2">
            <StatusBadge label={info.row.original.mismatch_status} tone={mismatchTone(info.row.original.mismatch_status)} />
            <div className="flex flex-wrap gap-2">
              {mismatches.map((item) => (
                <StatusBadge
                  key={`${item.rule_code}-${item.message}`}
                  label={`${item.category}: ${item.message}`}
                  tone={item.category === "ERROR" ? "danger" : "warning"}
                />
              ))}
            </div>
          </div>
        );
      },
    }),
  ];

  return (
    <PageShell
      eyebrow="Payout"
      title="Rekonsiliasi Payout"
      description="Audit read-only per channel untuk membandingkan saldo ledger, payout, adjustment, dan transfer tanpa membuat jurnal baru atau mengubah data."
    >
      <div className="mb-5 grid gap-3 rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm md:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)]">
        <SelectNative
          value={period}
          onChange={(event) => setPeriod(event.target.value as "all" | "this_month" | "custom")}
        >
          <option value="all">Semua periode</option>
          <option value="this_month">Bulan ini</option>
          <option value="custom">Tanggal khusus</option>
        </SelectNative>
        <Input
          type="date"
          value={fromDate}
          disabled={period !== "custom"}
          onChange={(event) => setFromDate(event.target.value)}
        />
        <Input
          type="date"
          value={toDate}
          disabled={period !== "custom"}
          onChange={(event) => setToDate(event.target.value)}
        />
        <p className="text-sm text-muted-foreground md:col-span-3">
          {period === "all"
            ? "Menampilkan seluruh data payout, adjustment, transfer, dan jurnal yang tersedia."
            : period === "this_month"
              ? "Menampilkan data periode bulan berjalan."
              : "Masukkan tanggal awal dan akhir untuk audit rekonsiliasi yang lebih spesifik."}
        </p>
      </div>
      {reconciliationQuery.isError ? (
        <EmptyState title="Gagal memuat rekonsiliasi payout" description={reconciliationQuery.error.message} />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-5">
            <MetricCard
              title="Channel diaudit"
              value={String(report?.summary.channel_count ?? 0)}
              subtitle="Jumlah channel yang ikut dihitung."
              icon={<Landmark className="size-4" />}
            />
            <MetricCard
              title="Channel selisih"
              value={String(report?.summary.mismatched_channel_count ?? 0)}
              subtitle="Total channel yang memiliki EXPECTED mismatch atau ERROR."
              icon={<AlertTriangle className="size-4" />}
            />
            <MetricCard
              title="Mismatch normal"
              value={String(report?.summary.expected_channel_count ?? 0)}
              subtitle="Mismatch yang masih normal, misalnya outstanding atau saldo belum ditarik."
              icon={<Wallet className="size-4" />}
            />
            <MetricCard
              title="Butuh tindakan"
              value={String(report?.summary.error_channel_count ?? 0)}
              subtitle="Mismatch yang menunjukkan data tidak konsisten atau mapping hilang."
              icon={<BanknoteArrowDown className="size-4" />}
            />
            <MetricCard
              title="Channel cocok"
              value={String(Math.max(0, (report?.summary.channel_count ?? 0) - (report?.summary.mismatched_channel_count ?? 0)))}
              subtitle="Channel tanpa selisih pada hasil pembacaan sekarang."
            />
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold">Aturan rekonsiliasi</h2>
              <p className="text-sm text-muted-foreground">
                Rekonsiliasi membedakan mismatch normal (`EXPECTED`) dan mismatch yang butuh tindakan (`ERROR`).
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {rules.map((rule) => (
                <StatusBadge
                  key={rule.rule_code}
                  label={`${rule.category}: ${rule.description}`}
                  tone={rule.category === "ERROR" ? "danger" : "warning"}
                />
              ))}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <MetricCard
                title="Payout belum terpetakan"
                value={String(report?.summary.payout_without_channel_count ?? 0)}
                subtitle={`Total ${formatMoney(Number(report?.summary.payout_without_channel_amount ?? 0))} belum bisa dipetakan ke channel.`}
                icon={<Wallet className="size-4" />}
              />
              <MetricCard
                title="Transfer belum terpetakan"
                value={String(report?.summary.transfer_without_channel_count ?? 0)}
                subtitle={`Total ${formatMoney(Number(report?.summary.transfer_without_channel_amount ?? 0))} belum bisa dipetakan ke channel.`}
                icon={<BanknoteArrowDown className="size-4" />}
              />
            </div>
          </div>
          <DataTable columns={columns} data={channels} emptyMessage="Belum ada channel yang bisa ditampilkan untuk rekonsiliasi." />
        </div>
      )}
    </PageShell>
  );
}
