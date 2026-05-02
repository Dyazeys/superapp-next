import { z } from "zod";

/**
 * Schema dasar untuk data iklan marketplace (Shopee / TikTok).
 */
export const mpAdsFormSchema = z.object({
  date: z
    .string()
    .min(1, "Tanggal wajib diisi.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD."),
  produk: z
    .string()
    .min(1, "Nama produk wajib diisi.")
    .max(200, "Nama produk maksimal 200 karakter."),
  impression: z.coerce.number().min(0, "Tidak boleh negatif."),
  click: z.coerce.number().min(0, "Tidak boleh negatif."),
  ctr: z.coerce.number().min(0, "Tidak boleh negatif."),
  qty_buyer: z.coerce.number().int("Harus bilangan bulat.").min(0, "Tidak boleh negatif."),
  qty_produk: z.coerce.number().int("Harus bilangan bulat.").min(0, "Tidak boleh negatif."),
  omset: z.coerce.number().min(0, "Tidak boleh negatif."),
  spent: z.coerce.number().min(0, "Tidak boleh negatif."),
  roas: z.coerce.number().min(0, "Tidak boleh negatif."),
  cancel_qty: z.coerce.number().int("Harus bilangan bulat.").min(0, "Tidak boleh negatif."),
  cancel_omset: z.coerce.number().min(0, "Tidak boleh negatif."),
  roas_fix: z.coerce.number().min(0, "Tidak boleh negatif."),
  target_roas: z.coerce.number().min(0, "Tidak boleh negatif."),
});

export const mpAdsFormCreateSchema = mpAdsFormSchema;
export const mpAdsFormUpdateSchema = mpAdsFormSchema.partial();

export type MpAdsFormInput = z.infer<typeof mpAdsFormSchema>;
export type MpAdsFormUpdateInput = z.infer<typeof mpAdsFormUpdateSchema>;

// ── Shopee Traffic ──────────────────────────────────────────

export const shopeeTrafficFormSchema = z.object({
  date: z
    .string()
    .min(1, "Tanggal wajib diisi.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD."),
  region: z
    .string()
    .min(1, "Region wajib diisi.")
    .max(50, "Region maksimal 50 karakter."),
  gross_sales_usd: z.coerce.number().min(0, "Tidak boleh negatif."),
  gross_sales_local: z.coerce.number().min(0, "Tidak boleh negatif."),
  gross_sales_rebate_usd: z.coerce.number().min(0, "Tidak boleh negatif."),
  gross_sales_rebate_local: z.coerce.number().min(0, "Tidak boleh negatif."),
  gross_orders: z.coerce.number().int("Harus bilangan bulat.").min(0, "Tidak boleh negatif."),
  gross_units_sold: z.coerce.number().int("Harus bilangan bulat.").min(0, "Tidak boleh negatif."),
  gross_avg_basket_usd: z.coerce.number().min(0, "Tidak boleh negatif."),
  gross_avg_basket_local: z.coerce.number().min(0, "Tidak boleh negatif."),
  gross_item_per_order: z.coerce.number().min(0, "Tidak boleh negatif."),
  gross_avg_selling_price_usd: z.coerce.number().min(0, "Tidak boleh negatif."),
  gross_avg_selling_price_local: z.coerce.number().min(0, "Tidak boleh negatif."),
  product_views: z.coerce.number().int("Harus bilangan bulat.").min(0, "Tidak boleh negatif."),
  product_clicks: z.coerce.number().int("Harus bilangan bulat.").min(0, "Tidak boleh negatif."),
  unique_visitors: z.coerce.number().int("Harus bilangan bulat.").min(0, "Tidak boleh negatif."),
  gross_order_conversion_rate: z.coerce.number().min(0, "Tidak boleh negatif."),
  gross_item_conversion_rate: z.coerce.number().min(0, "Tidak boleh negatif."),
});

