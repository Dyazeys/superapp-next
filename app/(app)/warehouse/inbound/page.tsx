"use client";

import { useEffect, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { Check, Lock, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { MetricCard } from "@/components/layout/stats-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SelectNative } from "@/components/ui/select-native";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { warehouseApi } from "@/features/warehouse/api";
import {
  createEmptyInboundItemDraft,
  isInboundPosted,
  toDateInput,
  useWarehouseInbound,
  useWarehouseInboundItems,
  useWarehouseInboundSelection,
  useWarehouseInventoryLookup,
  useWarehousePurchaseOrders,
} from "@/features/warehouse/use-warehouse-module";
import type { InboundDeliveryInput } from "@/schemas/warehouse-module";
import type { InboundDeliveryRecord, InboundItemRecord, PurchaseOrderItemRecord } from "@/types/warehouse";

const inboundColumnHelper = createColumnHelper<InboundDeliveryRecord>();
const itemColumnHelper = createColumnHelper<InboundItemRecord>();

function toIntegerInput(value: string) {
  return Number(value.replace(/[^\d]/g, "") || 0);
}

export default function WarehouseInboundPage() {
  const hooks = useWarehouseInbound();
  const [postingInboundId, setPostingInboundId] = useState<string | null>(null);
  const [selectedInboundIds, setSelectedInboundIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const { purchaseOrdersQuery } = useWarehousePurchaseOrders();
  const inventoryQuery = useWarehouseInventoryLookup();
  const { inboundQuery, inboundForm, inboundModal, editingInbound } = hooks;

  const { selectedInboundId, setSelectedInboundId } = useWarehouseInboundSelection(inboundQuery.data);
  const activeInboundId = editingInbound?.id ?? selectedInboundId;

  const {
    inboundItemsQuery,
    editingInboundItemId,
    inboundItemDraft,
    setInboundItemDraft,
    saveInboundItem,
    deleteInboundItem,
    startNewInboundItem,
    startEditingInboundItem,
    cancelEditingInboundItem,
    actionPending,
  } = useWarehouseInboundItems(activeInboundId ?? undefined);

  const inboundRows = useMemo(() => inboundQuery.data ?? [], [inboundQuery.data]);
  const activeInbound = inboundRows.find((row) => row.id === activeInboundId) ?? editingInbound ?? null;
  const activeInboundPosted = isInboundPosted(activeInbound?.qc_status);

  const totalInbound = inboundRows.length;
  const passedInbound = inboundRows.filter((row) => row.qc_status === "PASSED").length;
  const failedInbound = inboundRows.filter((row) => row.qc_status === "FAILED").length;
  const otherInbound = totalInbound - passedInbound - failedInbound;
  const totalInboundItems = inboundRows.reduce((sum, row) => sum + (row._count?.inbound_items ?? 0), 0);
  const latestReceiveDate =
    inboundRows.length === 0
      ? "-"
      : inboundRows
          .map((row) => row.receive_date)
          .reduce((latest, next) => (next > latest ? next : latest))
          .slice(0, 10);

  const inventoryOptions = (inventoryQuery.data ?? []).map((inventory) => ({
    value: inventory.inv_code,
    label: `${inventory.inv_code} - ${inventory.inv_name}`,
  }));

  const inboundItems = useMemo(() => inboundItemsQuery.data ?? [], [inboundItemsQuery.data]);
  const poItemSummaryQuery = useQuery({
    queryKey: ["warehouse-po-items-summary", activeInbound?.po_id],
    queryFn: () => warehouseApi.purchaseOrders.items.list(activeInbound!.po_id!),
    enabled: Boolean(activeInbound?.po_id),
  });
  const poSummaryByInvCode = useMemo(() => {
    const map = new Map<string, PurchaseOrderItemRecord>();
    for (const item of poItemSummaryQuery.data ?? []) {
      if (!map.has(item.inv_code)) {
        map.set(item.inv_code, item);
      }
    }
    return map;
  }, [poItemSummaryQuery.data]);
  const poReceivedPreviewByInvCode = useMemo(() => {
    const map = new Map<string, number>();

    for (const item of inboundItems) {
      map.set(item.inv_code, (map.get(item.inv_code) ?? 0) + Number(item.qty_received ?? 0));
    }

    if (!inboundItemDraft) {
      return map;
    }

    if (editingInboundItemId) {
      const original = inboundItems.find((item) => item.id === editingInboundItemId);
      if (original) {
        map.set(original.inv_code, (map.get(original.inv_code) ?? 0) - Number(original.qty_received ?? 0));
      }
    }

    if (inboundItemDraft.inv_code) {
      map.set(
        inboundItemDraft.inv_code,
        (map.get(inboundItemDraft.inv_code) ?? 0) + Number(inboundItemDraft.qty_received ?? 0)
      );
    }

    return map;
  }, [editingInboundItemId, inboundItemDraft, inboundItems]);
  const poTotalsPreview = useMemo(() => {
    let ordered = 0;
    let received = 0;

    for (const [invCode, summary] of poSummaryByInvCode.entries()) {
      ordered += Number(summary.po_qty_ordered_total ?? 0);
      received += Number(poReceivedPreviewByInvCode.get(invCode) ?? summary.po_qty_received_total ?? 0);
    }

    return {
      ordered,
      received,
      delta: received - ordered,
    };
  }, [poReceivedPreviewByInvCode, poSummaryByInvCode]);
  const totalItemQtyReceived = inboundItems.reduce((sum, item) => sum + Number(item.qty_received || 0), 0);
  const totalItemQtyPassed = inboundItems.reduce((sum, item) => sum + Number(item.qty_passed_qc || 0), 0);
  const totalItemQtyRejected = inboundItems.reduce((sum, item) => sum + Number(item.qty_rejected_qc || 0), 0);
  const selectedInboundCount = selectedInboundIds.length;

  useEffect(() => {
    const existingIds = new Set(inboundRows.map((row) => row.id));
    setSelectedInboundIds((prev) => prev.filter((id) => existingIds.has(id)));
  }, [inboundRows]);

  const toggleInboundSelection = (id: string) => {
    setSelectedInboundIds((prev) => (prev.includes(id) ? prev.filter((current) => current !== id) : [...prev, id]));
  };

  const handleDeleteSelectedInbound = async () => {
    if (selectedInboundIds.length === 0 || bulkDeleting) {
      return;
    }

    const shouldDelete = window.confirm(
      `Hapus ${selectedInboundIds.length} inbound terpilih? Inbound yang sudah locked tetap tidak bisa dihapus.`
    );
    if (!shouldDelete) {
      return;
    }

    try {
      setBulkDeleting(true);
      for (const inboundId of selectedInboundIds) {
        await hooks.deleteInbound(inboundId);
      }
      setSelectedInboundIds([]);
    } finally {
      setBulkDeleting(false);
    }
  };

  const inboundItemRows = useMemo(() => {
    const rows = inboundItemsQuery.data ?? [];
    if (!inboundItemDraft || editingInboundItemId) {
      return rows;
    }

    return [
      ...rows,
      {
        id: "-1",
        inbound_id: inboundItemDraft.inbound_id,
        inv_code: inboundItemDraft.inv_code,
        qty_received: inboundItemDraft.qty_received,
        qty_passed_qc: inboundItemDraft.qty_passed_qc,
        qty_rejected_qc: inboundItemDraft.qty_rejected_qc,
        unit_cost: inboundItemDraft.unit_cost,
        created_at: new Date().toISOString(),
        master_inventory: inboundItemDraft.inv_code
          ? inventoryQuery.data?.find((inventory) => inventory.inv_code === inboundItemDraft.inv_code)
          : null,
      },
    ];
  }, [editingInboundItemId, inboundItemDraft, inboundItemsQuery.data, inventoryQuery.data]);

  const isEditingItemRow = (id: string) =>
    editingInboundItemId === id || (id === "-1" && !editingInboundItemId && Boolean(inboundItemDraft));

  const getPoSummary = (invCode: string | null | undefined) => {
    if (!invCode) return null;
    const summary = poSummaryByInvCode.get(invCode) ?? null;
    if (!summary) return null;

    const ordered = Number(summary.po_qty_ordered_total ?? 0);
    const received = Number(poReceivedPreviewByInvCode.get(invCode) ?? summary.po_qty_received_total ?? 0);
    const delta = received - ordered;
    const status: "OPEN" | "PARTIAL" | "CLOSED" =
      ordered <= 0 ? "OPEN" : received <= 0 ? "OPEN" : delta < 0 ? "PARTIAL" : "CLOSED";

    return {
      ordered,
      received,
      delta,
      status,
    };
  };

  const inboundColumns = [
    inboundColumnHelper.accessor("po_id", {
      header: "PO",
      cell: ({ row }) => {
        const rowPosted = isInboundPosted(row.original.qc_status);

        return (
          <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={`Select inbound ${row.original.purchase_orders?.po_number ?? row.original.id.slice(0, 8)}`}
            disabled={rowPosted}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors",
              rowPosted
                ? "cursor-not-allowed border-slate-200 bg-slate-100"
                : selectedInboundIds.includes(row.original.id)
                ? "border-indigo-500 bg-indigo-500 text-white"
                : "border-slate-300 bg-white text-transparent hover:border-slate-400"
            )}
            onClick={() => toggleInboundSelection(row.original.id)}
          >
            <Check className="size-4" />
          </button>
          <button
            type="button"
            className="text-left font-medium text-blue-600 hover:underline"
            onClick={() => {
              setSelectedInboundId(row.original.id);
              hooks.openInboundModal(row.original);
            }}
          >
            {row.original.purchase_orders?.po_number ?? `INB-${row.original.id.slice(0, 8)}`}
          </button>
          </div>
        );
      },
    }),
    inboundColumnHelper.accessor("receive_date", {
      header: "Receive Date",
      cell: (info) => <span className="font-medium">{toDateInput(info.getValue())}</span>,
    }),
    inboundColumnHelper.accessor("surat_jalan_vendor", {
      header: "Vendor Note",
      cell: (info) => info.getValue() ?? "-",
    }),
    inboundColumnHelper.accessor("received_by", { header: "Received By" }),
    inboundColumnHelper.accessor("qc_status", {
      header: "QC",
      cell: (info) => (
        <StatusBadge
          label={info.getValue()}
          tone={
            info.getValue() === "PASSED"
              ? "success"
              : info.getValue() === "FAILED"
                ? "danger"
                : "warning"
          }
        />
      ),
    }),
    inboundColumnHelper.display({
      id: "items",
      header: "Items",
      cell: ({ row }) => <StatusBadge label={`${row.original._count?.inbound_items ?? 0} rows`} tone="info" />,
    }),
    inboundColumnHelper.display({
      id: "actions",
      header: () => (
        <div className="flex items-center justify-end gap-2">
          {selectedInboundCount > 0 ? (
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              {selectedInboundCount} selected
            </span>
          ) : null}
          <Button
            size="icon-xs"
            variant="outline"
            className="h-8 w-8 border-rose-300 text-rose-600 hover:bg-rose-50"
            disabled={selectedInboundCount === 0 || bulkDeleting}
            onClick={handleDeleteSelectedInbound}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const posted = isInboundPosted(row.original.qc_status);
        const hasPendingDraftForRow =
          Boolean(inboundItemDraft) && inboundItemDraft?.inbound_id === row.original.id;

        if (posted) {
          return (
            <div className="flex justify-end">
              <span className="inline-flex h-8 w-[136px] items-center justify-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100 px-3 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">
                <Lock className="size-3.5" />
                Locked
              </span>
            </div>
          );
        }

        return (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-[136px] justify-center px-3"
              disabled={postingInboundId === row.original.id || actionPending}
              onClick={async () => {
                try {
                  setPostingInboundId(row.original.id);
                  if (hasPendingDraftForRow && inboundItemDraft) {
                    await saveInboundItem(inboundItemDraft);
                  }
                  await hooks.postInbound(row.original.id);
                } finally {
                  setPostingInboundId(null);
                }
              }}
            >
              <Check className="size-3.5" />
              Post Stock
            </Button>
          </div>
        );
      },
    }),
  ];

  const inboundItemColumns = [
    itemColumnHelper.accessor("inv_code", {
      header: "Inventory",
      cell: ({ row, getValue }) =>
        isEditingItemRow(row.original.id) ? (
          <SearchableSelect
            value={inboundItemDraft?.inv_code ?? getValue()}
            options={inventoryOptions}
            placeholder="Search inventory..."
            inputClassName="h-8 min-w-[260px]"
            disabled={actionPending || activeInboundPosted}
            onValueChange={(next) => setInboundItemDraft((prev) => (prev ? { ...prev, inv_code: next } : prev))}
          />
        ) : (
          <div>
            <p className="font-medium">{getValue()}</p>
            <p className="text-xs text-muted-foreground">{row.original.master_inventory?.inv_name ?? ""}</p>
          </div>
        ),
    }),
    itemColumnHelper.display({
      id: "po_qty",
      header: "PO Qty",
      cell: ({ row }) => {
        const summary = getPoSummary(
          isEditingItemRow(row.original.id) ? inboundItemDraft?.inv_code ?? row.original.inv_code : row.original.inv_code
        );

        if (!activeInbound?.po_id) {
          return <span className="text-xs text-muted-foreground">No PO</span>;
        }

        if (!summary) {
          return <span className="text-xs text-amber-600">Not listed in PO</span>;
        }

        const ordered = summary.ordered;
        const received = summary.received;
        const delta = summary.delta;
        const tone = summary.status === "CLOSED" ? "success" : summary.status === "PARTIAL" ? "warning" : "info";

        return (
          <div className="space-y-1">
            <p className="text-xs text-slate-600">
              {received.toLocaleString("id-ID")} / {ordered.toLocaleString("id-ID")} received
            </p>
            <div className="flex items-center gap-2">
              <StatusBadge label={summary.status} tone={tone} />
              {delta > 0 ? (
                <span className="text-xs font-medium text-rose-600">lebih {delta.toLocaleString("id-ID")}</span>
              ) : delta < 0 ? (
                <span className="text-xs text-slate-500">sisa {Math.abs(delta).toLocaleString("id-ID")}</span>
              ) : (
                <span className="text-xs font-medium text-emerald-600">pas</span>
              )}
            </div>
          </div>
        );
      },
    }),
    itemColumnHelper.accessor("qty_received", {
      header: "Qty Received",
      cell: ({ row, getValue }) =>
        isEditingItemRow(row.original.id) ? (
          <Input
            value={String(inboundItemDraft?.qty_received ?? getValue())}
            onChange={(event) => {
              const nextQtyReceived = toIntegerInput(event.target.value);
              setInboundItemDraft((prev) => {
                if (!prev) return prev;
                const nextRejected = Math.min(prev.qty_rejected_qc, nextQtyReceived);
                const nextPassed = Math.max(0, nextQtyReceived - nextRejected);
                return {
                  ...prev,
                  qty_received: nextQtyReceived,
                  qty_rejected_qc: nextRejected,
                  qty_passed_qc: nextPassed,
                };
              });
            }}
            className="h-8 w-28"
          />
        ) : (
          getValue()
        ),
    }),
    itemColumnHelper.accessor("qty_passed_qc", {
      header: "Qty Passed",
      cell: ({ row, getValue }) =>
        isEditingItemRow(row.original.id) ? (
          <Input
            value={String(inboundItemDraft?.qty_passed_qc ?? getValue())}
            onChange={(event) => {
              const nextPassed = toIntegerInput(event.target.value);
              setInboundItemDraft((prev) => {
                if (!prev) return prev;
                const safePassed = Math.min(nextPassed, prev.qty_received);
                return {
                  ...prev,
                  qty_passed_qc: safePassed,
                  qty_rejected_qc: Math.max(0, prev.qty_received - safePassed),
                };
              });
            }}
            className="h-8 w-28"
          />
        ) : (
          getValue()
        ),
    }),
    itemColumnHelper.accessor("qty_rejected_qc", {
      header: "Qty Rejected",
      cell: ({ row, getValue }) =>
        isEditingItemRow(row.original.id) ? (
          <Input
            value={String(inboundItemDraft?.qty_rejected_qc ?? getValue())}
            onChange={(event) => {
              const nextRejected = toIntegerInput(event.target.value);
              setInboundItemDraft((prev) => {
                if (!prev) return prev;
                const safeRejected = Math.min(nextRejected, prev.qty_received);
                return {
                  ...prev,
                  qty_rejected_qc: safeRejected,
                  qty_passed_qc: Math.max(0, prev.qty_received - safeRejected),
                };
              });
            }}
            className="h-8 w-28"
          />
        ) : (
          getValue()
        ),
    }),
    itemColumnHelper.accessor("unit_cost", {
      header: "Unit Cost",
      cell: ({ row, getValue }) =>
        isEditingItemRow(row.original.id) ? (
          <Input
            value={inboundItemDraft?.unit_cost ?? getValue() ?? ""}
            onChange={(event) =>
              setInboundItemDraft((prev) => (prev ? { ...prev, unit_cost: event.target.value || null } : prev))
            }
            className="h-8 w-28"
          />
        ) : (
          getValue() ?? "-"
        ),
    }),
    itemColumnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) =>
        isEditingItemRow(row.original.id) ? (
          <div className="flex justify-end gap-2">
            <Button
              size="icon-xs"
              variant="outline"
              disabled={actionPending || activeInboundPosted}
              onClick={() => inboundItemDraft && saveInboundItem(inboundItemDraft)}
            >
              <Save className="size-3.5" />
            </Button>
            <Button size="icon-xs" variant="outline" disabled={actionPending} onClick={cancelEditingInboundItem}>
              <X className="size-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button
              size="icon-xs"
              variant="outline"
              disabled={actionPending || activeInboundPosted}
              onClick={() => startEditingInboundItem(row.original)}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              size="icon-xs"
              variant="outline"
              disabled={actionPending || activeInboundPosted}
              onClick={() => deleteInboundItem(row.original.id)}
            >
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
      description="Klik nomor PO untuk membuka form gabungan inbound header dan inbound items."
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-5">
          <MetricCard title="Total inbound" value={String(totalInbound)} subtitle="Jumlah inbound yang terlihat." />
          <MetricCard title="QC PASSED" value={String(passedInbound)} subtitle="Inbound lulus QC." />
          <MetricCard title="QC FAILED" value={String(failedInbound)} subtitle="Inbound gagal QC." />
          <MetricCard title="Other QC" value={String(otherInbound)} subtitle="Status lain (pending/reject/dll)." />
          <MetricCard title="Items / latest" value={`${totalInboundItems} / ${latestReceiveDate}`} subtitle="Total item rows dan tanggal terbaru." />
        </div>

        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => {
              setSelectedInboundId(null);
              hooks.openInboundModal();
            }}
          >
            <Plus className="size-4" />
            Add inbound
          </Button>
        </div>

        <DataTable
          columns={inboundColumns}
          data={inboundRows}
          emptyMessage="No inbound records yet."
          stickyHeader
          maxBodyHeight={460}
          pagination={{ enabled: true, pageSize: 8, pageSizeOptions: [8, 12, 20, 50] }}
        />
      </div>

      <ModalFormShell
        open={inboundModal.open}
        onOpenChange={inboundModal.setOpen}
        title={editingInbound ? `Edit inbound ${editingInbound.purchase_orders?.po_number ?? editingInbound.id.slice(0, 8)}` : "Create inbound"}
        description="Form gabungan: inbound header dan inbound items."
        submitLabel={editingInbound ? "Save inbound" : "Create inbound"}
        isSubmitting={inboundForm.formState.isSubmitting}
        dialogClassName="gap-0 sm:max-w-[1180px]"
        bodyClassName="space-y-5 bg-white py-5 pr-1 text-slate-900 max-h-[75vh] overflow-y-auto"
        onSubmit={async () => {
          await inboundForm.handleSubmit(async (values: InboundDeliveryInput) => {
            const saved = await hooks.saveInbound(values, { closeOnSuccess: false });
            if (saved) {
              setSelectedInboundId(saved.id);
            }
          })();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="PO id"
            htmlFor="po_id"
            helperText={
              (purchaseOrdersQuery.data?.length ?? 0) === 0
                ? "Belum ada purchase order. Buat PO dulu di menu Warehouse > Purchase Orders."
                : "PO CLOSED tetap tampil sebagai referensi, tapi tidak bisa dipilih untuk inbound baru."
            }
          >
            <SelectNative id="po_id" {...inboundForm.register("po_id")}>
              <option value="">No PO (optional)</option>
              {(purchaseOrdersQuery.data ?? []).map((purchaseOrder) => (
                <option
                  key={purchaseOrder.id}
                  value={purchaseOrder.id}
                  disabled={purchaseOrder.status === "CLOSED" && purchaseOrder.id !== editingInbound?.po_id}
                >
                  {purchaseOrder.po_number}
                  {purchaseOrder.status === "CLOSED" ? " (CLOSED)" : ""}
                </option>
              ))}
            </SelectNative>
          </FormField>
          <FormField label="Receive date" htmlFor="receive_date" error={inboundForm.formState.errors.receive_date?.message}>
            <Input id="receive_date" type="date" {...inboundForm.register("receive_date")} />
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Vendor note" htmlFor="surat_jalan_vendor">
            <Input id="surat_jalan_vendor" {...inboundForm.register("surat_jalan_vendor")} />
          </FormField>
          <FormField label="System status" htmlFor="inbound_status_hint" helperText="QC status berubah otomatis setelah Post stock.">
            <Input id="inbound_status_hint" value={editingInbound?.qc_status ?? "PENDING"} disabled />
          </FormField>
        </div>

        <FormField label="Received by" htmlFor="received_by" error={inboundForm.formState.errors.received_by?.message}>
          <Input id="received_by" {...inboundForm.register("received_by")} />
        </FormField>

        <FormField label="Notes" htmlFor="inbound_notes">
          <Textarea id="inbound_notes" {...inboundForm.register("notes")} />
        </FormField>

        <div className="space-y-4 rounded-2xl border border-border/70 bg-background/70 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Inbound Items</p>
              <p className="text-sm text-muted-foreground">
                {activeInboundId
                  ? `Kelola item untuk inbound ${activeInbound?.purchase_orders?.po_number ?? activeInboundId.slice(0, 8)}`
                  : "Simpan inbound dulu, setelah itu item bisa langsung ditambahkan di sini."}
              </p>
            </div>
            {activeInboundId ? (
              <Button
                size="sm"
                disabled={actionPending || activeInboundPosted}
                onClick={() => {
                  startNewInboundItem();
                  if (!inboundItemDraft) {
                    setInboundItemDraft(createEmptyInboundItemDraft(activeInboundId));
                  }
                }}
              >
                <Plus className="size-4" />
                Add item
              </Button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-white px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Items: {inboundItems.length}</span>
            <span>Qty received: {totalItemQtyReceived.toLocaleString("id-ID")}</span>
            <span>Qty passed: {totalItemQtyPassed.toLocaleString("id-ID")}</span>
            <span>Qty rejected: {totalItemQtyRejected.toLocaleString("id-ID")}</span>
            {activeInbound?.po_id ? (
              <span className="font-medium text-slate-600">PO linked: {activeInbound.purchase_orders?.po_number ?? activeInbound.po_id}</span>
            ) : null}
            {activeInbound?.po_id ? (
              <span
                className={cn(
                  "font-medium",
                  poTotalsPreview.delta > 0 ? "text-rose-600" : poTotalsPreview.delta < 0 ? "text-amber-600" : "text-emerald-600"
                )}
              >
                PO progress: {poTotalsPreview.received.toLocaleString("id-ID")} / {poTotalsPreview.ordered.toLocaleString("id-ID")} (
                {poTotalsPreview.delta > 0 ? `lebih ${poTotalsPreview.delta.toLocaleString("id-ID")}` : poTotalsPreview.delta < 0 ? `sisa ${Math.abs(poTotalsPreview.delta).toLocaleString("id-ID")}` : "pas"})
              </span>
            ) : null}
            <span>{activeInboundPosted ? "Posted (locked)" : "Draft (editable)"}</span>
          </div>

          {inventoryQuery.isError ? (
            <EmptyState title="Failed to load inventory" description={inventoryQuery.error.message} />
          ) : inboundItemsQuery.isError ? (
            <EmptyState title="Failed to load inbound items" description={inboundItemsQuery.error.message} />
          ) : activeInboundId ? (
            <DataTable columns={inboundItemColumns} data={inboundItemRows} emptyMessage="No inbound items yet." />
          ) : (
            <EmptyState title="Inbound belum disimpan" description="Klik create inbound dulu, lalu lanjut tambah item di form yang sama." />
          )}
        </div>
      </ModalFormShell>
    </PageShell>
  );
}
