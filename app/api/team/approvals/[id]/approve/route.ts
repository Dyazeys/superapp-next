import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { invariant, jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";
import { syncOperationalExpenseJournal } from "@/lib/operational-expense-journal";
import {
  recalculateOperationalExpenseBarterTotal,
  syncOperationalExpenseBarterJournal,
} from "@/lib/operational-expense-barter";
import {
  syncOperationalExpenseBarterMovements,
  syncSalesOrderMovements,
  syncInboundItemMovement,
  syncAdjustmentMovement,
} from "@/lib/warehouse-stock";
import { syncSalesOrderJournals } from "@/lib/sales-journal";
import { recalculatePurchaseOrderStatus } from "@/lib/warehouse-po-status";

function approvalStatusForType(type: string): string {
  if (type === "leave") return "leader_approved";
  return "approved";
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.approvals.findUnique({ where: { id } });
    invariant(existing, "Approval not found.", 404);

    const LEADER_TYPES = ["sales_order", "inbound", "warehouse_adjustment", "leave"];
    const MANAGER_TYPES = ["opex", "opex_barter"];

    const requiredPermission = LEADER_TYPES.includes(existing.type)
      ? PERMISSIONS.TEAM_APPROVALS_LEADER_APPROVE
      : MANAGER_TYPES.includes(existing.type)
        ? PERMISSIONS.TEAM_APPROVALS_MANAGER_APPROVE
        : PERMISSIONS.TEAM_APPROVALS_LEADER_APPROVE;

    const session = await requireApiPermission(requiredPermission);

    const approval = await prisma.$transaction(async (tx) => {
      const newStatus = approvalStatusForType(existing.type);

      const updated = await tx.approvals.update({
        where: { id },
        data: {
          status: newStatus,
          decided_by: body.decided_by ?? session.user.id,
          decision_note: body.decision_note ?? null,
          decided_at: new Date(),
          updated_at: new Date(),
        },
      });

      switch (existing.type) {
        case "leave": {
          await tx.leave_requests.update({
            where: { id: existing.source_id },
            data: {
              status: "leader_approved",
              leader_approved_at: new Date(),
              leader_approved_by: session.user.id,
              updated_at: new Date(),
            },
          });
          break;
        }

        case "opex": {
          const opex = await tx.operational_expenses.findUnique({
            where: { id: existing.source_id },
          });
          invariant(opex, "Operational expense not found.", 404);
          invariant(opex.status === "DRAFT", "Only draft opex can be posted.");
          invariant(opex.payment_account_id, "Payment account is required before posting opex.");
          invariant(Number(opex.amount) > 0, "Amount must be greater than zero before posting opex.");

          await tx.operational_expenses.update({
            where: { id: existing.source_id },
            data: {
              status: "POSTED",
              posted_at: new Date(),
              voided_at: null,
              updated_at: new Date(),
            },
          });
          await syncOperationalExpenseJournal(tx, existing.source_id, session.user.username);
          break;
        }

        case "opex_barter": {
          const barter = await tx.operational_expense_barter.findUnique({
            where: { id: existing.source_id },
            include: {
              operational_expense_barter_items: {
                select: { inv_code: true, qty: true },
              },
            },
          });
          invariant(barter, "Operational expense barter not found.", 404);
          invariant(barter.status === "DRAFT", "Only draft barter can be posted.");
          invariant(
            barter.operational_expense_barter_items.length > 0,
            "Add at least one barter item before posting."
          );

          const itemTotals = new Map<string, number>();
          barter.operational_expense_barter_items.forEach((item) => {
            itemTotals.set(item.inv_code, (itemTotals.get(item.inv_code) ?? 0) + item.qty);
          });

          const invCodes = Array.from(itemTotals.keys());
          const inventories = await tx.master_inventory.findMany({
            where: { inv_code: { in: invCodes } },
            select: { inv_code: true, is_active: true },
          });
          const inventoryMap = new Map(inventories.map((r) => [r.inv_code, r]));

          for (const invCode of invCodes) {
            const inv = inventoryMap.get(invCode);
            invariant(inv, `Inventory ${invCode} was not found.`);
            invariant(inv.is_active, `Inventory ${invCode} is inactive.`);
          }

          const balances = await tx.stock_balances.findMany({
            where: { inv_code: { in: invCodes } },
            select: { inv_code: true, qty_on_hand: true },
          });
          const balanceMap = new Map(balances.map((r) => [r.inv_code, r.qty_on_hand]));

          for (const [invCode, qty] of itemTotals.entries()) {
            const qoh = balanceMap.get(invCode) ?? 0;
            invariant(qoh >= qty, `Stock ${invCode} is not sufficient. Qty on hand ${qoh}, requested ${qty}.`);
          }

          await recalculateOperationalExpenseBarterTotal(tx, existing.source_id);
          await tx.operational_expense_barter.update({
            where: { id: existing.source_id },
            data: {
              status: "POSTED",
              posted_at: new Date(),
              voided_at: null,
              updated_at: new Date(),
            },
          });
          await syncOperationalExpenseBarterMovements(tx, existing.source_id);
          await syncOperationalExpenseBarterJournal(tx, existing.source_id, session.user.username);
          break;
        }

        case "sales_order": {
          const order = await tx.t_order.findUnique({
            where: { order_no: existing.source_id },
            select: {
              order_no: true,
              is_historical: true,
              _count: { select: { t_order_item: true } },
            },
          });
          invariant(order, "Sales order not found.", 404);
          invariant(!order.is_historical, "Historical order tidak mem-posting stock.");
          invariant(order._count.t_order_item > 0, "Sales order belum punya item untuk diposting.");

          await syncSalesOrderMovements(tx, existing.source_id);
          await syncSalesOrderJournals(tx, existing.source_id, session.user.username);

          const [summary] = await tx.$queryRaw<
            Array<{
              tracked_item_count: bigint | number;
              posted_item_count: bigint | number;
              blocked_item_count: bigint | number;
            }>
          >`
            WITH item_metrics AS (
              SELECT
                i.id AS item_id,
                COUNT(DISTINCT b.inv_code)::bigint AS expected_component_count,
                COUNT(DISTINCT m.inv_code)::bigint AS posted_component_count
              FROM sales.t_order_item i
              LEFT JOIN product.product_bom b
                ON b.sku = i.sku
               AND b.is_active = true
               AND b.is_stock_tracked = true
               AND b.inv_code IS NOT NULL
              LEFT JOIN warehouse.stock_movements m
                ON m.reference_type = 'SALE'
               AND m.reference_id = i.id::text
              WHERE i.order_no = ${existing.source_id}
              GROUP BY i.id
            )
            SELECT
              COUNT(*)::bigint AS tracked_item_count,
              COUNT(*) FILTER (
                WHERE expected_component_count > 0
                  AND posted_component_count = expected_component_count
              )::bigint AS posted_item_count,
              COUNT(*) FILTER (
                WHERE expected_component_count <= 0
              )::bigint AS blocked_item_count
            FROM item_metrics
          `;

          const tracked = Number(summary?.tracked_item_count ?? 0);
          const posted = Number(summary?.posted_item_count ?? 0);
          const blocked = Number(summary?.blocked_item_count ?? 0);

          invariant(blocked === 0, `Posting diblok: ada ${blocked} item tanpa BOM stock-tracked aktif.`);
          invariant(posted === tracked, `Posting belum lengkap: ${posted}/${tracked} item berhasil diposting.`);
          break;
        }

        case "inbound": {
          const inbound = await tx.inbound_deliveries.findUnique({
            where: { id: existing.source_id },
            select: { id: true, po_id: true, qc_status: true },
          });
          invariant(inbound, "Inbound delivery not found.", 404);
          invariant(inbound.qc_status === "PENDING", "Inbound is already posted.");

          if (inbound.po_id) {
            const po = await tx.purchase_orders.findUnique({
              where: { id: inbound.po_id },
              select: { id: true, status: true },
            });
            invariant(po, "Purchase order not found.", 404);
            invariant(po.status !== "CLOSED", "PO is closed and cannot receive additional stock.");
          }

          const items = await tx.inbound_items.findMany({
            where: { inbound_id: existing.source_id },
            select: { id: true, qty_received: true, qty_passed_qc: true, qty_rejected_qc: true },
          });
          invariant(items.length > 0, "Inbound has no items to post.");

          const hasUnfinalized = items.some(
            (item) => Number(item.qty_passed_qc) + Number(item.qty_rejected_qc) !== Number(item.qty_received)
          );
          invariant(!hasUnfinalized, "QC belum final. Pastikan setiap item: qty passed + qty rejected = qty received.");

          const totalPassed = items.reduce((s, i) => s + Number(i.qty_passed_qc || 0), 0);
          const totalRejected = items.reduce((s, i) => s + Number(i.qty_rejected_qc || 0), 0);
          invariant(totalPassed > 0 || totalRejected > 0, "Inbound belum punya hasil QC tersimpan.");

          for (const item of items) {
            await syncInboundItemMovement(tx, item.id);
          }

          await tx.inbound_deliveries.update({
            where: { id: existing.source_id },
            data: { qc_status: totalPassed > 0 ? "PASSED" : "FAILED" },
          });

          if (inbound.po_id) {
            await recalculatePurchaseOrderStatus(tx, inbound.po_id);
          }
          break;
        }

        case "warehouse_adjustment": {
          const adj = await tx.adjustments.findUnique({
            where: { id: existing.source_id },
            select: { id: true, post_status: true },
          });
          invariant(adj, "Adjustment not found.", 404);
          invariant(adj.post_status !== "POSTED", "Adjustment is already posted.");

          await syncAdjustmentMovement(tx, existing.source_id);
          await tx.adjustments.update({
            where: { id: existing.source_id },
            data: {
              post_status: "POSTED",
              posted_at: new Date(),
            },
          });
          break;
        }

        default:
          break;
      }

      return updated;
    });

    return NextResponse.json(toJsonValue(approval));
  } catch (error) {
    return jsonError(error, "Failed to approve request.");
  }
}
