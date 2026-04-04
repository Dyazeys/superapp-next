"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney, formatShortDate } from "@/lib/format";
import { usePayoutAdjustments, usePayoutChannels, usePayoutOrders } from "@/features/payout/use-payout-module";
import type { PayoutAdjustmentInput } from "@/schemas/payout-module";
import type { PayoutAdjustmentRecord } from "@/types/payout";

const columnHelper = createColumnHelper<PayoutAdjustmentRecord>();

export default function PayoutAdjustmentsPage() {
  const hooks = usePayoutAdjustments();
  const orderLookupQuery = usePayoutOrders();
  const channelsQuery = usePayoutChannels();

  const columns = [
    columnHelper.accessor("ref", {
      header: "Reference",
      cell: ({ row, getValue }) => (
        <div>
          <p className="font-medium">{getValue() ?? "-"}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.t_order?.order_no ?? "No linked order"} / {row.original.m_channel?.channel_name ?? row.original.t_order?.m_channel?.channel_name ?? "No channel"}
          </p>
        </div>
      ),
    }),
    columnHelper.accessor("payout_date", {
      header: "Payout Date",
      cell: (info) => formatShortDate(info.getValue()),
    }),
    columnHelper.accessor("adjustment_date", {
      header: "Adjustment Date",
      cell: (info) => (info.getValue() ? formatShortDate(info.getValue() as string) : "-"),
    }),
    columnHelper.accessor("adjustment_type", {
      header: "Type",
      cell: (info) => <StatusBadge label={info.getValue() ?? "-"} tone="info" />,
    }),
    columnHelper.accessor("reason", {
      header: "Reason",
      cell: (info) => info.getValue() ?? "-",
    }),
    columnHelper.accessor("amount", {
      header: "Amount",
      cell: (info) => formatMoney(Number(info.getValue())),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button size="icon-xs" variant="outline" onClick={() => hooks.openAdjustmentModal(row.original)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon-xs" variant="outline" onClick={() => hooks.deleteAdjustment(row.original.adjustment_id)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    }),
  ];

  return (
    <PageShell
      eyebrow="Payout"
      title="Payout Adjustments"
      description="Maintain payout adjustments already supported by the schema, including reference, channel, reason, amount, and payout dates."
    >
      <datalist id="payout-adjustment-refs">
        {(orderLookupQuery.data ?? []).map((order) =>
          order.ref_no ? (
            <option key={order.order_no} value={order.ref_no}>
              {order.order_no} / {order.m_channel?.channel_name ?? "No channel"}
            </option>
          ) : null
        )}
      </datalist>
      <datalist id="payout-adjustment-channel-ids">
        {(channelsQuery.data ?? []).map((channel) => (
          <option key={channel.channel_id} value={channel.channel_id}>
            {channel.channel_name}
          </option>
        ))}
      </datalist>

      <div className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => hooks.openAdjustmentModal()}>
            <Plus className="size-4" />
            Add adjustment
          </Button>
        </div>
        <DataTable columns={columns} data={hooks.adjustmentsQuery.data ?? []} emptyMessage="No payout adjustments found." />
      </div>

      <ModalFormShell
        open={hooks.adjustmentModal.open}
        onOpenChange={hooks.adjustmentModal.setOpen}
        title={hooks.editingAdjustment ? "Edit payout adjustment" : "Create payout adjustment"}
        description="Maintain payout adjustment rows only. No posting or accounting automation is added here."
        isSubmitting={hooks.adjustmentForm.formState.isSubmitting}
        onSubmit={() => {
          return hooks.adjustmentForm.handleSubmit((values: PayoutAdjustmentInput) => hooks.saveAdjustment(values))();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Reference" htmlFor="adjustment_ref">
            <Input id="adjustment_ref" list="payout-adjustment-refs" {...hooks.adjustmentForm.register("ref")} />
          </FormField>
          <FormField
            label="Payout date"
            htmlFor="adjustment_payout_date"
            error={hooks.adjustmentForm.formState.errors.payout_date?.message}
          >
            <Input id="adjustment_payout_date" type="date" {...hooks.adjustmentForm.register("payout_date")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Adjustment date"
            htmlFor="adjustment_date"
            error={hooks.adjustmentForm.formState.errors.adjustment_date?.message}
          >
            <Input id="adjustment_date" type="date" {...hooks.adjustmentForm.register("adjustment_date")} />
          </FormField>
          <FormField
            label="Channel ID"
            htmlFor="adjustment_channel_id"
            error={hooks.adjustmentForm.formState.errors.channel_id?.message}
          >
            <Input
              id="adjustment_channel_id"
              list="payout-adjustment-channel-ids"
              {...hooks.adjustmentForm.register("channel_id", { valueAsNumber: true })}
            />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Type" htmlFor="adjustment_type">
            <Input id="adjustment_type" {...hooks.adjustmentForm.register("adjustment_type")} />
          </FormField>
          <FormField label="Amount" htmlFor="adjustment_amount" error={hooks.adjustmentForm.formState.errors.amount?.message}>
            <Input id="adjustment_amount" {...hooks.adjustmentForm.register("amount")} />
          </FormField>
        </div>
        <FormField label="Reason" htmlFor="adjustment_reason">
          <Textarea id="adjustment_reason" {...hooks.adjustmentForm.register("reason")} />
        </FormField>
      </ModalFormShell>
    </PageShell>
  );
}
