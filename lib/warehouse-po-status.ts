import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export async function recalculatePurchaseOrderStatus(tx: Tx, poId: string) {
  const purchaseOrder = await tx.purchase_orders.findUnique({
    where: { id: poId },
    select: { id: true },
  });
  if (!purchaseOrder) {
    return;
  }

  const ordered = await tx.purchase_order_items.aggregate({
    where: { po_id: poId },
    _sum: { qty_ordered: true },
  });

  const orderedQty = Number(ordered._sum.qty_ordered ?? 0);
  if (orderedQty <= 0) {
    await tx.purchase_orders.update({
      where: { id: poId },
      data: { status: "OPEN" },
    });
    return;
  }

  const receivedRows = await tx.inbound_items.findMany({
    where: {
      inbound_deliveries: {
        po_id: poId,
        qc_status: "PASSED",
      },
    },
    select: {
      qty_passed_qc: true,
    },
  });

  const receivedQty = receivedRows.reduce((sum, row) => sum + Number(row.qty_passed_qc ?? 0), 0);

  const nextStatus = receivedQty <= 0 ? "OPEN" : receivedQty < orderedQty ? "PARTIAL" : "CLOSED";

  await tx.purchase_orders.update({
    where: { id: poId },
    data: { status: nextStatus },
  });
}
