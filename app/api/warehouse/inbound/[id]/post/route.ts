import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { recalculatePurchaseOrderStatus } from "@/lib/warehouse-po-status";
import { syncInboundItemMovement } from "@/lib/warehouse-stock";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.WAREHOUSE_INBOUND_POST);

    const { id } = await params;

    const inbound = await prisma.$transaction(async (tx) => {
      const current = await tx.inbound_deliveries.findUnique({
        where: { id },
        select: { id: true, po_id: true, qc_status: true },
      });
      invariant(current, "Inbound delivery was not found.");
      invariant(current.qc_status === "PENDING", "Inbound is already posted.");

      if (current.po_id) {
        const purchaseOrder = await tx.purchase_orders.findUnique({
          where: { id: current.po_id },
          select: { id: true, status: true },
        });
        invariant(purchaseOrder, "Purchase order was not found.");
        invariant(purchaseOrder.status !== "CLOSED", "PO is closed and cannot receive additional stock.");
      }

      const items = await tx.inbound_items.findMany({
        where: { inbound_id: id },
        select: { id: true, qty_received: true, qty_passed_qc: true, qty_rejected_qc: true },
      });
      invariant(items.length > 0, "Inbound has no items to post.");

      const hasUnfinalizedQc = items.some(
        (item) => Number(item.qty_passed_qc) + Number(item.qty_rejected_qc) !== Number(item.qty_received)
      );
      invariant(
        !hasUnfinalizedQc,
        "QC belum final. Pastikan setiap item: qty passed + qty rejected = qty received, lalu simpan itemnya."
      );

      const totalPassed = items.reduce((sum, item) => sum + Number(item.qty_passed_qc || 0), 0);
      const totalRejected = items.reduce((sum, item) => sum + Number(item.qty_rejected_qc || 0), 0);
      const totalReceived = items.reduce((sum, item) => sum + Number(item.qty_received || 0), 0);
      invariant(
        totalPassed > 0 || totalRejected > 0,
        `Inbound belum punya hasil QC tersimpan (qty received: ${totalReceived}, passed: ${totalPassed}, rejected: ${totalRejected}). Kalau sudah isi di form, klik save per item dulu lalu post lagi.`
      );

      for (const item of items) {
        await syncInboundItemMovement(tx, item.id);
      }

      const posted = await tx.inbound_deliveries.update({
        where: { id },
        data: { qc_status: totalPassed > 0 ? "PASSED" : "FAILED" },
      });

      if (current.po_id) {
        await recalculatePurchaseOrderStatus(tx, current.po_id);
      }

      return posted;
    });

    return NextResponse.json(toJsonValue(inbound));
  } catch (error) {
    return jsonError(error, "Failed to post inbound.");
  }
}
