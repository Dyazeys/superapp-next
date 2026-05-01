// --- Sales Return Candidate ---
export interface SalesReturnCandidateItem {
  sku: string;
  sku_name: string;
  product_name: string;
  inv_code: string;
  inv_name: string;
  qty: number;
}

export interface SalesReturnCandidate {
  ref_no: string;
  order_no: string;
  order_date: string;
  channel_id: number | null;
  channel_name: string | null;
  status: string;
  items: SalesReturnCandidateItem[];
}

// --- Warehouse Return ---
export type WarehouseReturnStatus = "PENDING" | "RECEIVED_GOOD" | "RECEIVED_DAMAGED";

export interface WarehouseReturnItem {
  id: string;
  warehouse_return_id: string;
  sku: string;
  inv_code: string;
  qty_returned: number;
  qty_good: number | null;
  qty_damaged: number | null;
  unit_cost: string | null;
  notes: string | null;
  created_at: string;
  master_product?: {
    sku: string;
    sku_name: string;
    product_name: string;
  } | null;
  master_inventory?: {
    inv_code: string;
    inv_name: string;
  } | null;
}

export interface WarehouseReturn {
  id: string;
  ref_no: string;
  return_date: string;
  status: WarehouseReturnStatus;
  verified_by: string;
  verified_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  return_items?: WarehouseReturnItem[];
  t_order?: {
    order_no: string;
    channel_id: number | null;
    status: string;
  } | null;
}

// --- Form Draft ---
export interface WarehouseReturnDraft {
  refNo: string;
  returnDate: string;
  verifiedBy: string;
  notes: string;
  orderRef: string;
}

export interface WarehouseReturnItemDraft {
  sku: string;
  invCode: string;
  qtyReturned: number;
  qtyGood: number;
  qtyDamaged: number;
  unitCost: number;
  notes: string;
}

// --- Order Candidate ---
export interface OrderReturnCandidate {
  orderNo: string;
  refNo: string;
  orderDate: string;
  customerName: string;
  channelName: string;
  status: string;
}

export interface StockBalanceRecord {
  inv_code: string;
  inv_name: string;
  qty_on_hand: number;
  is_active: boolean;
  last_updated: string;
  master_inventory?: {
    inv_name: string;
    unit_price: string | null;
  } | null;
}

// Existing types for adjustments, stock movements, etc.
export interface AdjustmentRecord {
  id: string;
  adjustment_date: string;
  inv_code: string;
  adj_type: "IN" | "OUT";
  post_status: string;
  qty: number;
  reason: string;
  notes: string | null;
  created_by: string | null;
  master_inventory?: {
    inv_code: string;
    inv_name: string;
  } | null;
}

export interface StockMovementRecord {
  id: string;
  inv_code: string;
  movement_date: string;
  qty_change: number;
  running_balance: number;
  reference_type: string;
  reference_id: string;
  notes: string | null;
  created_at: string;
  master_inventory?: {
    inv_code: string;
    inv_name: string;
  } | null;
  sale_reference?: {
    order_no: string;
    item_id: string;
    sku: string;
  } | null;
}

export interface InventoryRecord {
  inv_code: string;
  inv_name: string;
  current_stock: number;
  is_active: boolean;
}

export interface VendorRecord {
  vendor_code: string;
  vendor_name: string;
  pic_name: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  _count?: {
    purchase_orders: number;
  };
}

export interface PurchaseOrderRecord {
  id: string;
  po_number: string;
  vendor_code: string;
  order_date: string;
  status: string;
  created_at: string;
  master_vendor?: {
    vendor_code: string;
    vendor_name: string;
  } | null;
  purchase_order_items?: PurchaseOrderItemRecord[];
  _count?: {
    inbound_deliveries: number;
  };
}

export interface PurchaseOrderItemRecord {
  id: string;
  po_id: string;
  inv_code: string;
  qty_ordered: number;
  unit_cost: string | null;
  created_at: string;
  master_inventory?: {
    inv_code: string;
    inv_name: string;
  } | null;
  // Aggregated fields from API (per SKU summary)
  po_qty_ordered_total?: number;
  po_qty_received_total?: number;
}

export interface InboundDeliveryRecord {
  id: string;
  po_id: string | null;
  receive_date: string;
  surat_jalan_vendor: string | null;
  qc_status: string;
  received_by: string;
  notes: string | null;
  created_at: string;
  purchase_order?: PurchaseOrderRecord | null;
  purchase_orders?: PurchaseOrderRecord | null;
  inbound_items?: InboundItemRecord[];
  _count?: {
    inbound_items: number;
  };
}

export interface InboundItemRecord {
  id: string;
  inbound_id: string;
  inv_code: string;
  qty_received: number;
  qty_passed_qc: number;
  qty_rejected_qc: number;
  unit_cost: string | null;
  created_at: string;
  master_inventory?: {
    inv_code: string;
    inv_name: string;
  } | null;
}