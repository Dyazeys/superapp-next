"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useForm, type UseFormReturn } from "react-hook-form";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useModalState } from "@/hooks/use-modal-state";
import { warehouseApi } from "@/features/warehouse/api";
import {
  adjustmentSchema,
  WAREHOUSE_ADJUSTMENT_REASON_OPTIONS,
  inboundDeliverySchema,
  inboundItemSchema,
  purchaseOrderSchema,
  vendorSchema,
  WAREHOUSE_ADJUSTMENT_TYPE_OPTIONS,
  WAREHOUSE_PO_STATUS_OPTIONS,
  WAREHOUSE_QC_STATUS_OPTIONS,
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

type InventoryLookupRecord = {
  inv_code: string;
  inv_name: string;
  unit_price?: string;
  is_active?: boolean;
};

type VendorFormValues = Omit<VendorInput, "is_active"> & {
  is_active?: boolean;
};

type AdjustmentFormValues = Omit<AdjustmentInput, "qty"> & {
  qty: unknown;
};

type VendorHook = {
  vendorsQuery: UseQueryResult<VendorRecord[]>;
  vendorForm: UseFormReturn<VendorFormValues, unknown, VendorInput>;
  vendorModal: ReturnType<typeof useModalState>;
  editingVendor: VendorRecord | null;
  openVendorModal: (vendor?: VendorRecord) => void;
  saveVendor: (values: VendorInput) => Promise<void>;
  deleteVendor: (vendorCode: string) => Promise<void>;
};

type PurchaseOrderHook = {
  purchaseOrdersQuery: UseQueryResult<PurchaseOrderRecord[]>;
  purchaseOrderForm: UseFormReturn<PurchaseOrderInput, unknown, PurchaseOrderInput>;
  purchaseOrderModal: ReturnType<typeof useModalState>;
  editingPurchaseOrder: PurchaseOrderRecord | null;
  openPurchaseOrderModal: (purchaseOrder?: PurchaseOrderRecord) => void;
  savePurchaseOrder: (values: PurchaseOrderInput) => Promise<void>;
  deletePurchaseOrder: (id: string) => Promise<void>;
};

type InboundHook = {
  inboundQuery: UseQueryResult<InboundDeliveryRecord[]>;
  inboundForm: UseFormReturn<InboundDeliveryInput, unknown, InboundDeliveryInput>;
  inboundModal: ReturnType<typeof useModalState>;
  editingInbound: InboundDeliveryRecord | null;
  openInboundModal: (inbound?: InboundDeliveryRecord) => void;
  saveInbound: (values: InboundDeliveryInput) => Promise<InboundDeliveryRecord>;
  deleteInbound: (id: string) => Promise<void>;
  postInbound: (id: string) => Promise<void>;
};

type AdjustmentHook = {
  adjustmentsQuery: UseQueryResult<AdjustmentRecord[]>;
  adjustmentForm: UseFormReturn<AdjustmentFormValues, unknown, AdjustmentInput>;
  adjustmentModal: ReturnType<typeof useModalState>;
  editingAdjustment: AdjustmentRecord | null;
  openAdjustmentModal: (adjustment?: AdjustmentRecord) => void;
  saveAdjustment: (values: AdjustmentInput) => Promise<void>;
  deleteAdjustment: (id: string) => Promise<void>;
};

export const WAREHOUSE_BOOLEAN_OPTIONS = [
  { label: "true", value: "true" },
  { label: "false", value: "false" },
] as const;
export { WAREHOUSE_ADJUSTMENT_TYPE_OPTIONS, WAREHOUSE_PO_STATUS_OPTIONS, WAREHOUSE_QC_STATUS_OPTIONS };
export const WAREHOUSE_INBOUND_EDITABLE_STATUS_OPTIONS = WAREHOUSE_QC_STATUS_OPTIONS.filter(
  (status) => status !== "POSTED"
);
export function isInboundPosted(status: string | null | undefined) {
  return status === "POSTED";
}

const WAREHOUSE_VENDOR_KEY = ["warehouse-vendors"] as const;
const WAREHOUSE_PURCHASE_ORDER_KEY = ["warehouse-purchase-orders"] as const;
const WAREHOUSE_INBOUND_KEY = ["warehouse-inbound"] as const;
const WAREHOUSE_ADJUSTMENT_KEY = ["warehouse-adjustments"] as const;
const WAREHOUSE_STOCK_BALANCE_KEY = ["warehouse-stock-balances"] as const;
const WAREHOUSE_STOCK_MOVEMENT_KEY = ["warehouse-stock-movements"] as const;
const WAREHOUSE_INVENTORY_LOOKUP_KEY = ["warehouse-inventory-lookup"] as const;

function useBaseMutation(invalidateKeys: ReadonlyArray<ReadonlyArray<unknown>>) {
  const queryClient = useQueryClient();
  return () => Promise.all(invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: key })));
}

