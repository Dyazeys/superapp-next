import { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/**
 * Sync status sales_order berdasarkan ref_no dari payout.
 * Dipanggil dalam transaction yang sama dengan create/update payout.
 *
 * Aturan:
 *   SETTLED → SUKSES hanya jika order masih PICKUP
 *   FAILED  → TIDAK ubah status (hanya info, warehouse yang kontrol return)
 */
export async function syncSalesStatusFromPayout(
  tx: Tx,
  ref: string | null | undefined,
  payoutStatus: string | null | undefined,
): Promise<void> {
  if (!ref) return;

  const normalized = (payoutStatus ?? "").toUpperCase();

  if (normalized === "FAILED") return;

  if (normalized === "SETTLED") {
    const order = await tx.t_order.findUnique({
      where: { ref_no: ref },
      select: { status: true },
    });
    if (order && order.status === "PICKUP") {
      await tx.t_order.updateMany({
        where: { ref_no: ref },
        data: { status: "SUKSES" },
      });
    }
    return;
  }
}
