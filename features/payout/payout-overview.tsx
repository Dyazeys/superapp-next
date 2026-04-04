"use client";

import Link from "next/link";
import { ArrowRight, Landmark, ReceiptText } from "lucide-react";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import { formatCompactCurrency, formatMoney } from "@/lib/format";
import { sumPayoutDeductions, usePayoutAdjustments, usePayouts } from "@/features/payout/use-payout-module";

export function PayoutOverview() {
  const { payoutsQuery } = usePayouts();
  const { adjustmentsQuery } = usePayoutAdjustments();

  const totalGross = (payoutsQuery.data ?? []).reduce((sum, payout) => sum + Number(payout.total_price), 0);
  const totalNet = (payoutsQuery.data ?? []).reduce((sum, payout) => sum + Number(payout.omset), 0);
  const totalDeductions = (payoutsQuery.data ?? []).reduce(
    (sum, payout) => sum + sumPayoutDeductions(payout),
    0
  );
  const totalAdjustments = (adjustmentsQuery.data ?? []).reduce(
    (sum, adjustment) => sum + Number(adjustment.amount),
    0
  );

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <WorkspacePanel title="Payout records" description="Kelola header payout menggunakan tabel payout yang sudah ada.">
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

      <WorkspacePanel title="Payout adjustments" description="Kelola adjustments payout yang sudah tersedia di schema.">
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

      <WorkspacePanel
        title="Net payout"
        description={`${payoutsQuery.data?.length ?? 0} payout records terdeteksi dari ledger payout.`}
      >
        <div className="space-y-2">
          <p className="text-3xl font-semibold tracking-tight">{formatCompactCurrency(totalNet)}</p>
          <p className="text-sm text-muted-foreground">
            Gross {formatMoney(totalGross)} dengan potongan/fee {formatMoney(totalDeductions)}.
          </p>
        </div>
      </WorkspacePanel>

      <WorkspacePanel
        title="Adjustments value"
        description={`${adjustmentsQuery.data?.length ?? 0} payout adjustments terhubung ke referensi dan channel.`}
      >
        <div className="space-y-2">
          <p className="text-3xl font-semibold tracking-tight">{formatCompactCurrency(totalAdjustments)}</p>
          <p className="text-sm text-muted-foreground">Nilai adjustment sesuai data yang ada. Tidak ada otomatisasi baru.</p>
        </div>
      </WorkspacePanel>
    </div>
  );
}