function toPoStatus(value: string | null | undefined) {
  if (!value) return "OPEN" as const;
  return WAREHOUSE_PO_STATUS_OPTIONS.includes(value as (typeof WAREHOUSE_PO_STATUS_OPTIONS)[number])
    ? (value as (typeof WAREHOUSE_PO_STATUS_OPTIONS)[number])
    : "OPEN";
}

function toQcStatus(value: string | null | undefined) {
  if (!value) return "PENDING" as const;
  return WAREHOUSE_QC_STATUS_OPTIONS.includes(value as (typeof WAREHOUSE_QC_STATUS_OPTIONS)[number])
    ? (value as (typeof WAREHOUSE_QC_STATUS_OPTIONS)[number])
    : "PENDING";
}

export function parseWarehouseBooleanInput(value: string) {
  return value === "true";
}

export function toDateInput(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

export function createEmptyInboundItemDraft(inboundId: string): InboundItemInput {
  return {
    inbound_id: inboundId,
    inv_code: "",
    qty_received: 0,
    qty_passed_qc: 0,
    qty_rejected_qc: 0,
    unit_cost: null,
  };
}

export function movementTone(referenceType: string) {
  if (referenceType === "INBOUND") return "success";
  if (referenceType === "ADJUSTMENT") return "info";
  if (referenceType === "SALE") return "warning";
  return "neutral";
}

export function useWarehouseVendors(): VendorHook {
  const [editingVendor, setEditingVendor] = useState<VendorRecord | null>(null);
  const vendorForm = useForm<VendorFormValues, unknown, VendorInput>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      vendor_code: "",
      vendor_name: "",
      pic_name: "",
      phone: "",
      address: "",
      is_active: true,
    },
  });
  const vendorModal = useModalState();
  const vendorsQuery = useQuery({ queryKey: WAREHOUSE_VENDOR_KEY, queryFn: warehouseApi.vendors.list });
  const invalidate = useBaseMutation([WAREHOUSE_VENDOR_KEY, WAREHOUSE_PURCHASE_ORDER_KEY]);

  const saveVendor = async (values: VendorInput) => {
    try {
      const action = editingVendor
        ? warehouseApi.vendors.update(editingVendor.vendor_code, values)
        : warehouseApi.vendors.create(values);

      await action;
      toast.success(`Vendor ${editingVendor ? "updated" : "created"}`);
      await invalidate();
      setEditingVendor(null);
      vendorModal.closeModal();
      vendorForm.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save vendor");
      throw error;
    }
  };

  const deleteVendor = async (vendorCode: string) => {
    try {
      await warehouseApi.vendors.remove(vendorCode);
      toast.success("Vendor deleted");
      await invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete vendor");
      throw error;
    }
  };

  const openVendorModal = (vendor?: VendorRecord) => {
    setEditingVendor(vendor ?? null);
    vendorForm.reset({
      vendor_code: vendor?.vendor_code ?? "",
      vendor_name: vendor?.vendor_name ?? "",
      pic_name: vendor?.pic_name ?? "",
      phone: vendor?.phone ?? "",
      address: vendor?.address ?? "",
      is_active: vendor?.is_active ?? true,
    });
    vendorModal.openModal();
  };

  return {
    vendorsQuery,
    vendorForm,
    vendorModal,
    editingVendor,
    openVendorModal,
    saveVendor,
    deleteVendor,
  };
}

