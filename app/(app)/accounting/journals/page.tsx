"use client";

import { useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { AlertTriangle } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { MetricCard } from "@/components/layout/stats-card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import {
  useAccountingJournalEntries,
  useAccountingJournals,
  useAccountingJournalSelection,
} from "@/features/accounting/use-accounting-module";
import type { AccountingJournalEntryLineRecord, AccountingJournalRecord } from "@/types/accounting";

const journalColumnHelper = createColumnHelper<AccountingJournalRecord>();
const entryColumnHelper = createColumnHelper<AccountingJournalEntryLineRecord>();

function toDateInput(value: string) {
  return value.slice(0, 10);
}

function formatMoney(value: string | number) {
  return Number(value).toLocaleString("id-ID", { maximumFractionDigits: 0 });
}

function isBalanced(journal: AccountingJournalRecord) {
  return Number(journal.total_debit) === Number(journal.total_credit);
}

function getBalanceGap(journal: AccountingJournalRecord) {
  return Math.abs(Number(journal.total_debit) - Number(journal.total_credit));
}

function formatSourceLabel(referenceType: string) {
  return referenceType.replaceAll("_", " ");
}

function formatJournalDescription(journal: Pick<AccountingJournalRecord, "reference_type" | "description">) {
  if (journal.reference_type === "SALES_ORDER_ITEM") {
    const salesMatch = journal.description.match(
      /^SALES posting for order\s+(.+?)\s+item\s+\d+\s+sku\s+(.+?)(?:\s+ref\s+(.+))?$/i
    );

    if (salesMatch) {
      const [, orderNo, sku, refNo] = salesMatch;
      return `Penjualan order ${orderNo} - SKU ${sku}${refNo ? ` - Ref ${refNo}` : ""}`;
    }
  }

  return journal.description;
}

function formatJournalLineMemo(journalLine: Pick<AccountingJournalEntryLineRecord, "memo" | "journal_entries">) {
  const rawMemo = journalLine.memo?.trim();
  if (!rawMemo) {
    return "-";
  }

  if (journalLine.journal_entries.reference_type === "SALES_ORDER_ITEM") {
    const orderMatch = rawMemo.match(/order\s+(.+?)\s+item\s+\d+$/i);
    const orderNo = orderMatch?.[1] ?? null;

    if (rawMemo.startsWith("Sales receivable for order ") && orderNo) {
      return `Piutang penjualan order ${orderNo}`;
    }

    if (rawMemo.startsWith("Sales revenue for order ") && orderNo) {
      return `Pendapatan penjualan order ${orderNo}`;
    }

    if (rawMemo.startsWith("HPP for order ") && orderNo) {
      return `HPP order ${orderNo}`;
    }

    if (rawMemo.startsWith("Inventory release for order ") && orderNo) {
      return `Pengeluaran persediaan order ${orderNo}`;
    }
  }

  return rawMemo;
}

