import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { z } from "zod";
import { mpAdsDraftSchema } from "@/schemas/marketing-module";

/**
 * Mock data Iklan MP — bersifat read-only (stub).
 * Belum ada koneksi ke database.
 */
const MOCK_ADS = [
  {
    id: "1",
    date: "2026-04-28",
    produk: "Serum Wajah Brightening 30ml",
    impression: 12500,
    click: 380,
    ctr: 0.0304,
    qty_buyer: 24,
    qty_produk: 31,
    omset: 6200000,
    spent: 850000,
    roas: 7.29,
    cancel_qty: 2,
    cancel_omset: 400000,
    roas_fix: 6.82,
    target_roas: 5.0,
  },
  {
    id: "2",
    date: "2026-04-28",
    produk: "Toner Face Wash 100ml",
    impression: 8700,
    click: 215,
    ctr: 0.0247,
    qty_buyer: 15,
    qty_produk: 18,
    omset: 2700000,
    spent: 500000,
    roas: 5.4,
    cancel_qty: 1,
    cancel_omset: 150000,
    roas_fix: 5.1,
    target_roas: 4.0,
  },
  {
    id: "3",
    date: "2026-04-29",
    produk: "Sunscreen SPF 50 50ml",
    impression: 18200,
    click: 520,
    ctr: 0.0286,
    qty_buyer: 42,
    qty_produk: 48,
    omset: 9600000,
    spent: 1200000,
    roas: 8.0,
    cancel_qty: 3,
    cancel_omset: 600000,
    roas_fix: 7.5,
    target_roas: 5.0,
  },
  {
    id: "4",
    date: "2026-04-29",
    produk: "Moisturizer Gel 50gr",
    impression: 6300,
    click: 140,
    ctr: 0.0222,
    qty_buyer: 8,
    qty_produk: 10,
    omset: 1800000,
    spent: 350000,
    roas: 5.14,
    cancel_qty: 1,
    cancel_omset: 180000,
    roas_fix: 4.63,
    target_roas: 4.0,
  },
  {
    id: "5",
    date: "2026-04-30",
    produk: "Serum Wajah Brightening 30ml",
    impression: 9800,
    click: 290,
    ctr: 0.0296,
    qty_buyer: 18,
    qty_produk: 22,
    omset: 4400000,
    spent: 700000,
    roas: 6.29,
    cancel_qty: 1,
    cancel_omset: 200000,
    roas_fix: 6.0,
    target_roas: 5.0,
  },
];

/** Schema untuk validasi array MpAdsDraft. */
const mpAdsArraySchema = z.array(mpAdsDraftSchema);

export async function GET() {
  try {
    // Validasi mock data terhadap schema agar contract enforced di layer API
    const parsed = mpAdsArraySchema.safeParse(MOCK_ADS);

    if (!parsed.success) {
      // Mapping error zod ke format yang konsisten
      const issues = parsed.error.issues.map(
        (issue) => `[${issue.path.join(".")}] ${issue.message}`
      );
      return NextResponse.json(
        { error: "Validasi data Iklan MP gagal.", details: issues },
        { status: 500 }
      );
    }

    // TODO: ganti dengan query database ketika tabel tersedia
    return NextResponse.json(toJsonValue(parsed.data));
  } catch (error) {
    return jsonError(error, "Failed to load MP Ads data.");
  }
}