export function useWarehousePurchaseOrders(): PurchaseOrderHook {
  const [editingPurchaseOrder, setEditingPurchaseOrder] = useState<PurchaseOrderRecord | null>(null);
  const purchaseOrderForm = useForm<PurchaseOrderInput, unknown, PurchaseOrderInput>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      po_number: "",
      vendor_code: "",
      order_date: "",
      status: "OPEN",
    },
  });
  const purchaseOrderModal = useModalState();
  const purchaseOrdersQuery = useQuery({
    queryKey: WAREHOUSE_PURCHASE_ORDER_KEY,
    queryFn: warehouseApi.purchaseOrders.list,
  });
  const invalidate = useBaseMutation([WAREHOUSE_PURCHASE_ORDER_KEY, WAREHOUSE_INBOUND_KEY]);

  const savePurchaseOrder = async (values: PurchaseOrderInput) => {
    try {
      const action = editingPurchaseOrder
        ? warehouseApi.purchaseOrders.update(editingPurchaseOrder.id, values)
        : warehouseApi.purchaseOrders.create(values);

      await action;
      toast.success(`Purchase order ${editingPurchaseOrder ? "updated" : "created"}`);
      await invalidate();
      setEditingPurchaseOrder(null);
      purchaseOrderModal.closeModal();
      purchaseOrderForm.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save purchase order");
      throw error;
    }
  };

  const deletePurchaseOrder = async (id: string) => {
    try {
      await warehouseApi.purchaseOrders.remove(id);
      toast.success("Purchase order deleted");
      await invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete purchase order");
      throw error;
    }
  };

  const openPurchaseOrderModal = (purchaseOrder?: PurchaseOrderRecord) => {
    setEditingPurchaseOrder(purchaseOrder ?? null);
    purchaseOrderForm.reset({
      po_number: purchaseOrder?.po_number ?? "",
      vendor_code: purchaseOrder?.vendor_code ?? "",
      order_date: toDateInput(purchaseOrder?.order_date),
      status: toPoStatus(purchaseOrder?.status),
    });
    purchaseOrderModal.openModal();
  };

  return {
    purchaseOrdersQuery,
    purchaseOrderForm,
    purchaseOrderModal,
    editingPurchaseOrder,
    openPurchaseOrderModal,
    savePurchaseOrder,
    deletePurchaseOrder,
  };
}

export function useWarehouseInbound(): InboundHook {
  const [editingInbound, setEditingInbound] = useState<InboundDeliveryRecord | null>(null);
  const inboundForm = useForm<InboundDeliveryInput, unknown, InboundDeliveryInput>({
    resolver: zodResolver(inboundDeliverySchema),
    defaultValues: {
      po_id: null,
      receive_date: "",
      surat_jalan_vendor: "",
      qc_status: "PENDING",
      received_by: "",
      notes: "",
    },
  });
  const inboundModal = useModalState();
  const inboundQuery = useQuery({ queryKey: WAREHOUSE_INBOUND_KEY, queryFn: warehouseApi.inbound.list });
  const invalidate = useBaseMutation([
    WAREHOUSE_INBOUND_KEY,
    WAREHOUSE_STOCK_BALANCE_KEY,
    WAREHOUSE_STOCK_MOVEMENT_KEY,
  ]);

  const saveInbound = async (values: InboundDeliveryInput) => {
    try {
      const action = editingInbound
        ? warehouseApi.inbound.update(editingInbound.id, values)
        : warehouseApi.inbound.create(values);
      const inbound = await action;

      toast.success(`Inbound ${editingInbound ? "updated" : "created"}`);
      await invalidate();
      setEditingInbound(null);
      inboundModal.closeModal();
      inboundForm.reset();
      return inbound;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save inbound delivery");
      throw error;
    }
  };

  const deleteInbound = async (id: string) => {
    try {
      await warehouseApi.inbound.remove(id);
      toast.success("Inbound deleted");
      await invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete inbound delivery");
      throw error;
    }
  };

  const postInbound = async (id: string) => {
    try {
      await warehouseApi.inbound.post(id);
      toast.success("Inbound posted to stock");
      await invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to post inbound");
      throw error;
    }
  };

  const openInboundModal = (inbound?: InboundDeliveryRecord) => {
    setEditingInbound(inbound ?? null);
    inboundForm.reset({
      po_id: inbound?.po_id ?? null,
      receive_date: toDateInput(inbound?.receive_date),
      surat_jalan_vendor: inbound?.surat_jalan_vendor ?? "",
      qc_status: toQcStatus(inbound?.qc_status),
      received_by: inbound?.received_by ?? "",
      notes: inbound?.notes ?? "",
    });
    inboundModal.openModal();
  };

  return {
    inboundQuery,
    inboundForm,
    inboundModal,
    editingInbound,
    openInboundModal,
    saveInbound,
    deleteInbound,
    postInbound,
  };
}

