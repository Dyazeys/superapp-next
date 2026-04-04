export type ChannelLookupRecord = {
  channel_id: number;
  channel_name: string;
  slug: string | null;
  is_marketplace: boolean;
};

export type SalesCustomerRecord = {
  customer_id: number;
  customer_name: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  _count?: {
    t_order?: number;
  };
  metrics?: {
    total_revenue: string;
  };
};

export type SalesOrderRecord = {
  order_no: string;
  order_date: string;
  ref_no: string | null;
  parent_order_no: string | null;
  channel_id: number | null;
  customer_id: number | null;
  total_amount: string;
  status: string;
  is_historical: boolean;
  created_at: string;
  updated_at: string;
  m_channel?: ChannelLookupRecord | null;
  master_customer?: Pick<SalesCustomerRecord, "customer_id" | "customer_name" | "is_active"> | null;
  _count?: {
    t_order_item?: number;
  };
};

export type SalesOrderItemRecord = {
  id: number;
  order_no: string | null;
  sku: string | null;
  qty: number;
  unit_price: string;
  discount_item: string;
  created_at: string;
  master_product?: {
    sku: string;
    product_name: string;
  } | null;
};
