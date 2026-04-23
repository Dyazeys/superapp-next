import crypto from "crypto";
import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = process.env.SMOKE_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";
const DATABASE_URL = process.env.SMOKE_DATABASE_URL || process.env.DATABASE_URL;
const SMOKE_VERBOSE = (process.env.SMOKE_VERBOSE || process.argv[2] || "verbose").toLowerCase() !== "compact";

if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL (or SMOKE_DATABASE_URL) for payout flow smoke test.");
  process.exit(1);
}

function deterministicReferenceId(namespace, id) {
  const hash = crypto.createHash("sha1").update(`${namespace}:${id}`).digest("hex").slice(0, 32).split("");

  hash[12] = "5";
  const variant = Number.parseInt(hash[16], 16);
  hash[16] = ((variant & 0x3) | 0x8).toString(16);

  return [
    hash.slice(0, 8).join(""),
    hash.slice(8, 12).join(""),
    hash.slice(12, 16).join(""),
    hash.slice(16, 20).join(""),
    hash.slice(20, 32).join(""),
  ].join("-");
}

function deterministicSalesOrderItemReferenceId(orderItemId) {
  return deterministicReferenceId("superapp:journal:sales-order-item:v1", orderItemId);
}

function payoutSettlementReferenceId(payoutId) {
  return deterministicReferenceId("superapp:payout-settlement:v1", payoutId);
}

function payoutAdjustmentReferenceId(adjustmentId) {
  return deterministicReferenceId("superapp:payout-adjustment:v1", adjustmentId);
}

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let body = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}

async function requestOrThrow(path, options = {}) {
  const result = await request(path, options);
  if (!result.ok) {
    const message = typeof result.body === "string" ? result.body : JSON.stringify(result.body);
    throw new Error(`HTTP ${result.status} ${path}: ${message}`);
  }

  return result.body;
}

async function fetchSingleRow(db, query, params = []) {
  const result = await db.query(query, params);
  return result.rows[0] ?? null;
}

async function fetchJournalSummary(db, referenceType, referenceId) {
  return fetchSingleRow(
    db,
    `
      SELECT
        COUNT(DISTINCT je.id)::int AS journal_count,
        COUNT(jl.id)::int AS line_count,
        COALESCE(SUM(jl.debit), 0)::text AS total_debit,
        COALESCE(SUM(jl.credit), 0)::text AS total_credit
      FROM accounting.journal_entries je
      LEFT JOIN accounting.journal_lines jl
        ON jl.journal_entry_id = je.id
      WHERE je.reference_type = $1
        AND je.reference_id = $2
    `,
    [referenceType, referenceId]
  );
}

async function fetchJournalLines(db, referenceType, referenceId) {
  const result = await db.query(
    `
      SELECT
        je.id AS journal_id,
        je.transaction_date::date::text AS transaction_date,
        je.description,
        jl.id AS journal_line_id,
        a.code AS account_code,
        a.name AS account_name,
        COALESCE(jl.debit, 0)::text AS debit,
        COALESCE(jl.credit, 0)::text AS credit,
        jl.memo
      FROM accounting.journal_entries je
      JOIN accounting.journal_lines jl
        ON jl.journal_entry_id = je.id
      JOIN accounting.accounts a
        ON a.id = jl.account_id
      WHERE je.reference_type = $1
        AND je.reference_id = $2
      ORDER BY je.transaction_date ASC, je.id ASC, a.code ASC, jl.id ASC
    `,
    [referenceType, referenceId]
  );

  return result.rows;
}

