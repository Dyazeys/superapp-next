export type MpAdsBase = {
  id: string;
  date: string;
  produk: string;
  impression: number;
  click: number;
  ctr: number; // decimal (e.g. 0.023 = 2.3%)
  qty_buyer: number;
  qty_produk: number;
  omset: number;
  spent: number;
  roas: number; // ratio (e.g. 3.5)
  cancel_qty: number;
  cancel_omset: number;
  roas_fix: number; // ratio
  target_roas: number; // ratio
};

export type MpAdsShopee = MpAdsBase & {
  created_at: string | null;
  updated_at: string | null;
};

export type MpAdsTiktok = MpAdsBase & {
  created_at: string | null;
  updated_at: string | null;
};

export type MpAdsFormData = Omit<
  MpAdsBase,
  "id" | "created_at" | "updated_at"
>;

// ── Shopee Traffic ──────────────────────────────────────────

export type ShopeeTraffic = {
  id: string;
  date: string;
  region: string;
  gross_sales_usd: number;
  gross_sales_local: number;
  gross_sales_rebate_usd: number;
  gross_sales_rebate_local: number;
  gross_orders: number;
  gross_units_sold: number;
  gross_avg_basket_usd: number;
  gross_avg_basket_local: number;
  gross_item_per_order: number;
  gross_avg_selling_price_usd: number;
  gross_avg_selling_price_local: number;
  product_views: number;
  product_clicks: number;
  unique_visitors: number;
  gross_order_conversion_rate: number;
  gross_item_conversion_rate: number;
  created_at: string | null;
  updated_at: string | null;
};

export type ShopeeTrafficFormData = Omit<
  ShopeeTraffic,
  "id" | "created_at" | "updated_at"
>;

// ── Shopee Livestream ───────────────────────────────────────

export type ShopeeLivestream = {
  id: string;
  date: string;
  sesi: string;
  pengunjung: number;
  penonton_terbanyak: number;
  rata_durasi_menonton: string; // format HH:MM:SS
  pesanan: number;
  penjualan: number;
  created_at: string | null;
  updated_at: string | null;
};

export type ShopeeLivestreamFormData = Omit<
  ShopeeLivestream,
  "id" | "created_at" | "updated_at"
>;

// ── TikTok Traffic ─────────────────────────────────────────

export type TikTokTraffic = {
  id: string;
  date: string;
  gross_merchandise_value: number;
  refund_amount: number;
  gross_revenue_platform_subsidy: number;
  products_sold: number;
  buyers: number;
  page_views: number;
  store_visits: number;
  sku_orders: number;
  orders: number;
  conversion_rate: number;
  product_impressions: number;
  unique_product_impressions: number;
  product_clicks: number;
  unique_clicks: number;
  aov: number;
  created_at: string | null;
  updated_at: string | null;
};

export type TikTokTrafficFormData = Omit<
  TikTokTraffic,
  "id" | "created_at" | "updated_at"
>;

// ── TikTok Livestream ──────────────────────────────────────

export type TikTokLivestream = {
  id: string;
  date: string;
  sesi: string;
  impressions: number;
  views: number;
  product_clicks: number;
  pesanan: number;
  penjualan: number;
  created_at: string | null;
  updated_at: string | null;
};

export type TikTokLivestreamFormData = Omit<
  TikTokLivestream,
  "id" | "created_at" | "updated_at"
>;
