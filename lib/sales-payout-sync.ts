import { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/**
 * Mapping payout_status → sales_order status
 * Canonical payout status: SETTLED | FAILED
 *   "SETTLED"   → "SUKSES"
 *   "FAILED"    → "RETUR"
 *   lainnya     → "PICKUP"
 */
function payoutStatusToSalesStatus(payoutStatus: string | null | undefined): string {
  const normalized = (payoutStatus ?? "").toUpperCase();
  if (normalized === "SETTLED") return "SUKSES";
  if (normalized === "FAILED") return "RETUR";
  return "PICKUP";
}

/**
 * Sync status sales_order berdasarkan ref_no dari payout.
 * Dipanggil dalam transaction yang sama dengan create/update payout.
 */
export async function syncSalesStatusFromPayout(
  tx: Tx,
  ref: string | null | undefined,
  payoutStatus: string | null | undefined,
): Promise<void> {
  if (!ref) return;

  const newSalesStatus = payoutStatusToSalesStatus(payoutStatus);

  await tx.t_order.updateMany({
    where: { ref_no: ref },
    data: { status: newSalesStatus },
  });
}