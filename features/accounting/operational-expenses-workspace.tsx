"use client";

import { useEffect, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, ReceiptText, RotateCcw, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { MetricCard } from "@/components/layout/stats-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import { Textarea } from "@/components/ui/textarea";
import { formatShortDate } from "@/lib/format";
import {
  useAccountingAccounts,
  useAccountingOperationalExpenseManager,
} from "@/features/accounting/use-accounting-module";
import type { OperationalExpenseInput } from "@/schemas/accounting-module";
import type { AccountingAccountRecord, AccountingOperationalExpenseRecord } from "@/types/accounting";

const columnHelper = createColumnHelper<AccountingOperationalExpenseRecord>();

const MANUAL_OPEX_ACCOUNT_CODES = [
  "61101",
  "61102",
  "61103",
  "61104",
  "62101",
  "62102",
  "62103",
  "62104",
  "62105",
  "62106",
  "62107",
  "62108",
  "62109",
  "62110",
  "62111",
] as const;

const OPEX_LABELS_BY_ACCOUNT_CODE: Record<string, string[]> = {
  "61101": ["Iklan MP"],
  "61102": ["KOL Tukar Produk"],
  "61103": ["Sponsorship"],
  "61104": ["Event"],
  "62101": ["Gaji", "Insentif"],
  "62102": ["Listrik", "Wifi", "Kuota", "Server", "Air"],
  "62103": ["BBM", "Tools Berlangganan", "Konsumsi CC"],
  "62104": ["Service & Maintenance", "Pajak Kendaraan"],
  "62105": ["Stok", "Acara"],
  "62106": ["Dinas Luar", "Tamu", "Keamanan/Sumbangan", "Bensin"],
  "62107": ["Kajian Rutin", "Workshop"],
  "62108": ["Ongkir pengiriman (non MP & Reseller)"],
  "62109": ["Sampling", "dll"],
  "62110": ["Maintenance", "dll"],
  "62111": ["Service", "Beli part"],
};

type OpexScope = "ALL" | "MARKETING" | "OPERATIONAL";

function opexScopeLabel(code: string) {
  return code.startsWith("611") ? "Marketing" : "Operasional";
}

function manualOpexAccounts(accounts: AccountingAccountRecord[]) {
  const allowed = new Set(MANUAL_OPEX_ACCOUNT_CODES);
  return accounts
    .filter((account) => allowed.has(account.code as (typeof MANUAL_OPEX_ACCOUNT_CODES)[number]) && account.is_active)
    .sort((left, right) => left.code.localeCompare(right.code));
}

function paymentAccounts(accounts: AccountingAccountRecord[]) {
  return accounts
    .filter((account) => account.code.startsWith("111") && account.is_active)
    .sort((left, right) => left.code.localeCompare(right.code));
}

function accountLabelOptions(expenseAccountId: string, accounts: AccountingAccountRecord[]) {
  const selectedAccount = accounts.find((account) => account.id === expenseAccountId);
  if (!selectedAccount) {
    return [];
  }
  return OPEX_LABELS_BY_ACCOUNT_CODE[selectedAccount.code] ?? [];
}

function statusTone(status: string) {
  if (status === "POSTED") return "success" as const;
  if (status === "VOID") return "danger" as const;
  return "warning" as const;
}

function formatRupiah(value: number) {
  return `Rp${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

export function OperationalExpensesWorkspace() {
  const hooks = useAccountingOperationalExpenseManager();
  const accountsQuery = useAccountingAccounts();
  const [scopeFilter, setScopeFilter] = useState<OpexScope>("ALL");
  const [search, setSearch] = useState("");

  const accountRows = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);
  const expenseRows = useMemo(() => hooks.expensesQuery.data ?? [], [hooks.expensesQuery.data]);
  const expenseAccountOptions = useMemo(() => manualOpexAccounts(accountRows), [accountRows]);
  const paymentAccountOptions = useMemo(() => paymentAccounts(accountRows), [accountRows]);
  const selectedExpenseAccountId = hooks.expenseForm.watch("expense_account_id");
  const selectedLabelOptions = useMemo(
    () => accountLabelOptions(selectedExpenseAccountId, expenseAccountOptions),
    [expenseAccountOptions, selectedExpenseAccountId]
  );

  useEffect(() => {
    const currentLabel = hooks.expenseForm.getValues("expense_label");
    if (currentLabel && !selectedLabelOptions.includes(currentLabel)) {
      hooks.expenseForm.setValue("expense_label", null);
    }
  }, [hooks.expenseForm, selectedLabelOptions]);

  useEffect(() => {
    hooks.expenseForm.setValue("is_product_barter", false);
    hooks.expenseForm.setValue("inv_code", null);
    hooks.expenseForm.setValue("qty", 0);
  }, [hooks.expenseForm]);

  const filteredRows = expenseRows.filter((row) => {
    const code = row.accounts_operational_expenses_expense_account_idToaccounts.code;
    const matchesScope =
      scopeFilter === "ALL" ||
      (scopeFilter === "MARKETING" ? code.startsWith("611") : code.startsWith("621"));
    const normalizedSearch = search.trim().toLowerCase();
    const matchesSearch =
      normalizedSearch.length === 0 ||
      row.accounts_operational_expenses_expense_account_idToaccounts.name.toLowerCase().includes(normalizedSearch) ||
      row.accounts_operational_expenses_expense_account_idToaccounts.code.toLowerCase().includes(normalizedSearch) ||
      (row.expense_label ?? "").toLowerCase().includes(normalizedSearch) ||
      row.description.toLowerCase().includes(normalizedSearch);

    return matchesScope && matchesSearch;
  });

  const totalRows = filteredRows.length;
  const totalAmount = filteredRows.reduce((sum, row) => sum + Number(row.amount), 0);
  const draftCount = filteredRows.filter((row) => row.status === "DRAFT").length;
  const postedCount = filteredRows.filter((row) => row.status === "POSTED").length;
  const voidCount = filteredRows.filter((row) => row.status === "VOID").length;
  const marketingCount = filteredRows.filter((row) =>
    row.accounts_operational_expenses_expense_account_idToaccounts.code.startsWith("611")
  ).length;
  const operationalCount = filteredRows.filter((row) =>
    row.accounts_operational_expenses_expense_account_idToaccounts.code.startsWith("621")
  ).length;
  const columns = [
    columnHelper.accessor("expense_date", {
      header: "Tanggal",
      cell: (info) => formatShortDate(info.getValue()),
    }),
    columnHelper.accessor("description", {
      header: "Keterangan",
      cell: ({ row, getValue }) => (
        <div className="max-w-[280px] min-w-[220px]">
          <p className="truncate font-medium" title={getValue()}>
            {getValue()}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <StatusBadge label={row.original.status} tone={statusTone(row.original.status)} />
            <span>{formatRupiah(Number(row.original.amount))}</span>
            {row.original.accounts_operational_expenses_payment_account_idToaccounts ? (
              <span title={row.original.accounts_operational_expenses_payment_account_idToaccounts.name}>
                {row.original.accounts_operational_expenses_payment_account_idToaccounts.code}
              </span>
            ) : null}
          </div>
        </div>
      ),
    }),
    columnHelper.display({
      id: "account",
      header: "Akun",
      cell: ({ row }) => {
        const account = row.original.accounts_operational_expenses_expense_account_idToaccounts;
        return (
          <div className="max-w-[220px] min-w-[180px]">
            <p className="font-medium">{account.code} - {account.name}</p>
            <p className="text-xs text-muted-foreground">{opexScopeLabel(account.code)}</p>
          </div>
        );
      },
    }),
    columnHelper.accessor("expense_label", {
      header: "Label",
      cell: (info) => (
        <div className="max-w-[220px] truncate" title={info.getValue() ?? "-"}>
          {info.getValue() ?? "-"}
        </div>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex min-w-[160px] justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => hooks.postExpense(row.original.id)}
            disabled={row.original.status !== "DRAFT"}
          >
            Post
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => hooks.voidExpense(row.original.id)}
            disabled={row.original.status !== "POSTED"}
          >
            Void
          </Button>
          <Button
            size="icon-xs"
            variant="outline"
            onClick={() => hooks.openExpenseModal(row.original)}
            disabled={row.original.status !== "DRAFT"}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            size="icon-xs"
            variant="outline"
            onClick={() => hooks.deleteExpense(row.original.id)}
            disabled={row.original.status !== "DRAFT"}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    }),
  ];

  return (
    <PageShell
      eyebrow="Accounting"
      title="Operational Expenses"
      description="Input opex marketing dan operasional dengan akun leaf yang rapi, label detail, dan jurnal otomatis."
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-12">
          <MetricCard
            title="Total opex"
            value={String(totalRows)}
            subtitle="Jumlah transaksi yang terlihat."
            icon={<ReceiptText className="size-4" />}
            className="2xl:col-span-2"
          />
          <MetricCard
            title="Total nominal"
            value={formatRupiah(totalAmount)}
            subtitle="Akumulasi nominal opex yang terlihat."
            className="md:col-span-2 xl:col-span-2 2xl:col-span-3"
          />
          <MetricCard title="Draft" value={String(draftCount)} subtitle="Opex yang belum diposting." />
          <MetricCard title="Posted" value={String(postedCount)} subtitle="Opex yang sudah membentuk jurnal." />
          <MetricCard
            title="Void"
            value={String(voidCount)}
            subtitle="Opex yang sudah dibatalkan."
            icon={<RotateCcw className="size-4" />}
          />
          <MetricCard title="Marketing" value={String(marketingCount)} subtitle="Transaksi akun 611xx." />
          <MetricCard title="Operasional" value={String(operationalCount)} subtitle="Transaksi akun 621xx." />
        </div>

        {hooks.expensesQuery.isError ? (
          <EmptyState title="Gagal memuat opex" description={hooks.expensesQuery.error.message} />
        ) : (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm md:flex-row md:items-center md:justify-between">
              <div className="grid w-full gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
                <SelectNative value={scopeFilter} onChange={(event) => setScopeFilter(event.target.value as OpexScope)}>
                  <option value="ALL">Semua scope</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="OPERATIONAL">Operasional</option>
                </SelectNative>
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari akun, label, atau keterangan..." />
              </div>
              <Button size="sm" onClick={() => hooks.openExpenseModal()}>
                <Plus className="size-4" />
                Tambah opex
              </Button>
            </div>

            <DataTable
              columns={columns}
              data={filteredRows}
              emptyMessage="Belum ada transaksi opex."
              pagination={{ enabled: true, pageSize: 10, pageSizeOptions: [10, 20, 50] }}
            />
          </div>
        )}
      </div>

      <ModalFormShell
        open={hooks.expenseModal.open}
        onOpenChange={hooks.expenseModal.setOpen}
        title={hooks.editingExpense ? "Ubah opex" : "Buat opex"}
        description="Simpan opex sebagai draft dulu, lalu klik Post dari tabel untuk membentuk jurnal OPERATIONAL_EXPENSE."
        isSubmitting={hooks.expenseForm.formState.isSubmitting}
        onSubmit={() => {
          return hooks.expenseForm.handleSubmit((values: OperationalExpenseInput) => hooks.saveExpense(values))();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Tanggal"
            htmlFor="opex_expense_date"
            error={hooks.expenseForm.formState.errors.expense_date?.message}
          >
            <Input id="opex_expense_date" type="date" {...hooks.expenseForm.register("expense_date")} />
          </FormField>
          <FormField
            label="Akun beban"
            htmlFor="opex_expense_account_id"
            error={hooks.expenseForm.formState.errors.expense_account_id?.message}
          >
            <SelectNative
              id="opex_expense_account_id"
              value={hooks.expenseForm.watch("expense_account_id") ?? ""}
              onChange={(event) => hooks.expenseForm.setValue("expense_account_id", event.target.value)}
            >
              <option value="">Pilih akun beban</option>
              {expenseAccountOptions.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.code} - {account.name}
                </option>
              ))}
            </SelectNative>
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Label detail"
            htmlFor="opex_expense_label"
            helperText="Dipakai untuk breakdown reporting tanpa bikin akun baru."
            error={hooks.expenseForm.formState.errors.expense_label?.message}
          >
            <SelectNative
              id="opex_expense_label"
              value={hooks.expenseForm.watch("expense_label") ?? ""}
              onChange={(event) =>
                hooks.expenseForm.setValue("expense_label", event.target.value ? event.target.value : null)
              }
              disabled={!hooks.expenseForm.watch("expense_account_id")}
            >
              <option value="">Tanpa label detail</option>
              {selectedLabelOptions.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </SelectNative>
          </FormField>
          <FormField
            label="Nominal"
            htmlFor="opex_amount"
            error={hooks.expenseForm.formState.errors.amount?.message}
          >
            <Input id="opex_amount" {...hooks.expenseForm.register("amount")} />
          </FormField>
        </div>

        <FormField
          label="Akun pembayaran"
          htmlFor="opex_payment_account_id"
          helperText="Umumnya kas kecil atau rekening bank 111xx. Untuk inventory release pakai modul Opex Barter."
          error={hooks.expenseForm.formState.errors.payment_account_id?.message}
        >
          <SelectNative
            id="opex_payment_account_id"
            value={hooks.expenseForm.watch("payment_account_id") ?? ""}
            onChange={(event) =>
              hooks.expenseForm.setValue("payment_account_id", event.target.value ? event.target.value : null)
            }
          >
            <option value="">Pilih akun pembayaran</option>
            {paymentAccountOptions.map((account) => (
              <option key={account.id} value={account.id}>
                {account.code} - {account.name}
              </option>
            ))}
          </SelectNative>
        </FormField>

        <FormField
          label="Keterangan"
          htmlFor="opex_description"
          error={hooks.expenseForm.formState.errors.description?.message}
        >
          <Textarea id="opex_description" {...hooks.expenseForm.register("description")} />
        </FormField>

        <FormField
          label="Receipt URL"
          htmlFor="opex_receipt_url"
          helperText="Opsional, untuk link bukti transaksi."
          error={hooks.expenseForm.formState.errors.receipt_url?.message}
        >
          <Input id="opex_receipt_url" {...hooks.expenseForm.register("receipt_url")} />
        </FormField>
      </ModalFormShell>
    </PageShell>
  );
}
