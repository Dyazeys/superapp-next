import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireApiPermission } from "@/lib/authz";
import { jsonError } from "@/lib/api-error";
import { toJsonValue } from "@/lib/json";
import { PERMISSIONS } from "@/lib/rbac";

type DomainDetail = Record<string, unknown>;

async function getOpexDetail(sourceId: string): Promise<DomainDetail> {
  const row = await prisma.operational_expenses.findUnique({
    where: { id: sourceId },
    include: {
      accounts_operational_expenses_expense_account_idToaccounts: { select: { code: true, name: true } },
      accounts_operational_expenses_payment_account_idToaccounts: { select: { code: true, name: true } },
    },
  });
  if (!row) return {};
  return {
    expense_label: row.expense_label,
    amount: row.amount,
    expense_date: row.expense_date,
    description: row.description,
    payment_account: row.accounts_operational_expenses_payment_account_idToaccounts
      ? `${row.accounts_operational_expenses_payment_account_idToaccounts.code} — ${row.accounts_operational_expenses_payment_account_idToaccounts.name}`
      : null,
    expense_account: row.accounts_operational_expenses_expense_account_idToaccounts
      ? `${row.accounts_operational_expenses_expense_account_idToaccounts.code} — ${row.accounts_operational_expenses_expense_account_idToaccounts.name}`
      : null,
    status: row.status,
    posted_at: row.posted_at,
    voided_at: row.voided_at,
  };
}

async function getOpexBarterDetail(sourceId: string): Promise<DomainDetail> {
  const row = await prisma.operational_expense_barter.findUnique({
    where: { id: sourceId },
    include: {
      accounts: { select: { code: true, name: true } },
      operational_expense_barter_items: {
        select: { inv_code: true, qty: true, unit_amount: true, line_amount: true },
      },
    },
  });
  if (!row) return {};
  return {
    expense_label: row.expense_label,
    total_amount: row.total_amount,
    barter_date: row.barter_date,
    description: row.description,
    reference_no: row.reference_no,
    expense_account: row.accounts
      ? `${row.accounts.code} — ${row.accounts.name}`
      : null,
    status: row.status,
    posted_at: row.posted_at,
    items: row.operational_expense_barter_items.map((i) => ({
      inv_code: i.inv_code,
      qty: i.qty,
      unit_amount: i.unit_amount,
      line_amount: i.line_amount,
    })),
  };
}

async function getSalesOrderDetail(sourceId: string): Promise<DomainDetail> {
  const row = await prisma.t_order.findUnique({
    where: { order_no: sourceId },
    include: {
      master_customer: { select: { customer_name: true } },
      m_channel: { select: { channel_name: true } },
      t_order_item: { select: { id: true } },
    },
  });
  if (!row) return {};
  return {
    order_no: row.order_no,
    order_date: row.order_date,
    ref_no: row.ref_no,
    total_amount: row.total_amount,
    customer_name: row.master_customer?.customer_name ?? null,
    channel_name: row.m_channel?.channel_name ?? null,
    is_historical: row.is_historical,
    item_count: row.t_order_item.length,
    status: row.status,
  };
}

async function getInboundDetail(sourceId: string): Promise<DomainDetail> {
  const row = await prisma.inbound_deliveries.findUnique({
    where: { id: sourceId },
    include: {
      purchase_orders: {
        select: {
          po_number: true,
          master_vendor: { select: { vendor_name: true } },
        },
      },
      inbound_items: { select: { qty_received: true, qty_passed_qc: true, qty_rejected_qc: true } },
    },
  });
  if (!row) return {};
  return {
    receive_date: row.receive_date,
    surat_jalan_vendor: row.surat_jalan_vendor,
    qc_status: row.qc_status,
    received_by: row.received_by,
    notes: row.notes,
    po_no: row.purchase_orders?.po_number ?? null,
    vendor_name: row.purchase_orders?.master_vendor?.vendor_name ?? null,
    item_count: row.inbound_items.length,
    total_received: row.inbound_items.reduce((s, i) => s + Number(i.qty_received), 0),
    total_passed: row.inbound_items.reduce((s, i) => s + Number(i.qty_passed_qc), 0),
    total_rejected: row.inbound_items.reduce((s, i) => s + Number(i.qty_rejected_qc), 0),
  };
}

async function getWarehouseAdjustmentDetail(sourceId: string): Promise<DomainDetail> {
  const row = await prisma.adjustments.findUnique({
    where: { id: sourceId },
    include: {
      master_inventory: { select: { inv_name: true } },
    },
  });
  if (!row) return {};
  return {
    adjustment_date: row.adjustment_date,
    inv_code: row.inv_code,
    product_name: row.master_inventory?.inv_name ?? null,
    adj_type: row.adj_type,
    qty: row.qty,
    reason: row.reason,
    notes: row.notes,
    post_status: row.post_status,
    posted_at: row.posted_at,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiPermission(PERMISSIONS.TEAM_APPROVALS_VIEW);
    const { id } = await params;

    const approval = await prisma.approvals.findUnique({ where: { id } });
    if (!approval) {
      return NextResponse.json({ error: "Approval not found." }, { status: 404 });
    }

    let domainDetail: DomainDetail = {};
    switch (approval.type) {
      case "opex":
        domainDetail = await getOpexDetail(approval.source_id);
        break;
      case "opex_barter":
        domainDetail = await getOpexBarterDetail(approval.source_id);
        break;
      case "sales_order":
        domainDetail = await getSalesOrderDetail(approval.source_id);
        break;
      case "inbound":
        domainDetail = await getInboundDetail(approval.source_id);
        break;
      case "warehouse_adjustment":
        domainDetail = await getWarehouseAdjustmentDetail(approval.source_id);
        break;
      case "leave":
      case "announcement":
      case "meeting_note":
        break;
    }

    return NextResponse.json(toJsonValue({ ...approval, domainDetail }));
  } catch (error) {
    return jsonError(error, "Failed to load approval detail.");
  }
}