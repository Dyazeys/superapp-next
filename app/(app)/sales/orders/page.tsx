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
import {
  parseSalesBooleanInput,
  SALES_BOOLEAN_OPTIONS,
  SALES_STATUS_OPTIONS,
  useSalesChannels,
  useSalesOrders,
  toDateInput,
} from "@/features/sales/use-sales-module";
import type { SalesOrderInput } from "@/schemas/sales-module";
import type { SalesOrderRecord } from "@/types/sales";

const columnHelper = createColumnHelper<SalesOrderRecord>();

export default function SalesOrdersPage() {
  const hooks = useSalesOrders();
  const channelsQuery = useSalesChannels();
  const { ordersQuery, orderForm, orderModal, editingOrder } = hooks;

  const columns = [
    columnHelper.accessor("order_no", {
      header: "Order",
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor("order_date", {
      header: "Date",
      cell: (info) => toDateInput(info.getValue()),
    }),
    columnHelper.accessor("channel_id", {
      header: "Channel",
      cell: (info) => info.row.original.m_channel?.channel_name ?? (info.getValue() ?? "-"),
    }),
    columnHelper.accessor("total_amount", { header: "Total" }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => <StatusBadge label={info.getValue()} tone="info" />,
    }),
    columnHelper.accessor("is_historical", {
      header: "Posting",
      cell: (info) => (
        <StatusBadge
          label={info.getValue() ? "Historical" : "Normal"}
          tone={info.getValue() ? "neutral" : "warning"}
        />
      ),
    }),
    columnHelper.display({
      id: "items",
      header: "Items",
      cell: ({ row }) => <StatusBadge label={`${row.original._count?.t_order_item ?? 0} rows`} tone="neutral" />,
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button size="icon-xs" variant="outline" onClick={() => hooks.openOrderModal(row.original)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon-xs" variant="outline" onClick={() => hooks.deleteOrder(row.original.order_no)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    }),
  ];

  return (
    <PageShell
      eyebrow="Sales"
      title="Sales Orders"
      description="Manage sales order headers with modal CRUD while keeping stock posting and accounting integration on the existing API path."
    >
      <datalist id="sales-order-channel-ids">
        {(channelsQuery.data ?? []).map((channel) => (
          <option key={channel.channel_id} value={channel.channel_id}>
            {channel.channel_name}
          </option>
        ))}
      </datalist>
      <datalist id="sales-order-nos">
        {(ordersQuery.data ?? []).map((order) => (
          <option key={order.order_no} value={order.order_no} />
        ))}
      </datalist>
      <datalist id="sales-order-statuses">
        {SALES_STATUS_OPTIONS.map((status) => (
          <option key={status} value={status} />
        ))}
      </datalist>
      <datalist id="sales-order-boolean-options">
        {SALES_BOOLEAN_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </datalist>

      <div className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => hooks.openOrderModal()}>
            <Plus className="size-4" />
            Add sales order
          </Button>
        </div>
        <DataTable columns={columns} data={ordersQuery.data ?? []} emptyMessage="No sales orders found." />
      </div>

      <ModalFormShell
        open={orderModal.open}
        onOpenChange={orderModal.setOpen}
        title={editingOrder ? "Edit sales order" : "Create sales order"}
        description="Modal CRUD flow for sales order headers."
        submitLabel={editingOrder ? "Save changes" : "Create sales order"}
        isSubmitting={orderForm.formState.isSubmitting}
        onSubmit={() => {
          return orderForm.handleSubmit((values: SalesOrderInput) => hooks.saveOrder(values))();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Order number" htmlFor="order_no" error={orderForm.formState.errors.order_no?.message}>
            <Input id="order_no" {...orderForm.register("order_no")} disabled={Boolean(editingOrder)} />
          </FormField>
          <FormField label="Order date" htmlFor="order_date" error={orderForm.formState.errors.order_date?.message}>
            <Input id="order_date" type="datetime-local" {...orderForm.register("order_date")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Reference no" htmlFor="ref_no">
            <Input id="ref_no" {...orderForm.register("ref_no")} />
          </FormField>
          <FormField label="Parent order no" htmlFor="parent_order_no">
            <Input id="parent_order_no" list="sales-order-nos" {...orderForm.register("parent_order_no")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Channel id" htmlFor="channel_id">
            <Input
              id="channel_id"
              list="sales-order-channel-ids"
              value={orderForm.watch("channel_id") == null ? "" : String(orderForm.watch("channel_id"))}
              onChange={(event) => orderForm.setValue("channel_id", event.target.value ? Number(event.target.value) : null)}
            />
          </FormField>
          <FormField label="Customer id" htmlFor="customer_id">
            <Input
              id="customer_id"
              value={orderForm.watch("customer_id") == null ? "" : String(orderForm.watch("customer_id"))}
              onChange={(event) =>
                orderForm.setValue("customer_id", event.target.value ? Number(event.target.value) : null)
              }
            />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            label="Total amount"
            htmlFor="total_amount"
            error={orderForm.formState.errors.total_amount?.message}
          >
            <Input id="total_amount" {...orderForm.register("total_amount")} />
          </FormField>
          <FormField label="Status" htmlFor="status" error={orderForm.formState.errors.status?.message}>
            <Input id="status" list="sales-order-statuses" {...orderForm.register("status")} />
          </FormField>
          <FormField label="Historical" htmlFor="is_historical">
            <Input
              id="is_historical"
              list="sales-order-boolean-options"
              value={String(orderForm.watch("is_historical") ?? false)}
              onChange={(event) =>
                orderForm.setValue("is_historical", parseSalesBooleanInput(event.target.value))
              }
            />
          </FormField>
        </div>
      </ModalFormShell>
    </PageShell>
  );
}
