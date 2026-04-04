"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { MetricCard } from "@/components/layout/stats-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  WAREHOUSE_QC_STATUS_OPTIONS,
  toDateInput,
  useWarehouseInbound,
  useWarehousePurchaseOrders,
} from "@/features/warehouse/use-warehouse-module";
import type { InboundDeliveryInput } from "@/schemas/warehouse-module";
import type { InboundDeliveryRecord } from "@/types/warehouse";

const columnHelper = createColumnHelper<InboundDeliveryRecord>();

export default function WarehouseInboundPage() {
  const hooks = useWarehouseInbound();
  const { purchaseOrdersQuery } = useWarehousePurchaseOrders();
  const { inboundQuery, inboundForm, inboundModal, editingInbound } = hooks;
  const inboundRows = inboundQuery.data ?? [];
  const totalInbound = inboundRows.length;
  const passedInbound = inboundRows.filter((row) => row.qc_status === "PASSED").length;
  const partialInbound = inboundRows.filter((row) => row.qc_status === "PARTIAL").length;
  const otherInbound = totalInbound - passedInbound - partialInbound;
  const totalInboundItems = inboundRows.reduce((sum, row) => sum + (row._count?.inbound_items ?? 0), 0);
  const latestReceiveDate =
    inboundRows.length === 0
      ? "-"
      : inboundRows
          .map((row) => row.receive_date)
          .reduce((latest, next) => (next > latest ? next : latest))
          .slice(0, 10);

  const columns = [
    columnHelper.accessor("receive_date", {
      header: "Receive Date",
      cell: (info) => <span className="font-medium">{toDateInput(info.getValue())}</span>,
    }),
    columnHelper.accessor("po_id", {
      header: "PO",
      cell: (info) => info.row.original.purchase_orders?.po_number ?? "-",
    }),
    columnHelper.accessor("surat_jalan_vendor", {
      header: "Vendor Note",
      cell: (info) => info.getValue() ?? "-",
    }),
    columnHelper.accessor("received_by", { header: "Received By" }),
    columnHelper.accessor("qc_status", {
      header: "QC",
      cell: (info) => (
        <StatusBadge
          label={info.getValue()}
          tone={
            info.getValue() === "PASSED" ? "success" : info.getValue() === "PARTIAL" ? "warning" : "neutral"
          }
        />
      ),
    }),
    columnHelper.display({
      id: "items",
      header: "Items",
      cell: ({ row }) => <StatusBadge label={`${row.original._count?.inbound_items ?? 0} rows`} tone="info" />,
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button size="icon-xs" variant="outline" onClick={() => hooks.openInboundModal(row.original)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon-xs" variant="outline" onClick={() => hooks.deleteInbound(row.original.id)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    }),
  ];

  return (
    <PageShell
      eyebrow="Warehouse"
      title="Inbound"
      description="Kelola header inbound dan status QC untuk memastikan penerimaan dan posting stok tetap terkontrol."
    >
      <datalist id="warehouse-inbound-po-ids">
        {(purchaseOrdersQuery.data ?? []).map((purchaseOrder) => (
          <option key={purchaseOrder.id} value={purchaseOrder.id}>
            {purchaseOrder.po_number}
          </option>
        ))}
      </datalist>
      <datalist id="warehouse-inbound-qc-statuses">
        {WAREHOUSE_QC_STATUS_OPTIONS.map((status) => (
          <option key={status} value={status} />
        ))}
      </datalist>

      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-5">
          <MetricCard title="Total inbound" value={String(totalInbound)} subtitle="Jumlah inbound yang terlihat." />
          <MetricCard title="QC PASSED" value={String(passedInbound)} subtitle="Inbound lulus QC." />
          <MetricCard title="QC PARTIAL" value={String(partialInbound)} subtitle="Inbound partial QC." />
          <MetricCard title="Other QC" value={String(otherInbound)} subtitle="Status lain (pending/reject/dll)." />
          <MetricCard title="Items / latest" value={`${totalInboundItems} / ${latestReceiveDate}`} subtitle="Total item rows dan tanggal terbaru." />
        </div>

        <div className="flex justify-end">
          <Button size="sm" onClick={() => hooks.openInboundModal()}>
            <Plus className="size-4" />
            Add inbound
          </Button>
        </div>
        <DataTable columns={columns} data={inboundQuery.data ?? []} emptyMessage="No inbound records yet." />
      </div>

      <ModalFormShell
        open={inboundModal.open}
        onOpenChange={inboundModal.setOpen}
        title={editingInbound ? "Edit inbound" : "Create inbound"}
        description="Manage receiving headers with the existing inbound delivery workflow."
        isSubmitting={inboundForm.formState.isSubmitting}
        onSubmit={() => {
          return inboundForm.handleSubmit((values: InboundDeliveryInput) => hooks.saveInbound(values))();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="PO id" htmlFor="po_id">
            <Input id="po_id" list="warehouse-inbound-po-ids" {...inboundForm.register("po_id")} />
          </FormField>
          <FormField
            label="Receive date"
            htmlFor="receive_date"
            error={inboundForm.formState.errors.receive_date?.message}
          >
            <Input id="receive_date" type="date" {...inboundForm.register("receive_date")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Vendor note" htmlFor="surat_jalan_vendor">
            <Input id="surat_jalan_vendor" {...inboundForm.register("surat_jalan_vendor")} />
          </FormField>
          <FormField label="QC status" htmlFor="qc_status" error={inboundForm.formState.errors.qc_status?.message}>
            <Input id="qc_status" list="warehouse-inbound-qc-statuses" {...inboundForm.register("qc_status")} />
          </FormField>
        </div>
        <FormField
          label="Received by"
          htmlFor="received_by"
          error={inboundForm.formState.errors.received_by?.message}
        >
          <Input id="received_by" {...inboundForm.register("received_by")} />
        </FormField>
        <FormField label="Notes" htmlFor="inbound_notes">
          <Textarea id="inbound_notes" {...inboundForm.register("notes")} />
        </FormField>
      </ModalFormShell>
    </PageShell>
  );
}
