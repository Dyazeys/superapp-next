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
  _count?: {
    inbound_deliveries?: number;
  };
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
  qty: number;
  reason: string;
  approved_by: string | null;
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
    hpp: string;
    is_active: boolean;
  } | null;
};

export type StockMovementRecord = {
  id: string;
  movement_date: string;
  inv_code: string;
  reference_type: string;
  reference_id: string;
  qty_change: number;
  running_balance: number;
  notes: string | null;
  created_at: string;
  master_inventory?: {
    inv_code: string;
    inv_name: string;
  } | null;
};
