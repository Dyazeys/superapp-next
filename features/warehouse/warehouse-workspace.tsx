/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { createColumnHelper } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/feedback/status-badge";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { warehouseApi } from "@/features/warehouse/api";
import { useModalState } from "@/hooks/use-modal-state";
import {
  adjustmentSchema,
  inboundDeliverySchema,
  purchaseOrderSchema,
  vendorSchema,
  type AdjustmentInput,
  type InboundDeliveryInput,
  type InboundItemInput,
  type PurchaseOrderInput,
  type VendorInput,
} from "@/schemas/warehouse-module";
import type {
  AdjustmentRecord,
  InboundDeliveryRecord,
  InboundItemRecord,
  PurchaseOrderRecord,
  StockBalanceRecord,
  StockMovementRecord,
  VendorRecord,
} from "@/types/warehouse";

const vendorColumnHelper = createColumnHelper<VendorRecord>();
const poColumnHelper = createColumnHelper<PurchaseOrderRecord>();
const inboundColumnHelper = createColumnHelper<InboundDeliveryRecord>();
const inboundItemColumnHelper = createColumnHelper<InboundItemRecord>();
const adjustmentColumnHelper = createColumnHelper<AdjustmentRecord>();
const stockBalanceColumnHelper = createColumnHelper<StockBalanceRecord>();
const stockMovementColumnHelper = createColumnHelper<StockMovementRecord>();

function asBool(value: string) {
  return value === "true";
}