export const shopeeTrafficFormCreateSchema = shopeeTrafficFormSchema;
export const shopeeTrafficFormUpdateSchema = shopeeTrafficFormSchema.partial();

// ── Shopee Livestream ───────────────────────────────────────

export const shopeeLivestreamFormSchema = z.object({
  date: z
    .string()
    .min(1, "Tanggal wajib diisi.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD."),
  sesi: z
    .string()
    .min(1, "Sesi wajib diisi.")
    .max(50, "Sesi maksimal 50 karakter."),
  pengunjung: z.coerce.number().int("Harus bilangan bulat.").min(0, "Tidak boleh negatif."),
  penonton_terbanyak: z.coerce.number().int("Harus bilangan bulat.").min(0, "Tidak boleh negatif."),
  rata_durasi_menonton: z
    .string()
    .min(1, "Durasi wajib diisi.")
    .regex(/^\d{2}:\d{2}:\d{2}$/, "Format durasi harus HH:MM:SS."),
  pesanan: z.coerce.number().int("Harus bilangan bulat.").min(0, "Tidak boleh negatif."),
  penjualan: z.coerce.number().min(0, "Tidak boleh negatif."),
});

export const shopeeLivestreamFormCreateSchema = shopeeLivestreamFormSchema;
export const shopeeLivestreamFormUpdateSchema = shopeeLivestreamFormSchema.partial();

// ── TikTok Traffic ──────────────────────────────────────────

export const tiktokTrafficFormSchema = z.object({
  date: z
    .string()
    .min(1, "Tanggal wajib diisi.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD."),
  gross_merchandise_value: z.coerce.number().min(0, "Tidak boleh negatif."),
  refund_amount: z.coerce.number().min(0, "Tidak boleh negatif."),
  gross_revenue_platform_subsidy: z.coerce.number().min(0, "Tidak boleh negatif."),
  products_sold: z.coerce.number().int("Harus bilangan bulat.").min(0, "Tidak boleh negatif."),
  buyers: z.coerce.number().int("Harus bilangan bulat.").min(0, "Tidak boleh negatif."),
  page_views: z.coerce.number().int("Harus bilangan bulat.").min(0, "Tidak boleh negatif."),
  store_visits: z.coerce.number().int("Harus bilangan bulat.").min(0, "Tidak boleh negatif."),
  sku_orders: z.coerce.number().int("Harus bilangan bulat.").min(0, "Tidak boleh negatif."),
  orders: z.coerce.number().int("Harus bilangan bulat.").min(0, "Tidak boleh negatif."),
  conversion_rate: z.coerce.number().min(0, "Tidak boleh negatif."),
});

export const tiktokTrafficFormCreateSchema = tiktokTrafficFormSchema;
export const tiktokTrafficFormUpdateSchema = tiktokTrafficFormSchema.partial();

// ── TikTok Livestream ───────────────────────────────────────

export const tiktokLivestreamFormSchema = z.object({
  date: z
    .string()
    .min(1, "Tanggal wajib diisi.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD."),
  sesi: z
    .string()
    .min(1, "Sesi wajib diisi.")
    .max(50, "Sesi maksimal 50 karakter."),
  impressions: z.coerce.number().int("Harus bilangan bulat.").min(0, "Tidak boleh negatif."),
  views: z.coerce.number().int("Harus bilangan bulat.").min(0, "Tidak boleh negatif."),
  product_clicks: z.coerce.number().int("Harus bilangan bulat.").min(0, "Tidak boleh negatif."),
  pesanan: z.coerce.number().int("Harus bilangan bulat.").min(0, "Tidak boleh negatif."),
  penjualan: z.coerce.number().min(0, "Tidak boleh negatif."),
});

export const tiktokLivestreamFormCreateSchema = tiktokLivestreamFormSchema;
export const tiktokLivestreamFormUpdateSchema = tiktokLivestreamFormSchema.partial();