export default function AccountingJournalsPage() {
  const [detailOpen, setDetailOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [balanceFilter, setBalanceFilter] = useState("ALL");
  const journalsQuery = useAccountingJournals();
  const { currentJournalId, setSelectedJournalId } = useAccountingJournalSelection(journalsQuery.data);
  const entriesQuery = useAccountingJournalEntries(currentJournalId ?? undefined);

  const allJournalRows = journalsQuery.data ?? [];
  const sourceOptions = Array.from(new Set(allJournalRows.map((journal) => journal.reference_type))).sort();
  const normalizedSearch = search.trim().toLowerCase();
  const journalRows = allJournalRows.filter((journal) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      journal.description.toLowerCase().includes(normalizedSearch) ||
      formatJournalDescription(journal).toLowerCase().includes(normalizedSearch) ||
      journal.reference_type.toLowerCase().includes(normalizedSearch) ||
      toDateInput(journal.transaction_date).includes(normalizedSearch);
    const matchesSource = sourceFilter === "ALL" || journal.reference_type === sourceFilter;
    const matchesBalance =
      balanceFilter === "ALL" ||
      (balanceFilter === "BALANCED" ? isBalanced(journal) : !isBalanced(journal));

    return matchesSearch && matchesSource && matchesBalance;
  });
  const selectedJournal = allJournalRows.find((journal) => journal.id === currentJournalId) ?? null;
  const totalJournals = journalRows.length;
  const totalJournalLines = journalRows.reduce((sum, row) => sum + Number(row.line_count || 0), 0);
  const totalDebit = journalRows.reduce((sum, row) => sum + Number(row.total_debit || 0), 0);
  const totalCredit = journalRows.reduce((sum, row) => sum + Number(row.total_credit || 0), 0);
  const balancedCount = journalRows.filter((journal) => isBalanced(journal)).length;
  const unbalancedRows = journalRows.filter((journal) => !isBalanced(journal));
  const currentLinesVisible = (entriesQuery.data ?? []).length;

  const journalColumns = [
    journalColumnHelper.accessor("description", {
      header: "Jurnal",
      cell: ({ row }) => {
        const isSelected = row.original.id === currentJournalId;

        return (
          <button
            type="button"
            className="text-left"
            onClick={() => {
              setSelectedJournalId(row.original.id);
              setDetailOpen(true);
            }}
          >
            <p className={`font-medium ${isSelected ? "text-blue-700" : "text-blue-600 hover:underline"}`}>
              {formatJournalDescription(row.original)}
            </p>
            <p className="text-xs text-muted-foreground">
              {toDateInput(row.original.transaction_date)} / {formatSourceLabel(row.original.reference_type)}
            </p>
          </button>
        );
      },
    }),
    journalColumnHelper.accessor("transaction_date", {
      header: "Tanggal",
      cell: (info) => toDateInput(info.getValue()),
    }),
    journalColumnHelper.accessor("reference_type", {
      header: "Sumber",
      cell: (info) => <StatusBadge label={formatSourceLabel(info.getValue())} tone="info" />,
    }),
    journalColumnHelper.display({
      id: "balance_status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge label={isBalanced(row.original) ? "Seimbang" : "Tidak seimbang"} tone={isBalanced(row.original) ? "success" : "warning"} />
      ),
    }),
    journalColumnHelper.accessor("line_count", {
      header: "Baris",
      cell: (info) => <StatusBadge label={String(info.getValue())} tone="neutral" />,
    }),
    journalColumnHelper.accessor("total_debit", {
      header: "Total Debit",
      cell: (info) => formatMoney(info.getValue()),
    }),
    journalColumnHelper.accessor("total_credit", {
      header: "Total Kredit",
      cell: (info) => formatMoney(info.getValue()),
    }),
  ];

  const entryColumns = [
    entryColumnHelper.accessor("accounts.code", {
      header: "Account",
      cell: ({ row }) => (
        <div className="min-w-[220px]">
          <p className="font-medium">{row.original.accounts.code}</p>
          <p className="text-xs text-muted-foreground">{row.original.accounts.name}</p>
        </div>
      ),
    }),
    entryColumnHelper.accessor("debit", { header: "Debit" }),
    entryColumnHelper.accessor("credit", { header: "Kredit" }),
    entryColumnHelper.display({
      id: "position",
      header: "Posisi",
      cell: ({ row }) => (
        <StatusBadge label={Number(row.original.debit) > 0 ? "Debit" : "Kredit"} tone="neutral" />
      ),
    }),
    entryColumnHelper.accessor("memo", {
      header: "Memo",
      cell: ({ row }) => (
        <div className="min-w-[260px] whitespace-normal break-words">{formatJournalLineMemo(row.original)}</div>
      ),
    }),
  ];

  return (
    <PageShell
      eyebrow="Accounting"
      title="Jurnal"
      description="Header jurnal dan detail debit/kredit sekarang ditampilkan dalam satu halaman audit."
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Total jurnal" value={String(totalJournals)} subtitle="Jumlah header jurnal yang terlihat." />
          <MetricCard title="Total baris jurnal" value={String(totalJournalLines)} subtitle="Akumulasi baris detail dari jurnal." />
          <MetricCard title="Jurnal seimbang" value={String(balancedCount)} subtitle="Header jurnal dengan debit = kredit." />
          <MetricCard
            title="Total debit / kredit"
            value={`${totalDebit.toLocaleString("id-ID", { maximumFractionDigits: 0 })} / ${totalCredit.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`}
            subtitle="Akumulasi dari jurnal yang terlihat."
          />
          <MetricCard
            title="Jurnal terpilih"
            value={selectedJournal ? toDateInput(selectedJournal.transaction_date) : "-"}
            subtitle={selectedJournal ? formatSourceLabel(selectedJournal.reference_type) : `${currentLinesVisible} baris terlihat`}
          />
        </div>

        {journalsQuery.isError ? (
          <EmptyState title="Gagal memuat jurnal" description={journalsQuery.error.message} />
        ) : (
          <div className="rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm">
            <div className="mb-4 space-y-1">
              <p className="text-sm font-semibold text-foreground">Daftar jurnal</p>
              <p className="text-sm text-muted-foreground">
                Klik jurnal untuk membuka popup detail debit/kredit dengan informasi yang mudah dipahami.
              </p>
            </div>
            {unbalancedRows.length > 0 ? (
              <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">Perlu audit lanjutan</p>
                  <p>
                    Ada {unbalancedRows.length} jurnal yang belum seimbang pada hasil saat ini. Selisih jurnal terpilih akan
                    ditampilkan di popup detail.
                  </p>
                </div>
              </div>
            ) : null}
            <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1.5fr)_220px_180px]">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari keterangan, sumber, atau tanggal..."
              />
              <SelectNative value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
                <option value="ALL">Semua sumber</option>
                {sourceOptions.map((source) => (
                  <option key={source} value={source}>
                    {formatSourceLabel(source)}
                  </option>
                ))}
              </SelectNative>
              <SelectNative value={balanceFilter} onChange={(event) => setBalanceFilter(event.target.value)}>
                <option value="ALL">Semua status</option>
                <option value="BALANCED">Seimbang</option>
                <option value="UNBALANCED">Tidak seimbang</option>
              </SelectNative>
            </div>
            <DataTable columns={journalColumns} data={journalRows} emptyMessage="Belum ada jurnal." />
          </div>
        )}
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="gap-0 sm:max-w-[980px]">
            <DialogHeader>
            <DialogTitle>Detail Jurnal</DialogTitle>
            <DialogDescription>
              {selectedJournal
                ? `${toDateInput(selectedJournal.transaction_date)} / ${formatSourceLabel(selectedJournal.reference_type)}`
                : "Pilih satu jurnal dari tabel untuk melihat detail debit dan kredit."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 bg-white py-5 text-slate-900">
            {selectedJournal && !isBalanced(selectedJournal) ? (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">Jurnal belum seimbang</p>
                  <p>Selisih debit dan kredit: {formatMoney(getBalanceGap(selectedJournal))}</p>
                </div>
              </div>
            ) : null}
            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Keterangan</p>
                <p className="mt-2 text-base font-semibold leading-7 text-slate-900">
                  {selectedJournal ? formatJournalDescription(selectedJournal) : "Belum ada jurnal dipilih."}
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Tanggal</p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    {selectedJournal ? toDateInput(selectedJournal.transaction_date) : "-"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{selectedJournal ? formatSourceLabel(selectedJournal.reference_type) : "Tidak ada sumber jurnal."}</p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Debit / Kredit</p>
                  <p className="mt-2 text-xl font-bold tracking-tight text-slate-900">
                    {selectedJournal
                      ? `${formatMoney(selectedJournal.total_debit)} / ${formatMoney(selectedJournal.total_credit)}`
                      : "0 / 0"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">Ringkasan nominal jurnal.</p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Status / Lines</p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    {selectedJournal ? String(selectedJournal.line_count) : "0"}
                  </p>
                  <div className="mt-2">
                    <StatusBadge
                      label={selectedJournal && isBalanced(selectedJournal) ? "Seimbang" : "Tidak seimbang"}
                      tone={selectedJournal && isBalanced(selectedJournal) ? "success" : "warning"}
                    />
                  </div>
                </div>
              </div>
            </div>

            {entriesQuery.isError ? (
              <EmptyState title="Gagal memuat detail jurnal" description={entriesQuery.error.message} />
            ) : currentJournalId ? (
              <DataTable
                columns={entryColumns}
                data={entriesQuery.data ?? []}
                emptyMessage="Belum ada baris jurnal."
                maxBodyHeight={420}
                stickyHeader
              />
            ) : (
              <EmptyState title="Pilih jurnal" description="Pilih satu jurnal untuk melihat detail baris debit dan kredit." />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
