"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Building2, Landmark, ReceiptText } from "lucide-react";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import { formatCompactCurrency, formatMoney } from "@/lib/format";
import { isSettledPayoutStatus } from "@/lib/payout-status";
import { sumPayoutDeductions, usePayoutAdjustments, usePayouts } from "@/features/payout/use-payout-module";

export function PayoutOverview() {
  const { payoutsQuery } = usePayouts();
  const { adjustmentsQuery } = usePayoutAdjustments();

  const settledPayouts = (payoutsQuery.data ?? []).filter((payout) => isSettledPayoutStatus(payout.payout_status));
  const totalGross = settledPayouts.reduce((sum, payout) => sum + Number(payout.total_price), 0);
  const totalNet = settledPayouts.reduce((sum, payout) => sum + Number(payout.omset), 0);
  const totalDeductions = settledPayouts.reduce(
    (sum, payout) => sum + sumPayoutDeductions(payout),
    0
  );
  const totalAdjustments = (adjustmentsQuery.data ?? []).reduce(
    (sum, adjustment) => sum + Number(adjustment.amount),
    0
  );

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
      <WorkspacePanel title="Data payout" description="Kelola header payout menggunakan tabel payout yang sudah ada.">
        <Link
          href="/payout/records"
          className="flex items-center justify-between rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm font-medium transition-colors hover:border-slate-400 hover:bg-slate-50"
        >
          <span className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <ReceiptText className="size-4" />
            </span>
            Buka halaman
          </span>
          <ArrowRight className="size-4" />
        </Link>
      </WorkspacePanel>

      <WorkspacePanel title="Adjustment payout" description="Kelola adjustment payout yang sudah tersedia di skema.">
        <Link
          href="/payout/adjustments"
          className="flex items-center justify-between rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm font-medium transition-colors hover:border-slate-400 hover:bg-slate-50"
        >
          <span className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Landmark className="size-4" />
            </span>
            Buka halaman
          </span>
          <ArrowRight className="size-4" />
        </Link>
      </WorkspacePanel>

      <WorkspacePanel title="Transfer bank" description="Catat perpindahan saldo channel ke rekening bank secara manual.">
        <Link
          href="/payout/transfers"
          className="flex items-center justify-between rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm font-medium transition-colors hover:border-slate-400 hover:bg-slate-50"
        >
          <span className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Building2 className="size-4" />
            </span>
            Buka halaman
          </span>
          <ArrowRight className="size-4" />
        </Link>
      </WorkspacePanel>

      <WorkspacePanel title="Rekonsiliasi" description="Bandingkan piutang, payout, saldo, dan transfer bank secara read-only per channel.">
        <Link
          href="/payout/reconciliation"
          className="flex items-center justify-between rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm font-medium transition-colors hover:border-slate-400 hover:bg-slate-50"
        >
          <span className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <AlertTriangle className="size-4" />
            </span>
            Buka halaman
          </span>
          <ArrowRight className="size-4" />
        </Link>
      </WorkspacePanel>

      <WorkspacePanel
        title="Payout bersih"
        description={`${settledPayouts.length} payout settled terdeteksi dari ledger payout.`}
      >
        <div className="space-y-2">
          <p className="text-3xl font-semibold tracking-tight">{formatCompactCurrency(totalNet)}</p>
          <p className="text-sm text-muted-foreground">
            Bruto {formatMoney(totalGross)} dengan potongan/biaya {formatMoney(totalDeductions)}.
          </p>
        </div>
      </WorkspacePanel>

      <WorkspacePanel
        title="Nilai adjustment"
        description={`${adjustmentsQuery.data?.length ?? 0} adjustment payout terhubung ke referensi dan channel.`}
      >
        <div className="space-y-2">
          <p className="text-3xl font-semibold tracking-tight">{formatCompactCurrency(totalAdjustments)}</p>
          <p className="text-sm text-muted-foreground">Nilai adjustment sesuai data yang ada. Tidak ada otomatisasi baru.</p>
        </div>
      </WorkspacePanel>
    </div>
  );
}