function toDateInput(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function emptyInboundItemDraft(inboundId: string): InboundItemInput {
  return {
    inbound_id: inboundId,
    inv_code: "",
    qty_received: 0,
    qty_passed_qc: 0,
    qty_rejected_qc: 0,
    unit_cost: null,
  };
}

function movementTone(referenceType: string) {
  if (referenceType === "INBOUND") return "success";
  if (referenceType === "ADJUSTMENT") return "info";
  if (referenceType === "SALE") return "warning";
  return "neutral";
}

export function WarehouseWorkspace() {
  const queryClient = useQueryClient();
  const vendorModal = useModalState();
  const purchaseOrderModal = useModalState();
  const inboundModal = useModalState();
  const adjustmentModal = useModalState();

  const [editingVendor, setEditingVendor] = useState<VendorRecord | null>(null);
  const [editingPurchaseOrder, setEditingPurchaseOrder] = useState<PurchaseOrderRecord | null>(null);
  const [editingInbound, setEditingInbound] = useState<InboundDeliveryRecord | null>(null);
  const [editingAdjustment, setEditingAdjustment] = useState<AdjustmentRecord | null>(null);
  const [selectedInboundId, setSelectedInboundId] = useState<string | null>(null);
  const [editingInboundItemId, setEditingInboundItemId] = useState<string | null>(null);
  const [inboundItemDraft, setInboundItemDraft] = useState<InboundItemInput | null>(null);

  const vendorsQuery = useQuery({ queryKey: ["warehouse-vendors"], queryFn: warehouseApi.vendors.list });
  const purchaseOrdersQuery = useQuery({
    queryKey: ["warehouse-purchase-orders"],
    queryFn: warehouseApi.purchaseOrders.list,
  });
  const inboundQuery = useQuery({ queryKey: ["warehouse-inbound"], queryFn: warehouseApi.inbound.list });
  const stockBalancesQuery = useQuery({
    queryKey: ["warehouse-stock-balances"],
    queryFn: warehouseApi.stock.balances,
  });
  const stockMovementsQuery = useQuery({
    queryKey: ["warehouse-stock-movements"],
    queryFn: warehouseApi.stock.movements,
  });
  const adjustmentsQuery = useQuery({
    queryKey: ["warehouse-adjustments"],
    queryFn: warehouseApi.adjustments.list,
  });
  const inventoryQuery = useQuery({
    queryKey: ["product-inventory-lookup"],
    queryFn: async () => {
      const response = await fetch("/api/product/inventory");
      if (!response.ok) throw new Error("Failed to load inventory lookup");
      return (await response.json()) as Array<{ inv_code: string; inv_name: string }>;
    },
  });
  const inboundItemsQuery = useQuery({
    queryKey: ["warehouse-inbound-items", selectedInboundId],
    queryFn: () => warehouseApi.inbound.items.list(selectedInboundId!),
    enabled: Boolean(selectedInboundId),
  });

  useEffect(() => {
    if (!selectedInboundId && inboundQuery.data?.length) {
      setSelectedInboundId(inboundQuery.data[0].id);
    }
  }, [inboundQuery.data, selectedInboundId]);

  const vendorForm = useForm({
    resolver: zodResolver(vendorSchema),
    defaultValues: { vendor_code: "", vendor_name: "", pic_name: "", phone: "", address: "", is_active: true },
  });
  const purchaseOrderForm = useForm({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: { po_number: "", vendor_code: "", order_date: "", status: "OPEN" },
  });
  const inboundForm = useForm({
    resolver: zodResolver(inboundDeliverySchema),
    defaultValues: { po_id: null, receive_date: "", surat_jalan_vendor: "", qc_status: "PENDING", received_by: "", notes: "" },
  });
  const adjustmentForm = useForm({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: { adjustment_date: "", inv_code: "", adj_type: "IN", qty: 1, reason: "", approved_by: "" },
  });

  async function invalidateAll() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["warehouse-vendors"] }),
      queryClient.invalidateQueries({ queryKey: ["warehouse-purchase-orders"] }),
      queryClient.invalidateQueries({ queryKey: ["warehouse-inbound"] }),
      queryClient.invalidateQueries({ queryKey: ["warehouse-inbound-items"] }),
      queryClient.invalidateQueries({ queryKey: ["warehouse-stock-balances"] }),
      queryClient.invalidateQueries({ queryKey: ["warehouse-stock-movements"] }),
      queryClient.invalidateQueries({ queryKey: ["warehouse-adjustments"] }),
    ]);
  }

  const vendorMutation = useMutation({
    mutationFn: (payload: VendorInput) =>
      editingVendor ? warehouseApi.vendors.update(editingVendor.vendor_code, payload) : warehouseApi.vendors.create(payload),
    onSuccess: async () => {
      toast.success(`Vendor ${editingVendor ? "updated" : "created"}`);
      await invalidateAll();
      vendorModal.closeModal();
      setEditingVendor(null);
      vendorForm.reset();
    },
  });

  const purchaseOrderMutation = useMutation({
    mutationFn: (payload: PurchaseOrderInput) =>
      editingPurchaseOrder
        ? warehouseApi.purchaseOrders.update(editingPurchaseOrder.id, payload)
        : warehouseApi.purchaseOrders.create(payload),
    onSuccess: async () => {
      toast.success(`Purchase order ${editingPurchaseOrder ? "updated" : "created"}`);
      await invalidateAll();
      purchaseOrderModal.closeModal();
      setEditingPurchaseOrder(null);
      purchaseOrderForm.reset();
    },
  });

  const inboundMutation = useMutation({
    mutationFn: (payload: InboundDeliveryInput) =>
      editingInbound ? warehouseApi.inbound.update(editingInbound.id, payload) : warehouseApi.inbound.create(payload),
    onSuccess: async (inbound) => {
      toast.success(`Inbound ${editingInbound ? "updated" : "created"}`);
      await invalidateAll();
      inboundModal.closeModal();
      setEditingInbound(null);
      setSelectedInboundId(inbound.id);
      inboundForm.reset();
    },
  });

  const adjustmentMutation = useMutation({
    mutationFn: (payload: AdjustmentInput) =>
      editingAdjustment
        ? warehouseApi.adjustments.update(editingAdjustment.id, payload)
        : warehouseApi.adjustments.create(payload),
    onSuccess: async () => {
      toast.success(`Adjustment ${editingAdjustment ? "updated" : "created"}`);
      await invalidateAll();
      adjustmentModal.closeModal();
      setEditingAdjustment(null);
      adjustmentForm.reset();
    },
  });

  const deleteVendorMutation = useMutation({ mutationFn: warehouseApi.vendors.remove, onSuccess: invalidateAll });
  const deletePurchaseOrderMutation = useMutation({ mutationFn: warehouseApi.purchaseOrders.remove, onSuccess: invalidateAll });
  const deleteInboundMutation = useMutation({
    mutationFn: warehouseApi.inbound.remove,
    onSuccess: async () => {
      await invalidateAll();
      setSelectedInboundId(null);
      setEditingInboundItemId(null);
      setInboundItemDraft(null);
    },
  });
  const deleteAdjustmentMutation = useMutation({ mutationFn: warehouseApi.adjustments.remove, onSuccess: invalidateAll });
  const inboundItemMutation = useMutation({
    mutationFn: (payload: InboundItemInput) => {
      if (!selectedInboundId) throw new Error("Select an inbound first");
      const body = Object.fromEntries(Object.entries(payload).filter(([key]) => key !== "inbound_id")) as Omit<InboundItemInput, "inbound_id">;
      return editingInboundItemId
        ? warehouseApi.inbound.items.update(selectedInboundId, editingInboundItemId, body)
        : warehouseApi.inbound.items.create(selectedInboundId, body);
    },
    onSuccess: async () => {
      await invalidateAll();
      setEditingInboundItemId(null);
      setInboundItemDraft(null);
    },
  });
  const deleteInboundItemMutation = useMutation({
    mutationFn: ({ inboundId, itemId }: { inboundId: string; itemId: string }) => warehouseApi.inbound.items.remove(inboundId, itemId),
    onSuccess: async () => {
      await invalidateAll();
      setEditingInboundItemId(null);
      setInboundItemDraft(null);
    },
  });

  const openVendorModal = useCallback((vendor?: VendorRecord) => {
    setEditingVendor(vendor ?? null);
    vendorForm.reset({ vendor_code: vendor?.vendor_code ?? "", vendor_name: vendor?.vendor_name ?? "", pic_name: vendor?.pic_name ?? "", phone: vendor?.phone ?? "", address: vendor?.address ?? "", is_active: vendor?.is_active ?? true });
    vendorModal.openModal();
  }, [vendorForm, vendorModal]);

  const openPurchaseOrderModal = useCallback((purchaseOrder?: PurchaseOrderRecord) => {
    setEditingPurchaseOrder(purchaseOrder ?? null);
    purchaseOrderForm.reset({ po_number: purchaseOrder?.po_number ?? "", vendor_code: purchaseOrder?.vendor_code ?? "", order_date: toDateInput(purchaseOrder?.order_date), status: purchaseOrder?.status ?? "OPEN" });
    purchaseOrderModal.openModal();
  }, [purchaseOrderForm, purchaseOrderModal]);

  const openInboundModal = useCallback((inbound?: InboundDeliveryRecord) => {
    setEditingInbound(inbound ?? null);
    inboundForm.reset({ po_id: inbound?.po_id ?? null, receive_date: toDateInput(inbound?.receive_date), surat_jalan_vendor: inbound?.surat_jalan_vendor ?? "", qc_status: inbound?.qc_status ?? "PENDING", received_by: inbound?.received_by ?? "", notes: inbound?.notes ?? "" });
    inboundModal.openModal();
  }, [inboundForm, inboundModal]);

  const openAdjustmentModal = useCallback((adjustment?: AdjustmentRecord) => {
    setEditingAdjustment(adjustment ?? null);
    adjustmentForm.reset({ adjustment_date: toDateInput(adjustment?.adjustment_date), inv_code: adjustment?.inv_code ?? "", adj_type: (adjustment?.adj_type as "IN" | "OUT" | undefined) ?? "IN", qty: adjustment?.qty ?? 1, reason: adjustment?.reason ?? "", approved_by: adjustment?.approved_by ?? "" });
    adjustmentModal.openModal();
  }, [adjustmentForm, adjustmentModal]);

  const selectedInbound = useMemo(
    () => (inboundQuery.data ?? []).find((record) => record.id === selectedInboundId) ?? null,
    [inboundQuery.data, selectedInboundId]
  );

  const vendorsColumns = useMemo(
    () => [
      vendorColumnHelper.accessor("vendor_code", { header: "Code", cell: (info) => <span className="font-medium">{info.getValue()}</span> }),
      vendorColumnHelper.accessor("vendor_name", { header: "Vendor" }),
      vendorColumnHelper.accessor("pic_name", { header: "PIC", cell: (info) => info.getValue() ?? "-" }),
      vendorColumnHelper.accessor("phone", { header: "Phone", cell: (info) => info.getValue() ?? "-" }),
      vendorColumnHelper.accessor("is_active", {
        header: "Status",
        cell: (info) => <StatusBadge label={info.getValue() ? "Active" : "Inactive"} tone={info.getValue() ? "success" : "neutral"} />,
      }),
      vendorColumnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button size="icon-xs" variant="outline" onClick={() => openVendorModal(row.original)}><Pencil className="size-3.5" /></Button>
            <Button size="icon-xs" variant="outline" onClick={() => deleteVendorMutation.mutate(row.original.vendor_code)}><Trash2 className="size-3.5" /></Button>
          </div>
        ),
      }),
    ],
    [deleteVendorMutation, openVendorModal]
  );

  const purchaseOrderColumns = useMemo(
    () => [
      poColumnHelper.accessor("po_number", { header: "PO Number", cell: (info) => <span className="font-medium">{info.getValue()}</span> }),
      poColumnHelper.accessor("vendor_code", { header: "Vendor", cell: (info) => info.row.original.master_vendor?.vendor_name ?? info.getValue() }),
      poColumnHelper.accessor("order_date", { header: "Order Date", cell: (info) => toDateInput(info.getValue()) }),
      poColumnHelper.accessor("status", {
        header: "Status",
        cell: (info) => <StatusBadge label={info.getValue()} tone={info.getValue() === "OPEN" ? "info" : "neutral"} />,
      }),
      poColumnHelper.display({
        id: "inbound_count",
        header: "Inbound",
        cell: ({ row }) => <StatusBadge label={`${row.original._count?.inbound_deliveries ?? 0} linked`} tone="neutral" />,
      }),
      poColumnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button size="icon-xs" variant="outline" onClick={() => openPurchaseOrderModal(row.original)}><Pencil className="size-3.5" /></Button>
            <Button size="icon-xs" variant="outline" onClick={() => deletePurchaseOrderMutation.mutate(row.original.id)}><Trash2 className="size-3.5" /></Button>
          </div>
        ),
      }),
    ],
    [deletePurchaseOrderMutation, openPurchaseOrderModal]
  );

  const inboundColumns = useMemo(
    () => [
      inboundColumnHelper.accessor("receive_date", {
        header: "Receive Date",
        cell: ({ row, getValue }) => <button type="button" className="font-medium text-left" onClick={() => setSelectedInboundId(row.original.id)}>{toDateInput(getValue())}</button>,
      }),
      inboundColumnHelper.accessor("po_id", { header: "PO", cell: (info) => info.row.original.purchase_orders?.po_number ?? "-" }),
      inboundColumnHelper.accessor("surat_jalan_vendor", { header: "Vendor Note", cell: (info) => info.getValue() ?? "-" }),
      inboundColumnHelper.accessor("qc_status", { header: "QC", cell: (info) => <StatusBadge label={info.getValue()} tone={info.getValue() === "PASSED" ? "success" : info.getValue() === "PARTIAL" ? "warning" : "neutral"} /> }),
      inboundColumnHelper.display({
        id: "items",
        header: "Items",
        cell: ({ row }) => <StatusBadge label={`${row.original._count?.inbound_items ?? 0} rows`} tone="info" />,
      }),
      inboundColumnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button size="icon-xs" variant="outline" onClick={() => setSelectedInboundId(row.original.id)}>Items</Button>
            <Button size="icon-xs" variant="outline" onClick={() => openInboundModal(row.original)}><Pencil className="size-3.5" /></Button>
            <Button size="icon-xs" variant="outline" onClick={() => deleteInboundMutation.mutate(row.original.id)}><Trash2 className="size-3.5" /></Button>
          </div>
        ),
      }),
    ],
    [deleteInboundMutation, openInboundModal]
  );

  const inboundItemRows = useMemo(() => {
    const rows = inboundItemsQuery.data ?? [];
    if (!inboundItemDraft || editingInboundItemId) return rows;
    return [{
      id: "__new__",
      inbound_id: inboundItemDraft.inbound_id,
      inv_code: inboundItemDraft.inv_code,
      qty_received: inboundItemDraft.qty_received,
      qty_passed_qc: inboundItemDraft.qty_passed_qc,
      qty_rejected_qc: inboundItemDraft.qty_rejected_qc,
      unit_cost: inboundItemDraft.unit_cost,
      created_at: new Date().toISOString(),
      master_inventory: inventoryQuery.data?.find((inventory) => inventory.inv_code === inboundItemDraft.inv_code) ?? null,
    }, ...rows];
  }, [editingInboundItemId, inboundItemDraft, inboundItemsQuery.data, inventoryQuery.data]);

  const isEditingInboundItemRow = useCallback(
    (id: string) => editingInboundItemId === id || (id === "__new__" && !editingInboundItemId && Boolean(inboundItemDraft)),
    [editingInboundItemId, inboundItemDraft]
  );

  const inboundItemColumns = useMemo(
    () => [
      inboundItemColumnHelper.accessor("inv_code", {
        header: "Inventory",
        cell: ({ row, getValue }) => isEditingInboundItemRow(row.original.id) ? (
          <Input list="warehouse-inventory-codes" value={inboundItemDraft?.inv_code ?? getValue()} onChange={(e) => setInboundItemDraft((current) => current ? { ...current, inv_code: e.target.value } : current)} className="h-8 min-w-[150px]" />
        ) : (
          <div><p className="font-medium">{getValue()}</p><p className="text-xs text-muted-foreground">{row.original.master_inventory?.inv_name ?? ""}</p></div>
        ),
      }),
      inboundItemColumnHelper.accessor("qty_received", {
        header: "Received",
        cell: ({ row, getValue }) => isEditingInboundItemRow(row.original.id) ? (
          <Input value={String(inboundItemDraft?.qty_received ?? getValue())} onChange={(e) => setInboundItemDraft((current) => current ? { ...current, qty_received: Number(e.target.value || 0) } : current)} className="h-8 w-20" />
        ) : getValue(),
      }),
      inboundItemColumnHelper.accessor("qty_passed_qc", {
        header: "Passed QC",
        cell: ({ row, getValue }) => isEditingInboundItemRow(row.original.id) ? (
          <Input value={String(inboundItemDraft?.qty_passed_qc ?? getValue())} onChange={(e) => setInboundItemDraft((current) => current ? { ...current, qty_passed_qc: Number(e.target.value || 0) } : current)} className="h-8 w-20" />
        ) : <StatusBadge label={String(getValue())} tone="success" />,
      }),
      inboundItemColumnHelper.accessor("qty_rejected_qc", {
        header: "Rejected",
        cell: ({ row, getValue }) => isEditingInboundItemRow(row.original.id) ? (
          <Input value={String(inboundItemDraft?.qty_rejected_qc ?? getValue())} onChange={(e) => setInboundItemDraft((current) => current ? { ...current, qty_rejected_qc: Number(e.target.value || 0) } : current)} className="h-8 w-20" />
        ) : getValue(),
      }),
      inboundItemColumnHelper.accessor("unit_cost", {
        header: "Unit Cost",
        cell: ({ row, getValue }) => isEditingInboundItemRow(row.original.id) ? (
          <Input value={inboundItemDraft?.unit_cost ?? getValue() ?? ""} onChange={(e) => setInboundItemDraft((current) => current ? { ...current, unit_cost: e.target.value || null } : current)} className="h-8 w-24" />
        ) : (getValue() ?? "-"),
      }),
      inboundItemColumnHelper.display({
        id: "stock_effect",
        header: "Stock Effect",
        cell: ({ row }) => <StatusBadge label={`+${isEditingInboundItemRow(row.original.id) ? inboundItemDraft?.qty_passed_qc ?? row.original.qty_passed_qc : row.original.qty_passed_qc}`} tone="success" />,
      }),
      inboundItemColumnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => isEditingInboundItemRow(row.original.id) ? (
          <div className="flex justify-end gap-2">
            <Button size="icon-xs" variant="outline" onClick={() => inboundItemDraft && inboundItemMutation.mutate(inboundItemDraft)}><Save className="size-3.5" /></Button>
            <Button size="icon-xs" variant="outline" onClick={() => { setEditingInboundItemId(null); setInboundItemDraft(null); }}><X className="size-3.5" /></Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button size="icon-xs" variant="outline" onClick={() => { setEditingInboundItemId(row.original.id); setInboundItemDraft({ inbound_id: row.original.inbound_id, inv_code: row.original.inv_code, qty_received: row.original.qty_received, qty_passed_qc: row.original.qty_passed_qc, qty_rejected_qc: row.original.qty_rejected_qc, unit_cost: row.original.unit_cost }); }}><Pencil className="size-3.5" /></Button>
            <Button size="icon-xs" variant="outline" onClick={() => selectedInboundId && deleteInboundItemMutation.mutate({ inboundId: selectedInboundId, itemId: row.original.id })}><Trash2 className="size-3.5" /></Button>
          </div>
        ),
      }),
    ],
    [deleteInboundItemMutation, inboundItemDraft, inboundItemMutation, isEditingInboundItemRow, selectedInboundId]
  );

  const adjustmentColumns = useMemo(
    () => [
      adjustmentColumnHelper.accessor("adjustment_date", { header: "Date", cell: (info) => toDateInput(info.getValue()) }),
      adjustmentColumnHelper.accessor("inv_code", {
        header: "Inventory",
        cell: (info) => <div><p className="font-medium">{info.getValue()}</p><p className="text-xs text-muted-foreground">{info.row.original.master_inventory?.inv_name ?? ""}</p></div>,
      }),
      adjustmentColumnHelper.accessor("adj_type", { header: "Type", cell: (info) => <StatusBadge label={info.getValue()} tone={info.getValue() === "IN" ? "success" : "warning"} /> }),
      adjustmentColumnHelper.accessor("qty", { header: "Qty" }),
      adjustmentColumnHelper.accessor("reason", { header: "Reason" }),
      adjustmentColumnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button size="icon-xs" variant="outline" onClick={() => openAdjustmentModal(row.original)}><Pencil className="size-3.5" /></Button>
            <Button size="icon-xs" variant="outline" onClick={() => deleteAdjustmentMutation.mutate(row.original.id)}><Trash2 className="size-3.5" /></Button>
          </div>
        ),
      }),
    ],
    [deleteAdjustmentMutation, openAdjustmentModal]
  );

  const stockBalanceColumns = useMemo(
    () => [
      stockBalanceColumnHelper.accessor("inv_code", {
        header: "Inventory",
        cell: (info) => <div><p className="font-medium">{info.getValue()}</p><p className="text-xs text-muted-foreground">{info.row.original.master_inventory?.inv_name ?? ""}</p></div>,
      }),
      stockBalanceColumnHelper.accessor("qty_on_hand", {
        header: "On Hand",
        cell: (info) => <StatusBadge label={String(info.getValue())} tone={info.getValue() > 0 ? "success" : info.getValue() < 0 ? "danger" : "neutral"} />,
      }),
      stockBalanceColumnHelper.accessor("last_updated", { header: "Last Updated", cell: (info) => new Date(info.getValue()).toLocaleString("en-US") }),
      stockBalanceColumnHelper.accessor("master_inventory", { header: "HPP", cell: (info) => info.getValue()?.hpp ?? "-" }),
    ],
    []
  );

  const stockMovementColumns = useMemo(
    () => [
      stockMovementColumnHelper.accessor("movement_date", { header: "Date", cell: (info) => toDateInput(info.getValue()) }),
      stockMovementColumnHelper.accessor("inv_code", { header: "Inventory" }),
      stockMovementColumnHelper.accessor("reference_type", { header: "Source", cell: (info) => <StatusBadge label={info.getValue()} tone={movementTone(info.getValue())} /> }),
      stockMovementColumnHelper.accessor("qty_change", { header: "Change", cell: (info) => <span className={info.getValue() >= 0 ? "text-emerald-700" : "text-amber-700"}>{info.getValue() > 0 ? `+${info.getValue()}` : info.getValue()}</span> }),
      stockMovementColumnHelper.accessor("running_balance", { header: "Running" }),
      stockMovementColumnHelper.accessor("notes", { header: "Notes", cell: (info) => info.getValue() ?? "-" }),
    ],
    []
  );

  return (
    <div className="space-y-6">
      <datalist id="warehouse-vendor-codes">{(vendorsQuery.data ?? []).map((vendor) => <option key={vendor.vendor_code} value={vendor.vendor_code} />)}</datalist>
      <datalist id="warehouse-po-ids">{(purchaseOrdersQuery.data ?? []).map((purchaseOrder) => <option key={purchaseOrder.id} value={purchaseOrder.id}>{purchaseOrder.po_number}</option>)}</datalist>
      <datalist id="warehouse-inventory-codes">{(inventoryQuery.data ?? []).map((inventory) => <option key={inventory.inv_code} value={inventory.inv_code}>{inventory.inv_name}</option>)}</datalist>
      <datalist id="warehouse-boolean-values"><option value="true" /><option value="false" /></datalist>
      <datalist id="warehouse-po-statuses"><option value="OPEN" /><option value="PARTIAL" /><option value="CLOSED" /></datalist>
      <datalist id="warehouse-qc-statuses"><option value="PENDING" /><option value="PARTIAL" /><option value="PASSED" /><option value="REJECTED" /></datalist>
      <datalist id="warehouse-adjustment-types"><option value="IN" /><option value="OUT" /></datalist>

      <section className="grid gap-6 xl:grid-cols-2">
        <WorkspacePanel title="Vendors" description="Master vendor records reused by purchase orders.">
          <div className="space-y-4">
            <div className="flex justify-end"><Button size="sm" onClick={() => openVendorModal()}><Plus className="size-4" />Add vendor</Button></div>
            <DataTable columns={vendorsColumns} data={vendorsQuery.data ?? []} emptyMessage="No vendors found." />
          </div>
        </WorkspacePanel>
        <WorkspacePanel title="Purchase Orders" description="Basic PO structure from the current warehouse schema.">
          <div className="space-y-4">
            <div className="flex justify-end"><Button size="sm" onClick={() => openPurchaseOrderModal()}><Plus className="size-4" />Add purchase order</Button></div>
            <DataTable columns={purchaseOrderColumns} data={purchaseOrdersQuery.data ?? []} emptyMessage="No purchase orders found." />
          </div>
        </WorkspacePanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_1.35fr]">
        <WorkspacePanel title="Inbound" description="Inbound delivery headers with inline item maintenance per selected receipt.">
          <div className="space-y-4">
            <div className="flex justify-end"><Button size="sm" onClick={() => openInboundModal()}><Plus className="size-4" />Add inbound</Button></div>
            <DataTable columns={inboundColumns} data={inboundQuery.data ?? []} emptyMessage="No inbound deliveries found." />
          </div>
        </WorkspacePanel>
        <WorkspacePanel title="Inbound Items" description="Inline editing drives stock increases from passed QC quantities only.">
          {selectedInboundId ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-background/70 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{selectedInbound?.purchase_orders?.po_number ?? "Ad-hoc inbound"}</p>
                  <p className="text-sm text-muted-foreground">{selectedInbound ? `${toDateInput(selectedInbound.receive_date)} • ${selectedInbound.received_by}` : "Selected inbound"}</p>
                </div>
                <Button size="sm" onClick={() => selectedInboundId && setInboundItemDraft(emptyInboundItemDraft(selectedInboundId))}><Plus className="size-4" />Add inbound item</Button>
              </div>
              <DataTable columns={inboundItemColumns} data={inboundItemRows} emptyMessage="No inbound items found for this delivery." />
            </div>
          ) : (
            <EmptyState title="Select an inbound delivery" description="Choose an inbound record from the left table to manage one-to-many inbound items." />
          )}
        </WorkspacePanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <WorkspacePanel title="Stock Balances" description="Balances are read directly from warehouse stock tables and refreshed after warehouse mutations.">
          <DataTable columns={stockBalanceColumns} data={stockBalancesQuery.data ?? []} emptyMessage="No stock balances found." />
        </WorkspacePanel>
        <WorkspacePanel title="Adjustments" description="Manual stock corrections write movement ledger rows and rebalance stock on hand.">
          <div className="space-y-4">
            <div className="flex justify-end"><Button size="sm" onClick={() => openAdjustmentModal()}><Plus className="size-4" />Add adjustment</Button></div>
            <DataTable columns={adjustmentColumns} data={adjustmentsQuery.data ?? []} emptyMessage="No stock adjustments found." />
          </div>
        </WorkspacePanel>
      </section>

      <WorkspacePanel title="Stock Movements" description="Recent movement ledger across inbound, adjustment, and existing sale activity.">
        <DataTable columns={stockMovementColumns} data={stockMovementsQuery.data ?? []} emptyMessage="No stock movements found." />
      </WorkspacePanel>

      <ModalFormShell open={vendorModal.open} onOpenChange={vendorModal.setOpen} title={editingVendor ? "Edit vendor" : "Create vendor"} description="Modal CRUD flow for warehouse vendors." submitLabel={editingVendor ? "Save changes" : "Create vendor"} onSubmit={vendorForm.handleSubmit((values) => vendorMutation.mutate(values))}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Vendor code" htmlFor="vendor_code" error={vendorForm.formState.errors.vendor_code?.message}><Input id="vendor_code" {...vendorForm.register("vendor_code")} disabled={Boolean(editingVendor)} /></FormField>
          <FormField label="Vendor name" htmlFor="vendor_name" error={vendorForm.formState.errors.vendor_name?.message}><Input id="vendor_name" {...vendorForm.register("vendor_name")} /></FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="PIC" htmlFor="pic_name"><Input id="pic_name" {...vendorForm.register("pic_name")} /></FormField>
          <FormField label="Phone" htmlFor="phone"><Input id="phone" {...vendorForm.register("phone")} /></FormField>
        </div>
        <FormField label="Address" htmlFor="address"><Textarea id="address" {...vendorForm.register("address")} /></FormField>
        <FormField label="Active" htmlFor="vendor_active"><Input id="vendor_active" list="warehouse-boolean-values" value={String(vendorForm.watch("is_active"))} onChange={(e) => vendorForm.setValue("is_active", asBool(e.target.value))} /></FormField>
      </ModalFormShell>

      <ModalFormShell open={purchaseOrderModal.open} onOpenChange={purchaseOrderModal.setOpen} title={editingPurchaseOrder ? "Edit purchase order" : "Create purchase order"} description="Basic warehouse PO header structure only." submitLabel={editingPurchaseOrder ? "Save changes" : "Create purchase order"} onSubmit={purchaseOrderForm.handleSubmit((values) => purchaseOrderMutation.mutate(values))}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="PO number" htmlFor="po_number" error={purchaseOrderForm.formState.errors.po_number?.message}><Input id="po_number" {...purchaseOrderForm.register("po_number")} /></FormField>
          <FormField label="Vendor code" htmlFor="po_vendor_code" error={purchaseOrderForm.formState.errors.vendor_code?.message}><Input id="po_vendor_code" list="warehouse-vendor-codes" {...purchaseOrderForm.register("vendor_code")} /></FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Order date" htmlFor="order_date" error={purchaseOrderForm.formState.errors.order_date?.message}><Input id="order_date" type="date" {...purchaseOrderForm.register("order_date")} /></FormField>
          <FormField label="Status" htmlFor="po_status" error={purchaseOrderForm.formState.errors.status?.message}><Input id="po_status" list="warehouse-po-statuses" {...purchaseOrderForm.register("status")} /></FormField>
        </div>
      </ModalFormShell>

      <ModalFormShell open={inboundModal.open} onOpenChange={inboundModal.setOpen} title={editingInbound ? "Edit inbound" : "Create inbound"} description="Inbound delivery header with warehouse receiving details." submitLabel={editingInbound ? "Save changes" : "Create inbound"} onSubmit={inboundForm.handleSubmit((values) => inboundMutation.mutate(values))}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Receive date" htmlFor="receive_date" error={inboundForm.formState.errors.receive_date?.message}><Input id="receive_date" type="date" {...inboundForm.register("receive_date")} /></FormField>
          <FormField label="PO id" htmlFor="po_id"><Input id="po_id" list="warehouse-po-ids" {...inboundForm.register("po_id")} /></FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Vendor note" htmlFor="surat_jalan_vendor"><Input id="surat_jalan_vendor" {...inboundForm.register("surat_jalan_vendor")} /></FormField>
          <FormField label="QC status" htmlFor="qc_status" error={inboundForm.formState.errors.qc_status?.message}><Input id="qc_status" list="warehouse-qc-statuses" {...inboundForm.register("qc_status")} /></FormField>
        </div>
        <FormField label="Received by" htmlFor="received_by" error={inboundForm.formState.errors.received_by?.message}><Input id="received_by" {...inboundForm.register("received_by")} /></FormField>
        <FormField label="Notes" htmlFor="inbound_notes"><Textarea id="inbound_notes" {...inboundForm.register("notes")} /></FormField>
      </ModalFormShell>

      <ModalFormShell open={adjustmentModal.open} onOpenChange={adjustmentModal.setOpen} title={editingAdjustment ? "Edit adjustment" : "Create adjustment"} description="Manual stock correction that syncs warehouse stock movement records." submitLabel={editingAdjustment ? "Save changes" : "Create adjustment"} onSubmit={adjustmentForm.handleSubmit((values) => adjustmentMutation.mutate(values))}>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Adjustment date" htmlFor="adjustment_date" error={adjustmentForm.formState.errors.adjustment_date?.message}><Input id="adjustment_date" type="date" {...adjustmentForm.register("adjustment_date")} /></FormField>
          <FormField label="Inventory code" htmlFor="adjustment_inv_code" error={adjustmentForm.formState.errors.inv_code?.message}><Input id="adjustment_inv_code" list="warehouse-inventory-codes" {...adjustmentForm.register("inv_code")} /></FormField>
          <FormField label="Type" htmlFor="adjustment_type" error={adjustmentForm.formState.errors.adj_type?.message}><Input id="adjustment_type" list="warehouse-adjustment-types" {...adjustmentForm.register("adj_type")} /></FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Quantity" htmlFor="adjustment_qty" error={adjustmentForm.formState.errors.qty?.message}><Input id="adjustment_qty" {...adjustmentForm.register("qty")} /></FormField>
          <FormField label="Approved by" htmlFor="approved_by"><Input id="approved_by" {...adjustmentForm.register("approved_by")} /></FormField>
        </div>
        <FormField label="Reason" htmlFor="reason" error={adjustmentForm.formState.errors.reason?.message}><Textarea id="reason" {...adjustmentForm.register("reason")} /></FormField>
      </ModalFormShell>
    </div>
  );
}
