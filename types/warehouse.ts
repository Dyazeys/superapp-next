export type VendorRecord = {
  vendor_code: string;
  vendor_name: string;
  pic_name: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  _count?: {
    purchase_orders?: number;
  };
};

export type PurchaseOrderRecord = {
  id: string;
  po_number: string;
  vendor_code: string;
  order_date: string;
  status: string;
  created_at: string;
  updated_at: string | null;
  master_vendor?: VendorRecord | null;
  purchase_order_items?: PurchaseOrderItemRecord[];
  _count?: {
    inbound_deliveries?: number;
    purchase_order_items?: number;
  };
};

export type PurchaseOrderItemRecord = {
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
  po_qty_ordered_total?: number;
  po_qty_received_total?: number;
  po_qty_passed_total?: number;
  po_qty_rejected_total?: number;
  po_qty_remaining_total?: number;
  po_fulfillment_status?: "OPEN" | "PARTIAL" | "CLOSED";
};

export type InboundDeliveryRecord = {
  id: string;
  po_id: string | null;
  receive_date: string;
  surat_jalan_vendor: string | null;
  qc_status: string;
  received_by: string;
  notes: string | null;
  created_at: string;
  purchase_orders?: PurchaseOrderRecord | null;
  _count?: {
    inbound_items?: number;
    returns?: number;
  };
};

export type InboundItemRecord = {
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
};

export type AdjustmentRecord = {
  id: string;
  adjustment_date: string;
  inv_code: string;
  adj_type: string;
  post_status: string;
  posted_at: string | null;
  qty: number;
  reason: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  master_inventory?: {
    inv_code: string;
    inv_name: string;
  } | null;
};

export type StockBalanceRecord = {
  inv_code: string;
  qty_on_hand: number;
  last_updated: string;
  master_inventory?: {
    inv_code: string;
    inv_name: string;
    unit_price: string;
    is_active: boolean;
  } | null;
};

export type StockMovementRecord = {
  id: string;
  movement_date: string;
  inv_code: string;
  reference_type: string;
  reference_id: string;
  sale_reference?: {
    item_id: number;
    order_no: string | null;
    sku: string | null;
  } | null;
  qty_change: number;
  running_balance: number;
  notes: string | null;
  created_at: string;
  master_inventory?: {
    inv_code: string;
    inv_name: string;
  } | null;
};
