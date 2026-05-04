"use client";

import { useCallback, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Lock, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { MetricCard } from "@/components/layout/stats-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import { Textarea } from "@/components/ui/textarea";
import { InventoryPicker } from "@/components/patterns/inventory-picker";
import {
  isAdjustmentPosted,
  WAREHOUSE_ADJUSTMENT_TYPE_OPTIONS,
  toDateInput,
  useWarehouseAdjustments,
  useWarehouseStockMovements,
} from "@/features/warehouse/use-warehouse-module";
import { WAREHOUSE_ADJUSTMENT_REASON_OPTIONS, type AdjustmentInput } from "@/schemas/warehouse-module";
import type { AdjustmentRecord } from "@/types/warehouse";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<AdjustmentRecord>();

export default function WarehouseAdjustmentsPage() {
  const hooks = useWarehouseAdjustments();
  const stockMovementsQuery = useWarehouseStockMovements();
  const { adjustmentsQuery, adjustmentForm, adjustmentModal, editingAdjustment } = hooks;
  const [detailAdjustment, setDetailAdjustment] = useState<AdjustmentRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const adjustmentRows = adjustmentsQuery.data ?? [];
  const relatedMovementRows = useMemo(() => {
    if (!detailAdjustment) return [];
    return (stockMovementsQuery.data?.data ?? [])
      .filter(
        (row) =>
          row.reference_type === "ADJUSTMENT" &&
          row.reference_id === detailAdjustment.id
      )
      .sort((a, b) => {
        if (a.movement_date === b.movement_date) {
          return b.created_at.localeCompare(a.created_at);
        }
        return b.movement_date.localeCompare(a.movement_date);
      });
  }, [detailAdjustment, stockMovementsQuery.data]);

  const openAdjustmentDetail = useCallback((adjustment: AdjustmentRecord) => {
    setDetailAdjustment(adjustment);
    setDetailOpen(true);
  }, []);
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
          <button
            type="button"
            className="text-left font-medium text-blue-600 hover:underline"
            onClick={() => openAdjustmentDetail(info.row.original)}
          >
            {info.getValue()}
          </button>
          <p className="text-xs text-muted-foreground">{info.row.original.master_inventory?.inv_name ?? ""}</p>
        </div>
      ),
    }),
    columnHelper.accessor("adj_type", {
      header: "Type",
      cell: (info) => <StatusBadge label={info.getValue()} tone={info.getValue() === "IN" ? "success" : "warning"} />,
    }),
    columnHelper.accessor("post_status", {
      header: "Posting",
      cell: (info) => {
        const posted = isAdjustmentPosted(info.getValue());
        return <StatusBadge label={posted ? "LOCKED" : "DRAFT"} tone={posted ? "danger" : "info"} />;
      },
    }),
    columnHelper.accessor("qty", { header: "Qty" }),
    columnHelper.accessor("reason", { header: "Reason" }),
    columnHelper.accessor("notes", {
      header: "Catatan",
      cell: (info) => info.getValue() ?? "-",
    }),
    columnHelper.accessor("created_by", {
      header: "Created By",
      cell: (info) => info.getValue() ?? "-",
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const posted = isAdjustmentPosted(row.original.post_status);
        return (
          <div className="flex justify-end gap-2">
            <Button
              size="icon-xs"
              variant="outline"
              disabled={posted}
              onClick={() => hooks.openAdjustmentModal(row.original)}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button size="icon-xs" variant="outline" disabled={posted} onClick={() => hooks.deleteAdjustment(row.original.id)}>
              <Trash2 className="size-3.5" />
            </Button>
            <Button
              size="icon-xs"
              variant="outline"
              disabled={posted}
              onClick={() => hooks.postAdjustment(row.original.id)}
              className={cn(
                posted
                  ? "border-rose-300 bg-rose-50 text-rose-700 opacity-100"
                  : "border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800"
              )}
              title={posted ? "Already posted" : "Post stock movement"}
            >
              {posted ? <Lock className="size-3.5" /> : <Upload className="size-3.5" />}
            </Button>
          </div>
        );
      },
    }),
  ];

  return (
    <PageShell
      eyebrow="Warehouse"
      title="Adjustments"
      description="Kelola penyesuaian stok untuk koreksi operasional, dengan jejak yang tetap konsisten di ledger."
    >
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
          <FormField
            label="Inventory code"
            htmlFor="adjustment_inv_code"
            error={adjustmentForm.formState.errors.inv_code?.message}
          >
            <InventoryPicker
              value={adjustmentForm.watch("inv_code") ?? ""}
              placeholder="Cari inventory..."
              className="w-full"
              inputClassName="h-10"
              onValueChange={(next) =>
                adjustmentForm.setValue("inv_code", next, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
              }
            />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Type" htmlFor="adj_type" error={adjustmentForm.formState.errors.adj_type?.message}>
            <SelectNative id="adj_type" {...adjustmentForm.register("adj_type")}>
              {WAREHOUSE_ADJUSTMENT_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </SelectNative>
          </FormField>
          <FormField label="Quantity" htmlFor="adjustment_qty" error={adjustmentForm.formState.errors.qty?.message}>
            <Input id="adjustment_qty" type="number" {...adjustmentForm.register("qty", { valueAsNumber: true })} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Created by" htmlFor="created_by">
            <Input id="created_by" {...adjustmentForm.register("created_by")} />
          </FormField>
          <FormField label="Reason" htmlFor="adjustment_reason" error={adjustmentForm.formState.errors.reason?.message}>
            <SelectNative id="adjustment_reason" {...adjustmentForm.register("reason")}>
              {WAREHOUSE_ADJUSTMENT_REASON_OPTIONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </SelectNative>
          </FormField>
        </div>
        <FormField label="Catatan" htmlFor="adjustment_notes" error={adjustmentForm.formState.errors.notes?.message}>
          <Textarea id="adjustment_notes" rows={3} {...adjustmentForm.register("notes")} />
        </FormField>
      </ModalFormShell>

      <ModalFormShell
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) {
            setDetailAdjustment(null);
          }
        }}
        title={detailAdjustment ? `Detail adjustment ${detailAdjustment.inv_code}` : "Detail adjustment"}
        description="Riwayat adjustment ini tetap bisa dibaca baik sebelum maupun sesudah diposting."
        submitLabel="Close"
        onSubmit={async () => {
          setDetailOpen(false);
          setDetailAdjustment(null);
        }}
      >
        {detailAdjustment ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3">
                <p className="text-xs text-slate-500">Tanggal</p>
                <p className="text-sm font-medium text-slate-800">{toDateInput(detailAdjustment.adjustment_date)}</p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3">
                <p className="text-xs text-slate-500">Status</p>
                <div className="mt-1">
                  <StatusBadge label={isAdjustmentPosted(detailAdjustment.post_status) ? "LOCKED" : "DRAFT"} tone={isAdjustmentPosted(detailAdjustment.post_status) ? "danger" : "info"} />
                </div>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3">
                <p className="text-xs text-slate-500">SKU / Inventory</p>
                <p className="text-sm font-medium text-slate-800">{detailAdjustment.inv_code}</p>
                <p className="text-xs text-slate-500">{detailAdjustment.master_inventory?.inv_name ?? "-"}</p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3">
                <p className="text-xs text-slate-500">Type & Qty</p>
                <p className="text-sm font-medium text-slate-800">
                  {detailAdjustment.adj_type} {detailAdjustment.qty.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3">
                <p className="text-xs text-slate-500">Reason</p>
                <p className="text-sm font-medium text-slate-800">{detailAdjustment.reason}</p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3">
                <p className="text-xs text-slate-500">Created by</p>
                <p className="text-sm font-medium text-slate-800">{detailAdjustment.created_by ?? "-"}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">Catatan</p>
              <p className="text-sm text-slate-700">{detailAdjustment.notes?.trim() || "-"}</p>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-200/80 bg-white p-3">
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">History Stock Movement</p>
              {relatedMovementRows.length === 0 ? (
                <p className="text-sm text-slate-500">
                  {isAdjustmentPosted(detailAdjustment.post_status)
                    ? "Belum ada movement terkait yang ditemukan."
                    : "Adjustment ini belum diposting, jadi movement belum terbentuk."}
                </p>
              ) : (
                <div className="space-y-2">
                  {relatedMovementRows.map((movement) => (
                    <div key={movement.id} className="rounded-lg border border-slate-200/80 bg-slate-50/80 p-2.5 text-sm text-slate-700">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">{toDateInput(movement.movement_date)}</span>
                        <span className={movement.qty_change >= 0 ? "font-medium text-emerald-700" : "font-medium text-rose-700"}>
                          {movement.qty_change > 0 ? `+${movement.qty_change}` : movement.qty_change}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Running balance: {movement.running_balance.toLocaleString("id-ID")} | Ref: {movement.reference_id}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{movement.notes || "-"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </ModalFormShell>
    </PageShell>
  );
}
