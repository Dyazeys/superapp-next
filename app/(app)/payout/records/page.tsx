"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { MetricCard } from "@/components/layout/stats-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney, formatShortDate } from "@/lib/format";
import {
  payoutStatusTone,
  sumPayoutDeductions,
  sumPayoutFees,
  usePayoutAdjustments,
  usePayoutOrders,
  usePayoutSelection,
  usePayouts,
} from "@/features/payout/use-payout-module";
import type { PayoutInput } from "@/schemas/payout-module";
import type { PayoutAdjustmentRecord, PayoutRecord } from "@/types/payout";

const payoutColumnHelper = createColumnHelper<PayoutRecord>();
const adjustmentColumnHelper = createColumnHelper<PayoutAdjustmentRecord>();

export default function PayoutRecordsPage() {
  const hooks = usePayouts();
  const orderLookupQuery = usePayoutOrders();
  const { selectedPayoutId, currentPayoutId, setSelectedPayoutId } = usePayoutSelection(hooks.payoutsQuery.data);
  const payoutRows = hooks.payoutsQuery.data ?? [];
  const totalPayouts = payoutRows.length;
  const settledCount = payoutRows.filter((row) => String(row.payout_status ?? "").toUpperCase() === "SETTLED").length;
  const totalGross = payoutRows.reduce((sum, row) => sum + Number(row.total_price), 0);
  const totalNet = payoutRows.reduce((sum, row) => sum + Number(row.omset), 0);

  const selectedPayout =
    (hooks.payoutsQuery.data ?? []).find((payout) => payout.payout_id === currentPayoutId) ?? null;

  const detailAdjustments = usePayoutAdjustments(selectedPayout?.ref ?? undefined);

  const relatedAdjustmentTotal = (detailAdjustments.adjustmentsQuery.data ?? []).reduce(
    (sum, adjustment) => sum + Number(adjustment.amount),
    0
  );

  const payoutColumns = [
    payoutColumnHelper.accessor("ref", {
      header: "Reference",
      cell: ({ row, getValue }) => (
        <div>
          <p className="font-medium">{getValue() ?? "-"}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.t_order?.order_no ?? "No linked order"} / {row.original.t_order?.m_channel?.channel_name ?? "No channel"}
          </p>
        </div>
      ),
    }),
    payoutColumnHelper.accessor("payout_date", {
      header: "Payout Date",
      cell: (info) => formatShortDate(info.getValue()),
    }),
    payoutColumnHelper.accessor("total_price", {
      header: "Gross",
      cell: (info) => formatMoney(Number(info.getValue())),
    }),
    payoutColumnHelper.display({
      id: "deductions",
      header: "Deductions / Fees",
      cell: ({ row }) => formatMoney(sumPayoutDeductions(row.original)),
    }),
    payoutColumnHelper.accessor("omset", {
      header: "Net Payout",
      cell: (info) => formatMoney(Number(info.getValue())),
    }),
    payoutColumnHelper.accessor("payout_status", {
      header: "Status",
      cell: (info) => <StatusBadge label={info.getValue() ?? "Unknown"} tone={payoutStatusTone(info.getValue())} />,
    }),
    payoutColumnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button size="icon-xs" variant="outline" onClick={() => hooks.openPayoutModal(row.original)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon-xs" variant="outline" onClick={() => hooks.deletePayout(row.original.payout_id)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    }),
  ];

  const relatedAdjustmentColumns = [
    adjustmentColumnHelper.accessor("adjustment_date", {
      header: "Adjustment Date",
      cell: (info) => (info.getValue() ? formatShortDate(info.getValue() as string) : "-"),
    }),
    adjustmentColumnHelper.accessor("adjustment_type", {
      header: "Type",
      cell: (info) => info.getValue() ?? "-",
    }),
    adjustmentColumnHelper.accessor("reason", {
      header: "Reason",
      cell: (info) => info.getValue() ?? "-",
    }),
    adjustmentColumnHelper.accessor("amount", {
      header: "Amount",
      cell: (info) => formatMoney(Number(info.getValue())),
    }),
  ];

  return (
    <PageShell
      eyebrow="Payout"
      title="Payout Records"
      description="Kelola payout records untuk memantau gross, net, status, dan relasi order (tanpa otomatisasi baru)."
    >
      <datalist id="payout-record-refs">
        {(orderLookupQuery.data ?? []).map((order) =>
          order.ref_no ? (
            <option key={order.order_no} value={order.ref_no}>
              {order.order_no} / {order.m_channel?.channel_name ?? "No channel"}
            </option>
          ) : null
        )}
      </datalist>

      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Total payouts" value={String(totalPayouts)} subtitle="Jumlah payout records yang terlihat." />
          <MetricCard title="Settled" value={String(settledCount)} subtitle="Payout berstatus SETTLED." />
          <MetricCard title="Total gross" value={formatMoney(totalGross)} subtitle="Akumulasi gross dari data yang terlihat." />
          <MetricCard title="Total net" value={formatMoney(totalNet)} subtitle="Akumulasi net payout dari data yang terlihat." />
        </div>

        <div className="flex flex-col gap-3 rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <label htmlFor="payout-record-selection" className="text-xs font-medium tracking-[0.02em] text-foreground/80">
              Selected payout
            </label>
            <select
              id="payout-record-selection"
              className="min-w-[360px] rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm shadow-slate-900/5"
              value={selectedPayoutId ?? currentPayoutId ?? ""}
              onChange={(event) => setSelectedPayoutId(event.target.value ? Number(event.target.value) : null)}
            >
              {(hooks.payoutsQuery.data ?? []).map((payout) => (
                <option key={payout.payout_id} value={payout.payout_id}>
                  {formatShortDate(payout.payout_date)} / {payout.ref ?? "No ref"} / {payout.payout_status ?? "Unknown"}
                </option>
              ))}
            </select>
            <p className="text-xs leading-5 text-muted-foreground">
              {selectedPayout
                ? `${selectedPayout.t_order?.order_no ?? "No order"} / gross ${formatMoney(Number(selectedPayout.total_price))} / net ${formatMoney(Number(selectedPayout.omset))}`
                : "Choose a payout record to inspect linked order and adjustment detail."}
            </p>
          </div>
          <Button size="sm" onClick={() => hooks.openPayoutModal()}>
            <Plus className="size-4" />
            Add payout
          </Button>
        </div>

        {selectedPayout ? (
          <div className="grid gap-4 xl:grid-cols-4">
            <div className="rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Order relation</p>
              <p className="mt-3 text-lg font-semibold">{selectedPayout.ref ?? "-"}</p>
              <p className="text-sm text-muted-foreground">
                {selectedPayout.t_order?.order_no ?? "No linked order"} / {selectedPayout.t_order?.m_channel?.channel_name ?? "No channel"}
              </p>
            </div>
            <div className="rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Gross / net</p>
              <p className="mt-3 text-lg font-semibold">{formatMoney(Number(selectedPayout.total_price))}</p>
              <p className="text-sm text-muted-foreground">Net payout {formatMoney(Number(selectedPayout.omset))}</p>
            </div>
            <div className="rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Deductions / fees</p>
              <p className="mt-3 text-lg font-semibold">{formatMoney(sumPayoutDeductions(selectedPayout))}</p>
              <p className="text-sm text-muted-foreground">
                Fees {formatMoney(sumPayoutFees(selectedPayout))} / shipping {formatMoney(Number(selectedPayout.shipping_cost))}
              </p>
            </div>
            <div className="rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Status / date</p>
              <div className="mt-3 flex items-center gap-2">
                <StatusBadge
                  label={selectedPayout.payout_status ?? "Unknown"}
                  tone={payoutStatusTone(selectedPayout.payout_status)}
                />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{formatShortDate(selectedPayout.payout_date)}</p>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No payout selected"
            description="Choose or create a payout record to inspect linked payout information."
          />
        )}

        <DataTable columns={payoutColumns} data={hooks.payoutsQuery.data ?? []} emptyMessage="No payout records found." />

        {selectedPayout?.ref ? (
          <div className="space-y-4 rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Related adjustments</h2>
              <p className="text-sm text-muted-foreground">
                {selectedPayout.ref} / {detailAdjustments.adjustmentsQuery.data?.length ?? 0} rows / total {formatMoney(relatedAdjustmentTotal)}
              </p>
            </div>
            <DataTable
              columns={relatedAdjustmentColumns}
              data={detailAdjustments.adjustmentsQuery.data ?? []}
              emptyMessage="No payout adjustments found for this reference."
            />
          </div>
        ) : null}
      </div>

      <ModalFormShell
        open={hooks.payoutModal.open}
        onOpenChange={hooks.payoutModal.setOpen}
        title={hooks.editingPayout ? "Edit payout" : "Create payout"}
        description="Maintain payout table rows without changing any sales, warehouse, or accounting logic."
        isSubmitting={hooks.payoutForm.formState.isSubmitting}
        onSubmit={() => {
          return hooks.payoutForm.handleSubmit((values: PayoutInput) => hooks.savePayout(values))();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Reference" htmlFor="payout_ref" helperText="Uses existing sales order ref numbers when available.">
            <Input id="payout_ref" list="payout-record-refs" {...hooks.payoutForm.register("ref")} />
          </FormField>
          <FormField
            label="Payout date"
            htmlFor="payout_date"
            error={hooks.payoutForm.formState.errors.payout_date?.message}
          >
            <Input id="payout_date" type="date" {...hooks.payoutForm.register("payout_date")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            label="Qty produk"
            htmlFor="qty_produk"
            error={hooks.payoutForm.formState.errors.qty_produk?.message}
          >
            <Input id="qty_produk" type="number" {...hooks.payoutForm.register("qty_produk", { valueAsNumber: true })} />
          </FormField>
          <FormField label="HPP" htmlFor="hpp" error={hooks.payoutForm.formState.errors.hpp?.message}>
            <Input id="hpp" {...hooks.payoutForm.register("hpp")} />
          </FormField>
          <FormField label="Gross amount" htmlFor="total_price" error={hooks.payoutForm.formState.errors.total_price?.message}>
            <Input id="total_price" {...hooks.payoutForm.register("total_price")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            label="Seller discount"
            htmlFor="seller_discount"
            error={hooks.payoutForm.formState.errors.seller_discount?.message}
          >
            <Input id="seller_discount" {...hooks.payoutForm.register("seller_discount")} />
          </FormField>
          <FormField
            label="Shipping cost"
            htmlFor="shipping_cost"
            error={hooks.payoutForm.formState.errors.shipping_cost?.message}
          >
            <Input id="shipping_cost" {...hooks.payoutForm.register("shipping_cost")} />
          </FormField>
          <FormField label="Net payout" htmlFor="omset" error={hooks.payoutForm.formState.errors.omset?.message}>
            <Input id="omset" {...hooks.payoutForm.register("omset")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Fee admin" htmlFor="fee_admin" error={hooks.payoutForm.formState.errors.fee_admin?.message}>
            <Input id="fee_admin" {...hooks.payoutForm.register("fee_admin")} />
          </FormField>
          <FormField label="Fee service" htmlFor="fee_service" error={hooks.payoutForm.formState.errors.fee_service?.message}>
            <Input id="fee_service" {...hooks.payoutForm.register("fee_service")} />
          </FormField>
          <FormField
            label="Fee order process"
            htmlFor="fee_order_process"
            error={hooks.payoutForm.formState.errors.fee_order_process?.message}
          >
            <Input id="fee_order_process" {...hooks.payoutForm.register("fee_order_process")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Fee program" htmlFor="fee_program" error={hooks.payoutForm.formState.errors.fee_program?.message}>
            <Input id="fee_program" {...hooks.payoutForm.register("fee_program")} />
          </FormField>
          <FormField
            label="Fee transaction"
            htmlFor="fee_transaction"
            error={hooks.payoutForm.formState.errors.fee_transaction?.message}
          >
            <Input id="fee_transaction" {...hooks.payoutForm.register("fee_transaction")} />
          </FormField>
          <FormField
            label="Fee affiliate"
            htmlFor="fee_affiliate"
            error={hooks.payoutForm.formState.errors.fee_affiliate?.message}
          >
            <Input id="fee_affiliate" {...hooks.payoutForm.register("fee_affiliate")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Status" htmlFor="payout_status" error={hooks.payoutForm.formState.errors.payout_status?.message}>
            <Input id="payout_status" {...hooks.payoutForm.register("payout_status")} />
          </FormField>
        </div>
      </ModalFormShell>
    </PageShell>
  );
}