export function useWarehouseInboundSelection(inbound: InboundDeliveryRecord[] | undefined) {
  const [selectedInboundId, setSelectedInboundId] = useState<string | null>(null);
  const currentInboundId = useMemo(() => selectedInboundId ?? inbound?.[0]?.id ?? null, [inbound, selectedInboundId]);

  return { selectedInboundId, currentInboundId, setSelectedInboundId };
}

export function useWarehouseInboundItems(selectedInboundId?: string) {
  const [editingInboundItemId, setEditingInboundItemId] = useState<string | null>(null);
  const [inboundItemDraft, setInboundItemDraft] = useState<InboundItemInput | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const itemsQuery = useQuery({
    queryKey: ["warehouse-inbound-items", selectedInboundId],
    queryFn: () => warehouseApi.inbound.items.list(selectedInboundId!),
    enabled: Boolean(selectedInboundId),
  });
  const invalidate = useBaseMutation([
    ["warehouse-inbound-items", selectedInboundId],
    WAREHOUSE_INBOUND_KEY,
    WAREHOUSE_STOCK_BALANCE_KEY,
    WAREHOUSE_STOCK_MOVEMENT_KEY,
  ]);

  const saveInboundItem = async (payload: InboundItemInput) => {
    if (!selectedInboundId) {
      throw new Error("Select an inbound first");
    }
    if (actionPending) {
      return;
    }

    try {
      setActionPending(true);
      const validated = inboundItemSchema.parse(payload);
      const body = Object.fromEntries(
        Object.entries(validated).filter(([key]) => key !== "inbound_id")
      ) as Omit<InboundItemInput, "inbound_id">;

      if (editingInboundItemId) {
        await warehouseApi.inbound.items.update(selectedInboundId, editingInboundItemId, body);
      } else {
        await warehouseApi.inbound.items.create(selectedInboundId, body);
      }

      toast.success(`Inbound item ${editingInboundItemId ? "updated" : "created"}`);
      await invalidate();
      setEditingInboundItemId(null);
      setInboundItemDraft(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save inbound item");
      throw error;
    } finally {
      setActionPending(false);
    }
  };

  const deleteInboundItem = async (itemId: string) => {
    if (!selectedInboundId) {
      return;
    }
    if (actionPending) {
      return;
    }

    try {
      setActionPending(true);
      await warehouseApi.inbound.items.remove(selectedInboundId, itemId);
      toast.success("Inbound item deleted");
      await invalidate();
      setEditingInboundItemId(null);
      setInboundItemDraft(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete inbound item");
      throw error;
    } finally {
      setActionPending(false);
    }
  };

  const startNewInboundItem = () => {
    if (!selectedInboundId) {
      return;
    }

    setEditingInboundItemId(null);
    setInboundItemDraft(createEmptyInboundItemDraft(selectedInboundId));
  };

  const startEditingInboundItem = (item: InboundItemRecord) => {
    setEditingInboundItemId(item.id);
    setInboundItemDraft({
      inbound_id: item.inbound_id,
      inv_code: item.inv_code,
      qty_received: item.qty_received,
      qty_passed_qc: item.qty_passed_qc,
      qty_rejected_qc: item.qty_rejected_qc,
      unit_cost: item.unit_cost,
    });
  };

  const cancelEditingInboundItem = () => {
    setEditingInboundItemId(null);
    setInboundItemDraft(null);
  };

  return {
    inboundItemsQuery: itemsQuery,
    editingInboundItemId,
    inboundItemDraft,
    setInboundItemDraft,
    saveInboundItem,
    deleteInboundItem,
    startNewInboundItem,
    startEditingInboundItem,
    cancelEditingInboundItem,
    actionPending,
  };
}

export function useWarehouseInventoryLookup() {
  return useQuery({
    queryKey: WAREHOUSE_INVENTORY_LOOKUP_KEY,
    queryFn: async () => {
      const response = await fetch("/api/product/inventory");
      if (!response.ok) {
        throw new Error("Failed to load inventory lookup");
      }

      return (await response.json()) as InventoryLookupRecord[];
    },
  });
}

export function useWarehouseAdjustments(): AdjustmentHook {
  const [editingAdjustment, setEditingAdjustment] = useState<AdjustmentRecord | null>(null);
  const adjustmentForm = useForm<AdjustmentFormValues, unknown, AdjustmentInput>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      adjustment_date: "",
      inv_code: "",
      adj_type: "IN",
      qty: 1,
      reason: WAREHOUSE_ADJUSTMENT_REASON_OPTIONS[0],
      notes: "",
      approved_by: "",
    },
  });
  const adjustmentModal = useModalState();
  const adjustmentsQuery = useQuery({
    queryKey: WAREHOUSE_ADJUSTMENT_KEY,
    queryFn: warehouseApi.adjustments.list,
  });
  const invalidate = useBaseMutation([
    WAREHOUSE_ADJUSTMENT_KEY,
    WAREHOUSE_STOCK_BALANCE_KEY,
    WAREHOUSE_STOCK_MOVEMENT_KEY,
  ]);

  const saveAdjustment = async (values: AdjustmentInput) => {
    try {
      const action = editingAdjustment
        ? warehouseApi.adjustments.update(editingAdjustment.id, values)
        : warehouseApi.adjustments.create(values);

      await action;
      toast.success(`Adjustment ${editingAdjustment ? "updated" : "created"}`);
      await invalidate();
      setEditingAdjustment(null);
      adjustmentModal.closeModal();
      adjustmentForm.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save adjustment");
      throw error;
    }
  };

  const deleteAdjustment = async (id: string) => {
    try {
      await warehouseApi.adjustments.remove(id);
      toast.success("Adjustment deleted");
      await invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete adjustment");
      throw error;
    }
  };

  const openAdjustmentModal = (adjustment?: AdjustmentRecord) => {
    setEditingAdjustment(adjustment ?? null);
    adjustmentForm.reset({
      adjustment_date: toDateInput(adjustment?.adjustment_date),
      inv_code: adjustment?.inv_code ?? "",
      adj_type: (adjustment?.adj_type as "IN" | "OUT" | undefined) ?? "IN",
      qty: adjustment?.qty ?? 1,
      reason:
        (adjustment?.reason as (typeof WAREHOUSE_ADJUSTMENT_REASON_OPTIONS)[number] | undefined) ??
        WAREHOUSE_ADJUSTMENT_REASON_OPTIONS[0],
      notes: adjustment?.notes ?? "",
      approved_by: adjustment?.approved_by ?? "",
    });
    adjustmentModal.openModal();
  };

  return {
    adjustmentsQuery,
    adjustmentForm,
    adjustmentModal,
    editingAdjustment,
    openAdjustmentModal,
    saveAdjustment,
    deleteAdjustment,
  };
}

export function useWarehouseStockBalances() {
  return useQuery({
    queryKey: WAREHOUSE_STOCK_BALANCE_KEY,
    queryFn: warehouseApi.stock.balances,
  }) as UseQueryResult<StockBalanceRecord[]>;
}

export function useWarehouseStockMovements() {
  return useQuery({
    queryKey: WAREHOUSE_STOCK_MOVEMENT_KEY,
    queryFn: warehouseApi.stock.movements,
  }) as UseQueryResult<StockMovementRecord[]>;
}
