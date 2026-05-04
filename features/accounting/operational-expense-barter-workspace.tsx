"use client";

import { useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Box, Plus, ReceiptText, ShieldCheck, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { MetricCard } from "@/components/layout/stats-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InventoryPicker } from "@/components/patterns/inventory-picker";
import { SelectNative } from "@/components/ui/select-native";
import { Textarea } from "@/components/ui/textarea";
import {
  useAccountingAccounts,
  useAccountingInventoryLookup,
  useAccountingOperationalExpenseBarterManager,
} from "@/features/accounting/use-accounting-module";
import { formatShortDate } from "@/lib/format";
import type {
  OperationalExpenseBarterInput,
  OperationalExpenseBarterItemInput,
} from "@/schemas/accounting-module";
import type {
  AccountingAccountRecord,
  AccountingOperationalExpenseBarterItemRecord,
  AccountingOperationalExpenseBarterRecord,
} from "@/types/accounting";

const barterColumnHelper = createColumnHelper<AccountingOperationalExpenseBarterRecord>();
const itemColumnHelper = createColumnHelper<AccountingOperationalExpenseBarterItemRecord>();

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

function manualOpexAccounts(accounts: AccountingAccountRecord[]) {
  const allowed = new Set(MANUAL_OPEX_ACCOUNT_CODES);
  return accounts
    .filter((account) => allowed.has(account.code as (typeof MANUAL_OPEX_ACCOUNT_CODES)[number]) && account.is_active)
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

export function OperationalExpenseBarterWorkspace() {
  const [search, setSearch] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const hooks = useAccountingOperationalExpenseBarterManager();
  const accountsQuery = useAccountingAccounts();
  const inventoryQuery = useAccountingInventoryLookup();

  const accountRows = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);
  const inventoryRows = useMemo(
    () => (inventoryQuery.data ?? []).filter((row) => row.is_active),
    [inventoryQuery.data]
  );
  const inventoryOptions = useMemo(
    () => inventoryRows.map((inv) => ({ value: inv.inv_code, label: `${inv.inv_code} - ${inv.inv_name}` })),
    [inventoryRows]
  );
  const barterRows = hooks.barterRows;
  const expenseAccountOptions = useMemo(() => manualOpexAccounts(accountRows), [accountRows]);
  const selectedExpenseAccountId = hooks.barterForm.watch("expense_account_id");
  const selectedLabelOptions = useMemo(
    () => accountLabelOptions(selectedExpenseAccountId, expenseAccountOptions),
    [expenseAccountOptions, selectedExpenseAccountId]
  );
  const selectedBarter = hooks.selectedBarter;
  const isDraftMode = !selectedBarter || selectedBarter.status === "DRAFT";

  const normalizedSearch = search.trim().toLowerCase();
  const filteredRows = barterRows.filter((row) => {
    if (normalizedSearch.length === 0) {
      return true;
    }

    const account = row.accounts_operational_expense_barter_expense_account_idToaccounts;
    const haystacks = [
      row.barter_date,
      row.status,
      row.expense_label ?? "",
      row.description,
      row.reference_no ?? "",
      account.code,
      account.name,
    ];

    return haystacks.some((value) => value.toLowerCase().includes(normalizedSearch));
  });

  const totalBarter = barterRows.length;
  const postedCount = barterRows.filter((row) => row.status === "POSTED").length;
  const draftCount = barterRows.filter((row) => row.status === "DRAFT").length;
  const totalAmount = barterRows.reduce((sum, row) => sum + Number(row.total_amount), 0);

  const openDetail = (barter: AccountingOperationalExpenseBarterRecord) => {
    hooks.setSelectedBarterId(barter.id);
    setDetailOpen(true);
  };

  const barterColumns = [
    barterColumnHelper.accessor("barter_date", {
      header: "Tanggal",
      cell: (info) => formatShortDate(info.getValue()),
    }),
    barterColumnHelper.display({
      id: "account",
      header: "Akun",
      cell: ({ row }) => {
        const account = row.original.accounts_operational_expense_barter_expense_account_idToaccounts;
        return (
          <div className="min-w-[220px]">
            <p className="font-medium">{account.code} - {account.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.expense_label ?? "Tanpa label detail"}</p>
          </div>
        );
      },
    }),
    barterColumnHelper.accessor("reference_no", {
      header: "Referensi",
      cell: (info) => info.getValue() ?? "-",
    }),
    barterColumnHelper.accessor("status", {
      header: "Status",
      cell: (info) => <StatusBadge label={info.getValue()} tone={statusTone(info.getValue())} />,
    }),
    barterColumnHelper.accessor("total_amount", {
      header: "Total",
      cell: (info) => formatRupiah(Number(info.getValue())),
    }),
    barterColumnHelper.display({
      id: "items",
      header: "Items",
      cell: ({ row }) => String(row.original.operational_expense_barter_items.length),
    }),
    barterColumnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => hooks.postBarter(row.original.id)}
            disabled={row.original.status !== "DRAFT"}
          >
            Post
          </Button>
          <Button size="sm" variant="outline" onClick={() => openDetail(row.original)}>
            Detail
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => hooks.voidBarter(row.original.id)}
            disabled={row.original.status !== "POSTED"}
          >
            Void
          </Button>
          <Button
            size="icon-xs"
            variant="outline"
            onClick={() => hooks.deleteBarter(row.original.id)}
            disabled={row.original.status === "POSTED"}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    }),
  ];

  const itemColumns = [
    itemColumnHelper.display({
      id: "inventory",
      header: "Inventory",
      cell: ({ row }) => (
        <div className="min-w-[220px]">
          <p className="font-medium">{row.original.master_inventory.inv_code}</p>
          <p className="text-xs text-muted-foreground">{row.original.master_inventory.inv_name}</p>
        </div>
      ),
    }),
    itemColumnHelper.accessor("qty", {
      header: "Qty",
    }),
    itemColumnHelper.accessor("unit_amount", {
      header: "Unit Amount",
      cell: (info) => formatRupiah(Number(info.getValue())),
    }),
    itemColumnHelper.accessor("line_amount", {
      header: "Line Amount",
      cell: (info) => formatRupiah(Number(info.getValue())),
    }),
    itemColumnHelper.accessor("notes", {
      header: "Notes",
      cell: (info) => info.getValue() ?? "-",
    }),
    itemColumnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => hooks.openItemModal(row.original)}
            disabled={!isDraftMode}
          >
            Edit
          </Button>
          <Button
            size="icon-xs"
            variant="outline"
            onClick={() => selectedBarter && hooks.deleteItem(selectedBarter.id, row.original.id)}
            disabled={!isDraftMode || !selectedBarter}
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
      title="Opex Barter"
      description="Halaman utama fokus ke daftar barter. Form header dan item dibuka lewat popup supaya workspace tetap ringan."
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Total barter" value={String(totalBarter)} subtitle="Jumlah transaksi barter." icon={<Box className="size-4" />} />
          <MetricCard title="Draft" value={String(draftCount)} subtitle="Barter yang masih bisa diedit." icon={<ReceiptText className="size-4" />} />
          <MetricCard title="Posted" value={String(postedCount)} subtitle="Barter yang sudah memotong stok." icon={<ShieldCheck className="size-4" />} />
          <MetricCard title="Nilai total" value={formatRupiah(totalAmount)} subtitle="Akumulasi total semua barter." />
        </div>

        {hooks.barterQuery.isError ? (
          <EmptyState title="Gagal memuat barter" description={hooks.barterQuery.error.message} />
        ) : (
          <div className="rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Daftar opex barter</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pilih transaksi untuk lihat detail item, edit header, tambah item, lalu post atau void.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari tanggal, akun, label, atau referensi..."
                  className="w-[280px]"
                />
                <Button size="sm" onClick={() => hooks.openBarterModal()}>
                  <Plus className="size-4" />
                  Tambah barter
                </Button>
              </div>
            </div>

            <div className="mt-5">
              <DataTable
                columns={barterColumns}
                data={filteredRows}
                emptyMessage="Belum ada transaksi opex barter."
                pagination={{ enabled: true, pageSize: 10, pageSizeOptions: [10, 20, 50] }}
              />
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={detailOpen && Boolean(selectedBarter)}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) {
            hooks.cancelItemForm();
          }
        }}
      >
        <DialogContent className="gap-0 sm:max-w-[980px]">
          <DialogHeader>
            <DialogTitle>Detail barter</DialogTitle>
            <DialogDescription>
              Review header transaksi, item inventory, dan action posting dalam satu popup.
            </DialogDescription>
          </DialogHeader>

          {selectedBarter ? (
            <div className="max-h-[78vh] space-y-5 overflow-y-auto bg-white py-5 pr-1 text-slate-900">
              <div className="flex flex-wrap items-start justify-between gap-3 rounded-[24px] border border-border/70 bg-background p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">
                      {selectedBarter.accounts_operational_expense_barter_expense_account_idToaccounts.code} -{" "}
                      {selectedBarter.accounts_operational_expense_barter_expense_account_idToaccounts.name}
                    </h3>
                    <StatusBadge label={selectedBarter.status} tone={statusTone(selectedBarter.status)} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedBarter.expense_label ?? "Tanpa label detail"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => hooks.openBarterModal(selectedBarter)}>
                    Edit header
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => hooks.openItemModal()} disabled={!isDraftMode}>
                    <Plus className="size-4" />
                    Tambah item
                  </Button>
                  <Button size="sm" onClick={() => hooks.postBarter(selectedBarter.id)} disabled={!isDraftMode}>
                    Post
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => hooks.voidBarter(selectedBarter.id)} disabled={selectedBarter.status !== "POSTED"}>
                    Void
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 rounded-[24px] border border-border/70 bg-background p-5 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Tanggal</p>
                  <p className="mt-1 font-medium">{formatShortDate(selectedBarter.barter_date)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Total</p>
                  <p className="mt-1 font-medium">{formatRupiah(Number(selectedBarter.total_amount))}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Reference</p>
                  <p className="mt-1 font-medium">{selectedBarter.reference_no ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Posted at</p>
                  <p className="mt-1 font-medium">
                    {selectedBarter.posted_at ? formatShortDate(selectedBarter.posted_at) : "-"}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Deskripsi</p>
                  <p className="mt-1 whitespace-pre-wrap font-medium">{selectedBarter.description}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Notes internal</p>
                  <p className="mt-1 whitespace-pre-wrap font-medium">{selectedBarter.notes_internal ?? "-"}</p>
                </div>
              </div>

              <div className="rounded-[24px] border border-border/70 bg-background p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">Item barter</h3>
                    <p className="text-sm text-muted-foreground">
                      Setiap item akan menghasilkan pengurangan stok saat transaksi diposting.
                    </p>
                  </div>
                  <StatusBadge
                    label={`${selectedBarter.operational_expense_barter_items.length} item`}
                    tone="neutral"
                  />
                </div>
                <DataTable
                  columns={itemColumns}
                  data={selectedBarter.operational_expense_barter_items}
                  emptyMessage="Belum ada item pada barter ini."
                  pagination={{ enabled: true, pageSize: 5, pageSizeOptions: [5, 10, 20] }}
                />
              </div>
            </div>
          ) : (
            <div className="py-8">
              <EmptyState title="Barter tidak ditemukan" description="Pilih ulang transaksi dari daftar barter." />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ModalFormShell
        open={hooks.barterModal.open}
        onOpenChange={hooks.barterModal.setOpen}
        title={hooks.editingBarter ? "Ubah barter" : "Buat barter"}
        description="Simpan header barter dulu, lalu tambah item dari popup detail transaksi."
        isSubmitting={hooks.barterForm.formState.isSubmitting}
        onSubmit={() => {
          return hooks.barterForm.handleSubmit(async (values: OperationalExpenseBarterInput) => {
            await hooks.saveBarter(values);
            setDetailOpen(true);
          })();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Tanggal"
            htmlFor="barter_date"
            error={hooks.barterForm.formState.errors.barter_date?.message}
          >
            <Input id="barter_date" type="date" {...hooks.barterForm.register("barter_date")} />
          </FormField>
          <FormField
            label="Akun beban"
            htmlFor="barter_expense_account_id"
            error={hooks.barterForm.formState.errors.expense_account_id?.message}
          >
            <SelectNative
              id="barter_expense_account_id"
              value={hooks.barterForm.watch("expense_account_id") ?? ""}
              onChange={(event) => hooks.barterForm.setValue("expense_account_id", event.target.value)}
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
            htmlFor="barter_expense_label"
            helperText="Dipakai untuk breakdown biaya tanpa bikin akun baru."
            error={hooks.barterForm.formState.errors.expense_label?.message}
          >
            <SelectNative
              id="barter_expense_label"
              value={hooks.barterForm.watch("expense_label") ?? ""}
              onChange={(event) =>
                hooks.barterForm.setValue("expense_label", event.target.value ? event.target.value : null)
              }
              disabled={!hooks.barterForm.watch("expense_account_id")}
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
            label="Reference no"
            htmlFor="barter_reference_no"
            error={hooks.barterForm.formState.errors.reference_no?.message}
          >
            <Input id="barter_reference_no" {...hooks.barterForm.register("reference_no")} />
          </FormField>
        </div>

        <FormField
          label="Deskripsi"
          htmlFor="barter_description"
          error={hooks.barterForm.formState.errors.description?.message}
        >
          <Textarea id="barter_description" {...hooks.barterForm.register("description")} />
        </FormField>

        <FormField
          label="Notes internal"
          htmlFor="barter_notes_internal"
          helperText="Opsional, untuk catatan operasional internal."
          error={hooks.barterForm.formState.errors.notes_internal?.message}
        >
          <Textarea id="barter_notes_internal" {...hooks.barterForm.register("notes_internal")} />
        </FormField>
      </ModalFormShell>

      <ModalFormShell
        open={hooks.itemModal.open}
        onOpenChange={hooks.itemModal.setOpen}
        title={hooks.editingItem ? "Ubah item barter" : "Tambah item barter"}
        description="Item inventory disimpan ke header barter yang sedang dipilih."
        isSubmitting={hooks.itemForm.formState.isSubmitting}
        onSubmit={() => {
          return hooks.itemForm.handleSubmit((values: OperationalExpenseBarterItemInput) => hooks.saveItem(values))();
        }}
      >
        <FormField
          label="Inventory"
          htmlFor="barter_item_inventory"
          error={hooks.itemForm.formState.errors.inv_code?.message}
        >
          <InventoryPicker
            id="barter_item_inventory"
            value={hooks.itemForm.watch("inv_code") ?? ""}
            options={inventoryOptions}
            isLoading={inventoryQuery.isLoading}
            placeholder="Pilih inventory"
            onValueChange={(next) => hooks.itemForm.setValue("inv_code", next)}
          />
        </FormField>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Qty" htmlFor="barter_item_qty" error={hooks.itemForm.formState.errors.qty?.message}>
            <Input
              id="barter_item_qty"
              type="number"
              min={1}
              value={String(hooks.itemForm.watch("qty") ?? 1)}
              onChange={(event) => hooks.itemForm.setValue("qty", Number(event.target.value || 1))}
            />
          </FormField>
          <FormField
            label="Unit amount"
            htmlFor="barter_item_unit_amount"
            error={hooks.itemForm.formState.errors.unit_amount?.message}
          >
            <Input id="barter_item_unit_amount" {...hooks.itemForm.register("unit_amount")} />
          </FormField>
        </div>

        <FormField
          label="Notes"
          htmlFor="barter_item_notes"
          helperText="Opsional, untuk catatan khusus item barter."
          error={hooks.itemForm.formState.errors.notes?.message}
        >
          <Textarea id="barter_item_notes" {...hooks.itemForm.register("notes")} />
        </FormField>
      </ModalFormShell>
    </PageShell>
  );
}
