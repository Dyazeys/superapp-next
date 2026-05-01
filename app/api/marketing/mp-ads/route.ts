import { NextResponse } from "next/server";
import type { MpAdsDraft } from "@/types/marketing";
import { mpAdsDraftSchema } from "@/schemas/marketing-module";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";

/**
 * GET /api/marketing/mp-ads
 * Read-only stub — mengembalikan mock data Iklan MP.
 * Belum ada akses DB; gunakan endpoint ini setelah migrasi siap.
 */
export async function GET() {
  try {
    // Mock data 5 baris sesuai spek MpAdsDraft
    const mockData: MpAdsDraft[] = [
      {
        id: "mock-001",
        date: "2026-04-28",
        produk: "Sabun Cair 250ml",
        impression: 12500,
        click: 380,
        ctr: 0.0304,
        qty_buyer: 24,
        qty_produk: 36,
        omset: 1872000,
        spent: 256000,
        roas: 7.31,
        cancel_qty: 2,
        cancel_omset: 104000,
        roas_fix: 6.90,
        target_roas: 5.0,
      },
      {
        id: "mock-002",
        date: "2026-04-28",
        produk: "Shampoo Sachet 12ml",
        impression: 28400,
        click: 720,
        ctr: 0.0254,
        qty_buyer: 87,
        qty_produk: 240,
        omset: 960000,
        spent: 185000,
        roas: 5.19,
        cancel_qty: 5,
        cancel_omset: 20000,
        roas_fix: 5.08,
        target_roas: 4.0,
      },
      {
        id: "mock-003",
        date: "2026-04-29",
        produk: "Sabun Cair 250ml",
        impression: 13200,
        click: 410,
        ctr: 0.0311,
        qty_buyer: 28,
        qty_produk: 42,
        omset: 2184000,
        spent: 275000,
        roas: 7.94,
        cancel_qty: 1,
        cancel_omset: 52000,
        roas_fix: 7.75,
        target_roas: 5.0,
      },
      {
        id: "mock-004",
        date: "2026-04-29",
        produk: "Pelembab Wajah 50ml",
        impression: 8900,
        click: 295,
        ctr: 0.0331,
        qty_buyer: 15,
        qty_produk: 18,
        omset: 3150000,
        spent: 320000,
        roas: 9.84,
        cancel_qty: 0,
        cancel_omset: 0,
        roas_fix: 9.84,
        target_roas: 6.0,
      },
      {
        id: "mock-005",
        date: "2026-04-30",
        produk: "Shampoo Sachet 12ml",
        impression: 15100,
        click: 390,
        ctr: 0.0258,
        qty_buyer: 42,
        qty_produk: 120,
        omset: 480000,
        spent: 98000,
        roas: 4.90,
        cancel_qty: 3,
        cancel_omset: 12000,
        roas_fix: 4.78,
        target_roas: 4.0,
      },
    ];

    // Validasi shape response konsisten dengan schema
    const parsed = mpAdsDraftSchema.array().parse(mockData);

    return NextResponse.json(toJsonValue(parsed));
  } catch (error) {
    return jsonError(error, "Failed to load MP Ads data.");
  }
}