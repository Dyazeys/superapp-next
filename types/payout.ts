export type PayoutChannelRecord = {
  channel_id: number;
  channel_name: string;
  slug: string | null;
  is_marketplace: boolean;
};

export type PayoutOrderLookupRecord = {
  order_no: string;
  order_date: string;
  ref_no: string | null;
  total_amount: string;
  status: string;
  channel_id: number | null;
  m_channel?: PayoutChannelRecord | null;
};

export type PayoutRecord = {
  payout_id: number;
  ref: string | null;
  payout_date: string;
  qty_produk: number;
  hpp: string;
  total_price: string;
  seller_discount: string;
  fee_admin: string;
  fee_service: string;
  fee_order_process: string;
  fee_program: string;
  fee_transaction: string;
  fee_affiliate: string;
  shipping_cost: string;
  omset: string;
  payout_status: string | null;
  created_at: string;
  t_order?: PayoutOrderLookupRecord | null;
};

export type PayoutAdjustmentRecord = {
  adjustment_id: number;
  ref: string | null;
  payout_date: string;
  adjustment_date: string | null;
  channel_id: number | null;
  adjustment_type: string | null;
  reason: string | null;
  amount: string;
  created_at: string;
  m_channel?: PayoutChannelRecord | null;
  t_order?: PayoutOrderLookupRecord | null;
};
