"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageShell } from "@/components/foundation/page-shell";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { MetricCard } from "@/components/layout/stats-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import { formatMoney, formatShortDate } from "@/lib/format";
import { isSettledPayoutStatus } from "@/lib/payout-status";
import { usePayoutBankAccounts, usePayoutTransfers, usePayouts } from "@/features/payout/use-payout-module";
import type { PayoutTransferInput } from "@/schemas/payout-module";
import type { PayoutTransferRecord } from "@/types/payout";

const columnHelper = createColumnHelper<PayoutTransferRecord>();

type TransferPageFilter = {
  payoutId: number | null;
  channelId: number | null;
};

function getTransferPageFilter(): TransferPageFilter {
  if (typeof window === "undefined") {
    return { payoutId: null, channelId: null };
  }

  const searchParams = new URLSearchParams(window.location.search);
  const payoutId = Number(searchParams.get("payout_id") ?? "");
  const channelId = Number(searchParams.get("channel_id") ?? "");

  return {
    payoutId: Number.isFinite(payoutId) && payoutId > 0 ? payoutId : null,
    channelId: Number.isFinite(channelId) && channelId > 0 ? channelId : null,
  };
}

export default function PayoutTransfersPage() {
  const hooks = usePayoutTransfers();
  const payoutsQuery = usePayouts().payoutsQuery;
  const bankAccountsQuery = usePayoutBankAccounts();
  const [pageFilter] = useState<TransferPageFilter>(() => getTransferPageFilter());

  const transferRows = useMemo(
    () =>
      (hooks.transfersQuery.data ?? []).filter((transfer) => {
        if (pageFilter.payoutId && transfer.payout_id !== pageFilter.payoutId) {
          return false;
        }

        if (
          pageFilter.channelId &&
          transfer.t_payout?.t_order?.m_channel?.channel_id !== pageFilter.channelId
        ) {
          return false;
        }

        return true;
      }),
    [hooks.transfersQuery.data, pageFilter.channelId, pageFilter.payoutId]
  );
  const totalTransfers = transferRows.length;
  const totalAmount = transferRows.reduce((sum, transfer) => sum + Number(transfer.amount), 0);

  const columns = [
    columnHelper.accessor("transfer_date", {
      header: "Tanggal transfer",
      cell: (info) => formatShortDate(info.getValue()),
    }),
    columnHelper.accessor("payout_id", {
      header: "Payout",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">#{row.original.payout_id}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.t_payout?.ref ?? "-"} / {row.original.t_payout?.t_order?.m_channel?.channel_name ?? "Tanpa channel"}
          </p>
        </div>
      ),
    }),
    columnHelper.accessor("accounts", {
      header: "Rekening bank",
      cell: ({ row }) =>
        row.original.accounts ? `${row.original.accounts.code} - ${row.original.accounts.name}` : "-",
    }),
    columnHelper.accessor("amount", {
      header: "Nominal",
      cell: (info) => formatMoney(Number(info.getValue())),
    }),
    columnHelper.accessor("notes", {
      header: "Catatan",
      cell: (info) => info.getValue() ?? "-",
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button size="icon-xs" variant="outline" onClick={() => hooks.openTransferModal(row.original)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon-xs" variant="outline" onClick={() => hooks.deleteTransfer(row.original.id)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    }),
  ];

  return (
    <PageShell
      eyebrow="Payout"
      title="Transfer Bank"
      description="Catat perpindahan dana saat saldo channel benar-benar masuk ke rekening bank."
    >
      {hooks.transfersQuery.isError ? (
        <EmptyState title="Gagal memuat transfer payout" description={hooks.transfersQuery.error.message} />
      ) : (
        <div className="space-y-5">
          {pageFilter.payoutId || pageFilter.channelId ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-border/70 bg-card/80 p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">
                Menampilkan transfer dengan filter
                {pageFilter.payoutId ? ` payout #${pageFilter.payoutId}` : ""}
                {pageFilter.payoutId && pageFilter.channelId ? " dan" : ""}
                {pageFilter.channelId ? ` channel #${pageFilter.channelId}` : ""}.
              </p>
              <Link
                href="/payout/transfers"
                className="text-sm font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
              >
                Lihat semua transfer
              </Link>
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <MetricCard title="Total transfer" value={String(totalTransfers)} subtitle="Jumlah transfer saldo ke bank." />
            <MetricCard title="Total nominal" value={formatMoney(totalAmount)} subtitle="Akumulasi dana yang dipindahkan ke bank." />
          </div>

          <div className="flex justify-end">
            <Button size="sm" onClick={() => hooks.openTransferModal()}>
              <Plus className="size-4" />
              Tambah transfer
            </Button>
          </div>

          <DataTable columns={columns} data={transferRows} emptyMessage="Belum ada transfer payout." />
        </div>
      )}

      <ModalFormShell
        open={hooks.transferModal.open}
        onOpenChange={hooks.transferModal.setOpen}
        title={hooks.editingTransfer ? "Ubah transfer payout" : "Buat transfer payout"}
        description="Pemicu manual paling aman untuk jurnal saldo ke bank saat dana benar-benar masuk rekening."
        isSubmitting={hooks.transferForm.formState.isSubmitting}
        onSubmit={() => hooks.transferForm.handleSubmit((values: PayoutTransferInput) => hooks.saveTransfer(values))()}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Payout" htmlFor="transfer_payout_id" error={hooks.transferForm.formState.errors.payout_id?.message}>
            <SelectNative
              id="transfer_payout_id"
              value={String(hooks.transferForm.watch("payout_id") || "")}
              onChange={(event) =>
                hooks.transferForm.setValue("payout_id", event.target.value ? Number(event.target.value) : 0, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <option value="">Pilih payout</option>
              {(payoutsQuery.data ?? []).filter((payout) => isSettledPayoutStatus(payout.payout_status)).map((payout) => (
                <option key={payout.payout_id} value={payout.payout_id}>
                  #{payout.payout_id} / {payout.ref ?? "-"} / {payout.t_order?.m_channel?.channel_name ?? "No channel"}
                </option>
              ))}
            </SelectNative>
          </FormField>
          <FormField label="Tanggal transfer" htmlFor="transfer_date" error={hooks.transferForm.formState.errors.transfer_date?.message}>
            <Input id="transfer_date" type="date" {...hooks.transferForm.register("transfer_date")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Nominal" htmlFor="transfer_amount" error={hooks.transferForm.formState.errors.amount?.message}>
            <Input id="transfer_amount" {...hooks.transferForm.register("amount")} />
          </FormField>
          <FormField label="Rekening bank" htmlFor="transfer_bank_account_id" error={hooks.transferForm.formState.errors.bank_account_id?.message}>
            <SelectNative
              id="transfer_bank_account_id"
              value={hooks.transferForm.watch("bank_account_id") ?? ""}
              onChange={(event) =>
                hooks.transferForm.setValue("bank_account_id", event.target.value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <option value="">Pilih rekening bank</option>
              {(bankAccountsQuery.data ?? []).map((account) => (
                <option key={account.id} value={account.id}>
                  {account.code} - {account.name}
                </option>
              ))}
            </SelectNative>
          </FormField>
        </div>
        <div className="grid gap-4">
          <FormField label="Catatan" htmlFor="transfer_notes" error={hooks.transferForm.formState.errors.notes?.message}>
            <Input id="transfer_notes" {...hooks.transferForm.register("notes")} />
          </FormField>
        </div>
      </ModalFormShell>
    </PageShell>
  );
}
