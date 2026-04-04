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
  WAREHOUSE_ADJUSTMENT_TYPE_OPTIONS,
  toDateInput,
  useWarehouseAdjustments,
  useWarehouseInventoryLookup,
} from "@/features/warehouse/use-warehouse-module";
import type { AdjustmentInput } from "@/schemas/warehouse-module";
import type { AdjustmentRecord } from "@/types/warehouse";

const columnHelper = createColumnHelper<AdjustmentRecord>();

export default function WarehouseAdjustmentsPage() {
  const hooks = useWarehouseAdjustments();
  const inventoryQuery = useWarehouseInventoryLookup();
  const { adjustmentsQuery, adjustmentForm, adjustmentModal, editingAdjustment } = hooks;
  const adjustmentRows = adjustmentsQuery.data ?? [];
  const totalAdjustments = adjustmentRows.length;
  const adjustmentsIn = adjustmentRows.filter((row) => row.adj_type === "IN").length;
  const adjustmentsOut = totalAdjustments - adjustmentsIn;
  const netQty = adjustmentRows.reduce(
    (sum, row) => sum + (row.adj_type === "IN" ? Number(row.qty || 0) : -Number(row.qty || 0)),
    0
  );
  const latestAdjustmentDate =
    adjustmentRows.length === 0
      ? "-"
      : adjustmentRows
          .map((row) => row.adjustment_date)
          .reduce((latest, next) => (next > latest ? next : latest))
          .slice(0, 10);

  const columns = [
    columnHelper.accessor("adjustment_date", {
      header: "Date",
      cell: (info) => toDateInput(info.getValue()),
    }),
    columnHelper.accessor("inv_code", {
      header: "Inventory",
      cell: (info) => (
        <div>
          <p className="font-medium">{info.getValue()}</p>
          <p className="text-xs text-muted-foreground">{info.row.original.master_inventory?.inv_name ?? ""}</p>
        </div>
      ),
    }),
    columnHelper.accessor("adj_type", {
      header: "Type",
      cell: (info) => <StatusBadge label={info.getValue()} tone={info.getValue() === "IN" ? "success" : "warning"} />,
    }),
    columnHelper.accessor("qty", { header: "Qty" }),
    columnHelper.accessor("reason", { header: "Reason" }),
    columnHelper.accessor("approved_by", {
      header: "Approved By",
      cell: (info) => info.getValue() ?? "-",
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button size="icon-xs" variant="outline" onClick={() => hooks.openAdjustmentModal(row.original)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon-xs" variant="outline" onClick={() => hooks.deleteAdjustment(row.original.id)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    }),
  ];

  return (
    <PageShell
      eyebrow="Warehouse"
      title="Adjustments"
      description="Kelola penyesuaian stok untuk koreksi operasional, dengan jejak yang tetap konsisten di ledger."
    >
      <datalist id="warehouse-adjustment-inventory-codes">
        {(inventoryQuery.data ?? []).map((inventory) => (
          <option key={inventory.inv_code} value={inventory.inv_code}>
            {inventory.inv_name}
          </option>
        ))}
      </datalist>
      <datalist id="warehouse-adjustment-types">
        {WAREHOUSE_ADJUSTMENT_TYPE_OPTIONS.map((type) => (
          <option key={type} value={type} />
        ))}
      </datalist>

      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Total adjustments" value={String(totalAdjustments)} subtitle="Jumlah adjustment yang terlihat." />
          <MetricCard title="IN / OUT" value={`${adjustmentsIn} / ${adjustmentsOut}`} subtitle="Ringkas arah perubahan stok." />
          <MetricCard title="Net qty" value={netQty.toLocaleString("id-ID")} subtitle="IN dikurangi OUT (visible)." />
          <MetricCard title="Latest date" value={latestAdjustmentDate} subtitle="Tanggal adjustment terbaru." />
        </div>

        <div className="flex justify-end">
          <Button size="sm" onClick={() => hooks.openAdjustmentModal()}>
            <Plus className="size-4" />
            Add adjustment
          </Button>
        </div>
        <DataTable columns={columns} data={adjustmentsQuery.data ?? []} emptyMessage="No adjustments yet." />
      </div>

      <ModalFormShell
        open={adjustmentModal.open}
        onOpenChange={adjustmentModal.setOpen}
        title={editingAdjustment ? "Edit adjustment" : "Create adjustment"}
        description="Manage manual stock corrections using the existing warehouse adjustment flow."
        isSubmitting={adjustmentForm.formState.isSubmitting}
        onSubmit={() => {
          return adjustmentForm.handleSubmit((values: AdjustmentInput) => hooks.saveAdjustment(values))();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Adjustment date"
            htmlFor="adjustment_date"
            error={adjustmentForm.formState.errors.adjustment_date?.message}
          >
            <Input id="adjustment_date" type="date" {...adjustmentForm.register("adjustment_date")} />
          </FormField>
          <FormField label="Inventory code" htmlFor="adjustment_inv_code" error={adjustmentForm.formState.errors.inv_code?.message}>
            <Input
              id="adjustment_inv_code"
              list="warehouse-adjustment-inventory-codes"
              {...adjustmentForm.register("inv_code")}
            />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Type" htmlFor="adj_type" error={adjustmentForm.formState.errors.adj_type?.message}>
            <Input id="adj_type" list="warehouse-adjustment-types" {...adjustmentForm.register("adj_type")} />
          </FormField>
          <FormField label="Quantity" htmlFor="adjustment_qty" error={adjustmentForm.formState.errors.qty?.message}>
            <Input id="adjustment_qty" type="number" {...adjustmentForm.register("qty", { valueAsNumber: true })} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Approved by" htmlFor="approved_by">
            <Input id="approved_by" {...adjustmentForm.register("approved_by")} />
          </FormField>
          <FormField label="Reason" htmlFor="adjustment_reason" error={adjustmentForm.formState.errors.reason?.message}>
            <Textarea id="adjustment_reason" {...adjustmentForm.register("reason")} />
          </FormField>
        </div>
      </ModalFormShell>
    </PageShell>
  );
}
