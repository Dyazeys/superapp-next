"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, HistoryIcon } from "lucide-react";
import { PageShell } from "@/components/foundation/page-shell";
import { DataTable } from "@/components/data/data-table";
import { MetricCard } from "@/components/layout/stats-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createColumnHelper } from "@tanstack/react-table";
import { useAccountMutation } from "@/features/accounting/use-accounting-module";
import type { AccountMutationLine } from "@/types/accounting";

const col = createColumnHelper<AccountMutationLine>();

const columns = [
  col.accessor("transaction_date", { header: "Tanggal", cell: (info) => new Date(info.getValue()).toLocaleDateString("id-ID") }),
  col.accessor("description", { header: "Keterangan" }),
  col.accessor("journal_entry_id", {
    header: "No. Jurnal",
    cell: (info) => <span className="text-xs font-mono text-slate-500">{info.getValue().slice(0, 8)}...</span>,
  }),
  col.accessor("debit", {
    header: "Debit",
    cell: (info) => (info.getValue() > 0 ? <span className="text-emerald-600 font-medium">{info.getValue().toLocaleString("id-ID")}</span> : "—"),
  }),
  col.accessor("credit", {
    header: "Kredit",
    cell: (info) => (info.getValue() > 0 ? <span className="text-red-600 font-medium">{info.getValue().toLocaleString("id-ID")}</span> : "—"),
  }),
  col.accessor("balance_after", {
    header: "Saldo",
    cell: (info) => <span className="font-medium">{info.getValue().toLocaleString("id-ID")}</span>,
  }),
];

type BalanceChange = {
  time: Date;
  from: number;
  to: number;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function MutationWorkspace({
  accountCode,
  title,
  description,
}: {
  accountCode: string;
  title: string;
  description: string;
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [openingBalance, setOpeningBalance] = useState(0);
  const [adjustInput, setAdjustInput] = useState("");
  const [history, setHistory] = useState<BalanceChange[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`;

  const query = useAccountMutation(accountCode, startDate, endDate, openingBalance);
  const data = query.data?.lines ?? [];

  const applyBalance = useCallback(() => {
    const newBalance = Number(adjustInput) || 0;
    if (newBalance === openingBalance) return;
    setHistory((prev) => [...prev, { time: new Date(), from: openingBalance, to: newBalance }]);
    setOpeningBalance(newBalance);
    setAdjustInput("");
  }, [adjustInput, openingBalance]);

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else { setMonth((m) => m - 1); }
  };

  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else { setMonth((m) => m + 1); }
  };

  const response = query.data;

  return (
    <PageShell eyebrow="Accounting" title={title} description={description}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs text-slate-400">Saldo Awal Saat Ini</p>
              <p className="text-lg font-semibold text-slate-900">
                Rp {openingBalance.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <span className="text-sm text-slate-500 whitespace-nowrap">Sesuaikan:</span>
              <Input
                type="text"
                inputMode="numeric"
                value={adjustInput}
                placeholder="0"
                onChange={(e) => setAdjustInput(e.target.value.replace(/\D/g, ""))}
                className="w-40 text-right font-mono"
              />
              <Button size="sm" onClick={applyBalance}>Terapkan</Button>
              {history.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setHistoryOpen(true)}>
                  <HistoryIcon className="size-4" />
                  <span className="text-xs">{history.length}x</span>
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="icon-xs" variant="outline" onClick={prevMonth}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm font-medium w-24 text-center">{MONTHS[month]} {year}</span>
            <Button size="icon-xs" variant="outline" onClick={nextMonth}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Riwayat Penyesuaian Saldo Awal</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              {history.toReversed().map((h, i) => {
                const diff = h.to - h.from;
                const sign = diff >= 0 ? "+" : "";
                return (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 text-xs">{h.time.toLocaleTimeString("id-ID")}</span>
                    <span className="text-slate-700">
                      {h.from.toLocaleString("id-ID")} → <strong>{h.to.toLocaleString("id-ID")}</strong>
                    </span>
                    <span className={`text-xs font-medium ${diff >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {sign}{diff.toLocaleString("id-ID")}
                    </span>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

        {response && (
          <div className="grid grid-cols-3 gap-4">
            <MetricCard title="Total Debit" value={response.total_debit.toLocaleString("id-ID")} />
            <MetricCard title="Total Kredit" value={response.total_credit.toLocaleString("id-ID")} />
            <MetricCard title="Saldo Akhir" value={response.ending_balance.toLocaleString("id-ID")} />
          </div>
        )}

        <DataTable
          columns={columns}
          data={data}
          emptyMessage="Belum ada mutasi di periode ini."
        />
      </div>
    </PageShell>
  );
}
