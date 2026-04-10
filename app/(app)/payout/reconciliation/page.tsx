"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { AlertTriangle, BanknoteArrowDown, Landmark, Wallet } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { MetricCard } from "@/components/layout/stats-card";
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

export default function PayoutReconciliationPage() {
  const reconciliationQuery = usePayoutReconciliation({ period: "all" });
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
          {info.row.original.ref_breakdowns.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Ref:{" "}
              {info.row.original.ref_breakdowns
                .map((item) => `${item.ref} (sales ${formatMoney(Number(item.sales_posted))}, payout ${formatMoney(Number(item.payout_posted))}, delta ${formatDelta(item.delta)})`)
                .join(" | ")}
            </p>
          ) : null}
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
      header: "Transfer Bank",
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
      header: "Mismatch",
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
      title="Reconciliation"
      description="Cek read-only per channel untuk membandingkan saldo ledger vs payout/transfers tanpa membuat journal baru atau mengubah data."
    >
      {reconciliationQuery.isError ? (
        <EmptyState title="Failed to load payout reconciliation" description={reconciliationQuery.error.message} />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-5">
            <MetricCard
              title="Channels checked"
              value={String(report?.summary.channel_count ?? 0)}
              subtitle="Jumlah channel yang ikut dihitung."
              icon={<Landmark className="size-4" />}
            />
            <MetricCard
              title="Mismatch channels"
              value={String(report?.summary.mismatched_channel_count ?? 0)}
              subtitle="Total channel yang memiliki EXPECTED mismatch atau ERROR."
              icon={<AlertTriangle className="size-4" />}
            />
            <MetricCard
              title="Expected channels"
              value={String(report?.summary.expected_channel_count ?? 0)}
              subtitle="Mismatch yang masih normal, misalnya outstanding atau saldo belum ditarik."
              icon={<Wallet className="size-4" />}
            />
            <MetricCard
              title="Error channels"
              value={String(report?.summary.error_channel_count ?? 0)}
              subtitle="Mismatch yang menunjukkan data tidak konsisten atau mapping hilang."
              icon={<BanknoteArrowDown className="size-4" />}
            />
            <MetricCard
              title="Channels matched"
              value={String(Math.max(0, (report?.summary.channel_count ?? 0) - (report?.summary.mismatched_channel_count ?? 0)))}
              subtitle="Channel tanpa selisih pada hasil pembacaan sekarang."
            />
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold">Rules used</h2>
              <p className="text-sm text-muted-foreground">
                Reconciliation membedakan mismatch normal (`EXPECTED`) dan mismatch yang butuh tindakan (`ERROR`).
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
                title="Unmapped payouts"
                value={String(report?.summary.payout_without_channel_count ?? 0)}
                subtitle={`Total ${formatMoney(Number(report?.summary.payout_without_channel_amount ?? 0))} belum bisa dipetakan ke channel.`}
                icon={<Wallet className="size-4" />}
              />
              <MetricCard
                title="Unmapped transfers"
                value={String(report?.summary.transfer_without_channel_count ?? 0)}
                subtitle={`Total ${formatMoney(Number(report?.summary.transfer_without_channel_amount ?? 0))} belum bisa dipetakan ke channel.`}
                icon={<BanknoteArrowDown className="size-4" />}
              />
            </div>
          </div>
          <DataTable columns={columns} data={channels} emptyMessage="No channels found for reconciliation." />
        </div>
      )}
    </PageShell>
  );
}