async function main() {
  const db = new Client({ connectionString: DATABASE_URL });
  await db.connect();

  let orderNo = null;
  let payoutId = null;
  let adjustmentId = null;
  let transferId = null;

  const failures = [];
  const timeline = [];

  try {
    const channel = await fetchSingleRow(
      db,
      `
        SELECT channel_id, channel_name, piutang_account_id, saldo_account_id
        FROM channel.m_channel
        WHERE piutang_account_id IS NOT NULL
          AND saldo_account_id IS NOT NULL
        ORDER BY channel_id ASC
        LIMIT 1
      `
    );

    const sku = await fetchSingleRow(
      db,
      `
        SELECT p.sku, p.product_name, COUNT(*)::int AS tracked_rows
        FROM product.master_product p
        JOIN product.product_bom b
          ON b.sku = p.sku
        WHERE p.is_active = true
          AND b.is_active = true
          AND b.is_stock_tracked = true
          AND b.inv_code IS NOT NULL
        GROUP BY p.sku, p.product_name
        HAVING COUNT(*) >= 1
        ORDER BY COUNT(*) ASC, p.sku ASC
        LIMIT 1
      `
    );

    const bankAccount = await fetchSingleRow(
      db,
      `
        SELECT id, code, name
        FROM accounting.accounts
        WHERE code LIKE '111%'
        ORDER BY code ASC
        LIMIT 1
      `
    );

    if (!channel || !sku || !bankAccount) {
      throw new Error("Seed data tidak cukup: channel, SKU, atau rekening bank tidak ditemukan.");
    }

    const today = new Date().toISOString().slice(0, 10);
    const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const refNo = `PAYOUT-FLOW-${uniqueSuffix}`.slice(0, 100);
    orderNo = `SO-PAYOUT-FLOW-${uniqueSuffix}`.slice(0, 50);

    const orderPayload = {
      order_no: orderNo,
      order_date: today,
      ref_no: refNo,
      parent_order_no: null,
      channel_id: channel.channel_id,
      customer_id: null,
      total_amount: "0",
      status: "PAID",
      is_historical: false,
    };

    const createdOrder = await requestOrThrow("/api/sales/orders", {
      method: "POST",
      body: JSON.stringify(orderPayload),
    });

    timeline.push({
      step: "sales_order_created",
      order_no: createdOrder.order_no,
      ref_no: createdOrder.ref_no,
      channel_name: channel.channel_name,
    });

    const itemPayload = {
      sku: sku.sku,
      qty: 2,
      unit_price: "125000",
      discount_item: "5000",
    };

    const createdItem = await requestOrThrow(`/api/sales/orders/${encodeURIComponent(orderNo)}/items`, {
      method: "POST",
      body: JSON.stringify(itemPayload),
    });

    const orderSubtotal = (itemPayload.qty * Number(itemPayload.unit_price)).toFixed(2);

    timeline.push({
      step: "sales_order_item_created",
      order_item_id: createdItem.id,
      sku: sku.sku,
      product_name: sku.product_name,
      qty: itemPayload.qty,
      order_subtotal: orderSubtotal,
      raw_discount: itemPayload.discount_item,
    });

    const postedOrder = await requestOrThrow(`/api/sales/orders/${encodeURIComponent(orderNo)}/post`, {
      method: "POST",
    });

    const persistedOrder = await fetchSingleRow(
      db,
      `
        SELECT
          order_no,
          ref_no,
          total_amount::text AS total_amount,
          status,
          channel_id
        FROM sales.t_order
        WHERE order_no = $1
      `,
      [orderNo]
    );

    const salesJournal = await fetchJournalSummary(
      db,
      "SALES_ORDER_ITEM",
      deterministicSalesOrderItemReferenceId(createdItem.id)
    );
    const salesJournalLines = SMOKE_VERBOSE
      ? await fetchJournalLines(db, "SALES_ORDER_ITEM", deterministicSalesOrderItemReferenceId(createdItem.id))
      : [];

    const stockMovement = await fetchSingleRow(
      db,
      `
        SELECT
          COUNT(*)::int AS movement_count,
          COALESCE(SUM(qty_change), 0)::int AS qty_sum
        FROM warehouse.stock_movements
        WHERE reference_type = 'SALE'
          AND reference_id = $1
      `,
      [String(createdItem.id)]
    );
    const stockMovementRows = SMOKE_VERBOSE
      ? (
          await db.query(
            `
              SELECT
                inv_code,
                qty_change::text AS qty_change,
                running_balance::text AS running_balance,
                reference_type,
                reference_id
              FROM warehouse.stock_movements
              WHERE reference_type = 'SALE'
                AND reference_id = $1
              ORDER BY id ASC
            `,
            [String(createdItem.id)]
          )
        ).rows
      : [];

    timeline.push({
      step: "sales_order_posted",
      order_no: postedOrder.order_no,
      order_total_amount: persistedOrder?.total_amount ?? null,
      sales_journal_count: salesJournal?.journal_count ?? 0,
      sales_journal_lines: salesJournal?.line_count ?? 0,
      sales_total_debit: salesJournal?.total_debit ?? "0",
      sales_total_credit: salesJournal?.total_credit ?? "0",
      stock_movement_count: stockMovement?.movement_count ?? 0,
      stock_qty_sum: stockMovement?.qty_sum ?? 0,
      ...(SMOKE_VERBOSE
        ? {
            sales_journal_detail: salesJournalLines,
            stock_movement_detail: stockMovementRows,
          }
        : {}),
      behavior:
        "Begitu order diposting, stock movement dan jurnal penjualan terbentuk. Ini tahap yang membuat ref order siap dipakai payout.",
    });

    const payoutPayload = {
      ref: refNo,
      payout_date: today,
      qty_produk: itemPayload.qty,
      hpp: "40000",
      total_price: orderSubtotal,
      seller_discount: "5000",
      fee_admin: "2500",
      fee_service: "1500",
      fee_order_process: "0",
      fee_program: "0",
      fee_transaction: "1000",
      fee_affiliate: "0",
      shipping_cost: "3000",
      omset: "237000",
      payout_status: "SETTLED",
    };

    const createdPayout = await requestOrThrow("/api/payout/records", {
      method: "POST",
      body: JSON.stringify(payoutPayload),
    });
    payoutId = createdPayout.payout_id;

    const payoutJournal = await fetchJournalSummary(
      db,
      "PAYOUT_SETTLEMENT",
      payoutSettlementReferenceId(payoutId)
    );
    const payoutJournalLines = SMOKE_VERBOSE
      ? await fetchJournalLines(db, "PAYOUT_SETTLEMENT", payoutSettlementReferenceId(payoutId))
      : [];

    timeline.push({
      step: "payout_created",
      payout_id: payoutId,
      ref_no: refNo,
      payout_net: payoutPayload.omset,
      payout_status: payoutPayload.payout_status,
      payout_journal_count: payoutJournal?.journal_count ?? 0,
      payout_journal_lines: payoutJournal?.line_count ?? 0,
      ...(SMOKE_VERBOSE ? { payout_journal_detail: payoutJournalLines } : {}),
      behavior:
        "Saat payout dibuat dari ref order yang sama, piutang channel diselesaikan dan saldo channel bertambah sesuai jurnal payout settlement.",
    });

    const createdAdjustment = await requestOrThrow("/api/payout/adjustments", {
      method: "POST",
      body: JSON.stringify({
        ref: refNo,
        payout_date: today,
        adjustment_date: today,
        channel_id: channel.channel_id,
        adjustment_type: "MANUAL",
        reason: "Simulasi koreksi audit payout dari sales flow",
        amount: "12000",
      }),
    });
    adjustmentId = createdAdjustment.adjustment_id;

    const adjustmentJournal = await fetchJournalSummary(
      db,
      "PAYOUT_ADJUSTMENT",
      payoutAdjustmentReferenceId(adjustmentId)
    );
    const adjustmentJournalLines = SMOKE_VERBOSE
      ? await fetchJournalLines(db, "PAYOUT_ADJUSTMENT", payoutAdjustmentReferenceId(adjustmentId))
      : [];

    timeline.push({
      step: "payout_adjustment_created",
      adjustment_id: adjustmentId,
      adjustment_amount: "12000",
      adjustment_journal_count: adjustmentJournal?.journal_count ?? 0,
      adjustment_journal_lines: adjustmentJournal?.line_count ?? 0,
      ...(SMOKE_VERBOSE ? { adjustment_journal_detail: adjustmentJournalLines } : {}),
      behavior:
        "Adjustment menambah atau mengoreksi saldo/piutang payout tanpa perlu mengubah sales order asal.",
    });

    const createdTransfer = await requestOrThrow("/api/payout/transfers", {
      method: "POST",
      body: JSON.stringify({
        payout_id: payoutId,
        transfer_date: today,
        amount: "100000",
        bank_account_id: bankAccount.id,
        notes: "Simulasi transfer bank dari payout flow sales order",
      }),
    });
    transferId = createdTransfer.id;

    const transferJournal = await fetchJournalSummary(
      db,
      "PAYOUT_BANK_TRANSFER",
      transferId
    );
    const transferJournalLines = SMOKE_VERBOSE
      ? await fetchJournalLines(db, "PAYOUT_BANK_TRANSFER", transferId)
      : [];

    const oversizedTransfer = await request(`/api/payout/transfers/${transferId}`, {
      method: "PATCH",
      body: JSON.stringify({ amount: "999999999" }),
    });

    timeline.push({
      step: "payout_transfer_created",
      transfer_id: transferId,
      transfer_amount: "100000",
      bank_account_code: bankAccount.code,
      transfer_journal_count: transferJournal?.journal_count ?? 0,
      transfer_journal_lines: transferJournal?.line_count ?? 0,
      oversized_transfer_patch_status: oversizedTransfer.status,
      ...(SMOKE_VERBOSE ? { transfer_journal_detail: transferJournalLines } : {}),
      behavior:
        "Transfer memindahkan sebagian saldo payout ke rekening bank. Guard rail tetap aktif: transfer yang melebihi saldo tersedia harus ditolak.",
    });

    const reconciliation = await requestOrThrow(
      `/api/payout/reconciliation?period=custom&fromDate=${today}&toDate=${today}`
    );

    const channelReconciliation = (reconciliation.channels ?? []).find(
      (row) => row.channel_id === channel.channel_id
    );
    const refBreakdown = (channelReconciliation?.ref_breakdowns ?? []).find((item) => item.ref === refNo);

    timeline.push({
      step: "reconciliation_snapshot",
      period: today,
      channel_name: channel.channel_name,
      mismatch_status: channelReconciliation?.mismatch_status ?? null,
      total_sales_receivable_posted: channelReconciliation?.total_sales_receivable_posted ?? null,
      total_payout_settlement_posted: channelReconciliation?.total_payout_settlement_posted ?? null,
      total_saldo: channelReconciliation?.total_saldo ?? null,
      total_bank_transfer: channelReconciliation?.total_bank_transfer ?? null,
      sales_vs_payout_diff: channelReconciliation?.sales_receivable_vs_payout_settlement_diff ?? null,
      saldo_vs_transfer_diff: channelReconciliation?.saldo_vs_bank_transfer_diff ?? null,
      mismatch_messages: (channelReconciliation?.mismatches ?? []).map((item) => item.message),
      ref_breakdown_for_test_ref: refBreakdown ?? null,
      behavior:
        "Snapshot ini menunjukkan apakah payout flow dari order tadi terlihat MATCHED, EXPECTED, atau ERROR di halaman rekonsiliasi.",
    });

    if ((salesJournal?.journal_count ?? 0) < 1 || (salesJournal?.line_count ?? 0) < 2) {
      failures.push("Jurnal sales order item tidak terbentuk lengkap.");
    }

    if ((stockMovement?.movement_count ?? 0) < Number(sku.tracked_rows)) {
      failures.push("Stock movement sales lebih sedikit dari komponen BOM yang diharapkan.");
    }

    if ((payoutJournal?.journal_count ?? 0) < 1 || (payoutJournal?.line_count ?? 0) < 2) {
      failures.push("Jurnal payout settlement tidak terbentuk lengkap.");
    }

    if ((adjustmentJournal?.journal_count ?? 0) < 1 || (adjustmentJournal?.line_count ?? 0) < 2) {
      failures.push("Jurnal payout adjustment tidak terbentuk lengkap.");
    }

    if ((transferJournal?.journal_count ?? 0) < 1 || (transferJournal?.line_count ?? 0) < 2) {
      failures.push("Jurnal payout bank transfer tidak terbentuk lengkap.");
    }

    if (oversizedTransfer.ok) {
      failures.push("Transfer over-limit unexpectedly succeeded.");
    }

    const report = {
      ok: failures.length === 0,
      base_url: BASE_URL,
      summary: {
        order_no: orderNo,
        ref_no: refNo,
        payout_id: payoutId,
        adjustment_id: adjustmentId,
        transfer_id: transferId,
        channel_name: channel.channel_name,
      },
      failures,
      timeline,
    };

    console.log(JSON.stringify(report, null, 2));

    if (failures.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    if (transferId) {
      try {
        await requestOrThrow(`/api/payout/transfers/${transferId}`, { method: "DELETE" });
      } catch (error) {
        console.error(`cleanup_transfer_failed:${transferId}:${String(error)}`);
      }
    }

    if (adjustmentId) {
      try {
        await requestOrThrow(`/api/payout/adjustments/${adjustmentId}`, { method: "DELETE" });
      } catch (error) {
        console.error(`cleanup_adjustment_failed:${adjustmentId}:${String(error)}`);
      }
    }

    if (payoutId) {
      try {
        await requestOrThrow(`/api/payout/records/${payoutId}`, { method: "DELETE" });
      } catch (error) {
        console.error(`cleanup_payout_failed:${payoutId}:${String(error)}`);
      }
    }

    if (orderNo) {
      try {
        await requestOrThrow(`/api/sales/orders/${encodeURIComponent(orderNo)}`, { method: "DELETE" });
      } catch (error) {
        console.error(`cleanup_order_failed:${orderNo}:${String(error)}`);
      }
    }

    await db.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
