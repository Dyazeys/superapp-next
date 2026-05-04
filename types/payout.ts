export type PayoutChannelRecord = {
  channel_id: number;
  channel_name: string;
  slug: string | null;
  is_marketplace: boolean;
};

export type PayoutBankAccountRecord = {
  id: string;
  code: string;
  name: string;
  normal_balance: string;
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
  fee_affiliate: string;
  shipping_cost: string;
  omset: string;
  payout_status: string | null;
  post_status: string;
  posted_at: string | null;
  locked_at: string | null;
  voided_at: string | null;
  created_at: string;
  t_order?: PayoutOrderLookupRecord | null;
};

export type PayoutTransferRecord = {
  id: string;
  payout_id: number;
  transfer_date: string;
  amount: string;
  bank_account_id: string;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  t_payout?: PayoutRecord | null;
  accounts?: PayoutBankAccountRecord | null;
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
  post_status: string;
  posted_at: string | null;
  locked_at: string | null;
  voided_at: string | null;
  created_at: string;
  m_channel?: PayoutChannelRecord | null;
  t_order?: PayoutOrderLookupRecord | null;
};

export type PayoutReconciliationChannelRecord = {
  channel_id: number;
  channel_name: string;
  slug: string | null;
  is_marketplace: boolean;
  category_name: string | null;
  group_name: string | null;
  piutang_account_id: string | null;
  piutang_account_code: string | null;
  piutang_account_name: string | null;
  saldo_account_id: string | null;
  saldo_account_code: string | null;
  saldo_account_name: string | null;
  total_piutang: string;
  total_sales_receivable_posted: string;
  total_payout_settlement_posted: string;
  sales_receivable_vs_payout_settlement_diff: string;
  total_saldo: string;
  total_bank_transfer: string;
  saldo_vs_bank_transfer_diff: string;
  payout_count: number;
  transfer_count: number;
  mismatch_status: "MATCHED" | "EXPECTED" | "ERROR";
  mismatch_areas: string[];
  mismatches: PayoutReconciliationMismatch[];
  ref_breakdowns: PayoutReconciliationRefBreakdown[];
};

export type PayoutReconciliationMismatch = {
  area: "PIUTANG_VS_PAYOUT" | "SALDO_VS_BANK_TRANSFER" | "MAPPING";
  category: "EXPECTED" | "ERROR";
  rule_code:
    | "PIUTANG_GT_PAYOUT_OUTSTANDING"
    | "PIUTANG_LT_PAYOUT_INCONSISTENT"
    | "SALDO_GT_TRANSFER_PENDING_WITHDRAWAL"
    | "SALDO_LT_TRANSFER_INCONSISTENT"
    | "MISSING_PIUTANG_ACCOUNT"
    | "MISSING_SALDO_ACCOUNT"
    | "NEGATIVE_PIUTANG"
    | "NEGATIVE_PAYOUT"
    | "NEGATIVE_SALDO"
    | "NEGATIVE_TRANSFER"
    | "CHANNEL_REQUIRES_PIUTANG"
    | "CHANNEL_REQUIRES_SALDO";
  message: string;
};

export type PayoutReconciliationRefBreakdown = {
  ref: string;
  sales_posted: string;
  payout_posted: string;
  delta: string;
};

export type PayoutReconciliationReport = {
  rules: {
    area: "PIUTANG_VS_PAYOUT" | "SALDO_VS_BANK_TRANSFER" | "MAPPING";
    category: "EXPECTED" | "ERROR";
    rule_code: string;
    description: string;
  }[];
  summary: {
    channel_count: number;
    mismatched_channel_count: number;
    expected_channel_count: number;
    error_channel_count: number;
    payout_without_channel_count: number;
    payout_without_channel_amount: string;
    transfer_without_channel_count: number;
    transfer_without_channel_amount: string;
  };
  channels: PayoutReconciliationChannelRecord[];
};

export type PayoutReconciliationPeriodPreset = "all" | "this_month" | "custom";

export type PayoutReconciliationFilter = {
  period: PayoutReconciliationPeriodPreset;
  fromDate?: string;
  toDate?: string;
};
