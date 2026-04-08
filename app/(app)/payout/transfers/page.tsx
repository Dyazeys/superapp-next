"use client";

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
import { formatMoney, formatShortDate } from "@/lib/format";
import { usePayoutBankAccounts, usePayoutTransfers, usePayouts } from "@/features/payout/use-payout-module";
import type { PayoutTransferInput } from "@/schemas/payout-module";
import type { PayoutTransferRecord } from "@/types/payout";

const columnHelper = createColumnHelper<PayoutTransferRecord>();

export default function PayoutTransfersPage() {
  const hooks = usePayoutTransfers();
  const payoutsQuery = usePayouts().payoutsQuery;
  const bankAccountsQuery = usePayoutBankAccounts();
  const transferRows = hooks.transfersQuery.data ?? [];
  const totalTransfers = transferRows.length;
  const totalAmount = transferRows.reduce((sum, transfer) => sum + Number(transfer.amount), 0);

  const columns = [
    columnHelper.accessor("transfer_date", {
      header: "Transfer Date",
      cell: (info) => formatShortDate(info.getValue()),
    }),
    columnHelper.accessor("payout_id", {
      header: "Payout",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">#{row.original.payout_id}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.t_payout?.ref ?? "-"} / {row.original.t_payout?.t_order?.m_channel?.channel_name ?? "No channel"}
          </p>
        </div>
      ),
    }),
    columnHelper.accessor("accounts", {
      header: "Bank Account",
      cell: ({ row }) =>
        row.original.accounts ? `${row.original.accounts.code} - ${row.original.accounts.name}` : "-",
    }),
    columnHelper.accessor("amount", {
      header: "Amount",
      cell: (info) => formatMoney(Number(info.getValue())),
    }),
    columnHelper.accessor("notes", {
      header: "Notes",
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
      title="Bank Transfers"
      description="Catat perpindahan dana saat saldo channel benar-benar masuk ke rekening bank."
    >
      {hooks.transfersQuery.isError ? (
        <EmptyState title="Failed to load payout transfers" description={hooks.transfersQuery.error.message} />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <MetricCard title="Total transfers" value={String(totalTransfers)} subtitle="Jumlah transfer saldo ke bank." />
            <MetricCard title="Transferred amount" value={formatMoney(totalAmount)} subtitle="Akumulasi dana yang dipindahkan ke bank." />
          </div>

          <div className="flex justify-end">
            <Button size="sm" onClick={() => hooks.openTransferModal()}>
              <Plus className="size-4" />
              Add transfer
            </Button>
          </div>

          <DataTable columns={columns} data={transferRows} emptyMessage="No payout transfers found." />
        </div>
      )}

      <ModalFormShell
        open={hooks.transferModal.open}
        onOpenChange={hooks.transferModal.setOpen}
        title={hooks.editingTransfer ? "Edit payout transfer" : "Create payout transfer"}
        description="Trigger manual paling aman untuk jurnal saldo ke bank saat dana benar-benar masuk rekening."
        isSubmitting={hooks.transferForm.formState.isSubmitting}
        onSubmit={() => hooks.transferForm.handleSubmit((values: PayoutTransferInput) => hooks.saveTransfer(values))()}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Payout ID" htmlFor="transfer_payout_id" error={hooks.transferForm.formState.errors.payout_id?.message}>
            <Input
              id="transfer_payout_id"
              list="payout-transfer-payout-ids"
              type="number"
              {...hooks.transferForm.register("payout_id", { valueAsNumber: true })}
            />
          </FormField>
          <FormField label="Transfer date" htmlFor="transfer_date" error={hooks.transferForm.formState.errors.transfer_date?.message}>
            <Input id="transfer_date" type="date" {...hooks.transferForm.register("transfer_date")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Amount" htmlFor="transfer_amount" error={hooks.transferForm.formState.errors.amount?.message}>
            <Input id="transfer_amount" {...hooks.transferForm.register("amount")} />
          </FormField>
          <FormField label="Bank account" htmlFor="transfer_bank_account_id" error={hooks.transferForm.formState.errors.bank_account_id?.message}>
            <Input id="transfer_bank_account_id" list="payout-transfer-bank-accounts" {...hooks.transferForm.register("bank_account_id")} />
          </FormField>
        </div>
        <div className="grid gap-4">
          <FormField label="Notes" htmlFor="transfer_notes" error={hooks.transferForm.formState.errors.notes?.message}>
            <Input id="transfer_notes" {...hooks.transferForm.register("notes")} />
          </FormField>
        </div>

        <datalist id="payout-transfer-payout-ids">
          {(payoutsQuery.data ?? []).map((payout) => (
            <option key={payout.payout_id} value={payout.payout_id}>
              {payout.ref ?? "-"} / {payout.t_order?.m_channel?.channel_name ?? "No channel"} / net {payout.omset}
            </option>
          ))}
        </datalist>
        <datalist id="payout-transfer-bank-accounts">
          {(bankAccountsQuery.data ?? []).map((account) => (
            <option key={account.id} value={account.id}>
              {account.code} - {account.name}
            </option>
          ))}
        </datalist>
      </ModalFormShell>
    </PageShell>
  );
}
