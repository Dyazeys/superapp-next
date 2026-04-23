import crypto from "crypto";
import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = process.env.SMOKE_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";
const DATABASE_URL = process.env.SMOKE_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL (or SMOKE_DATABASE_URL) for payout smoke test.");
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
    throw new Error(`HTTP ${result.status} ${path}: ${typeof result.body === "string" ? result.body : JSON.stringify(result.body)}`);
  }

  return result.body;
}

async function fetchSingleValue(db, query, params) {
  const result = await db.query(query, params);
  return result.rows[0];
}

async function main() {
  const db = new Client({ connectionString: DATABASE_URL });
  await db.connect();

  let payoutId = null;
  let adjustmentId = null;
  let transferId = null;
  const failures = [];
  const checks = [];

  try {
    const order = (
      await db.query(`
        SELECT
          o.ref_no,
          o.order_no,
          c.channel_id,
          c.channel_name
        FROM sales.t_order o
        JOIN channel.m_channel c
          ON c.channel_id = o.channel_id
        WHERE o.ref_no IS NOT NULL
          AND c.piutang_account_id IS NOT NULL
          AND c.saldo_account_id IS NOT NULL
        ORDER BY o.order_date DESC, o.order_no DESC
        LIMIT 1
      `)
    ).rows[0];

    const bankAccount = (
      await db.query(`
        SELECT id, code, name
        FROM accounting.accounts
        WHERE code LIKE '111%'
        ORDER BY code ASC
        LIMIT 1
      `)
    ).rows[0];

    if (!order || !bankAccount) {
      throw new Error("Seed data tidak cukup untuk payout smoke test.");
    }

    const today = new Date().toISOString().slice(0, 10);
    const payoutPayload = {
      ref: order.ref_no,
      payout_date: today,
      qty_produk: 1,
      hpp: "10000",
      total_price: "150000",
      seller_discount: "0",
      fee_admin: "0",
      fee_service: "0",
      fee_order_process: "0",
      fee_program: "0",
      fee_transaction: "0",
      fee_affiliate: "0",
      shipping_cost: "0",
      omset: "150000",
      payout_status: "SETTLED",
    };

    const createdPayout = await requestOrThrow("/api/payout/records", {
      method: "POST",
      body: JSON.stringify(payoutPayload),
    });
    payoutId = createdPayout.payout_id;

    const createdAdjustment = await requestOrThrow("/api/payout/adjustments", {
      method: "POST",
      body: JSON.stringify({
        ref: order.ref_no,
        payout_date: today,
        adjustment_date: today,
        channel_id: order.channel_id,
        adjustment_type: "MANUAL",
        reason: "Smoke test payout adjustment",
        amount: "25000",
      }),
    });
    adjustmentId = createdAdjustment.adjustment_id;

    const createdTransfer = await requestOrThrow("/api/payout/transfers", {
      method: "POST",
      body: JSON.stringify({
        payout_id: payoutId,
        transfer_date: today,
        amount: "50000",
        bank_account_id: bankAccount.id,
        notes: "Smoke test payout transfer",
      }),
    });
    transferId = createdTransfer.id;

    const payoutJournal = await fetchSingleValue(
      db,
      `
      SELECT COUNT(DISTINCT je.id)::int AS journal_count, COUNT(jl.id)::int AS line_count
      FROM accounting.journal_entries je
      LEFT JOIN accounting.journal_lines jl
        ON jl.journal_entry_id = je.id
      WHERE je.reference_type = 'PAYOUT_SETTLEMENT'
        AND je.reference_id = $1
      `,
      [payoutSettlementReferenceId(payoutId)]
    );

    const adjustmentJournal = await fetchSingleValue(
      db,
      `
      SELECT COUNT(DISTINCT je.id)::int AS journal_count, COUNT(jl.id)::int AS line_count
      FROM accounting.journal_entries je
      LEFT JOIN accounting.journal_lines jl
        ON jl.journal_entry_id = je.id
      WHERE je.reference_type = 'PAYOUT_ADJUSTMENT'
        AND je.reference_id = $1
      `,
      [payoutAdjustmentReferenceId(adjustmentId)]
    );

    const transferJournal = await fetchSingleValue(
      db,
      `
      SELECT COUNT(DISTINCT je.id)::int AS journal_count, COUNT(jl.id)::int AS line_count
      FROM accounting.journal_entries je
      LEFT JOIN accounting.journal_lines jl
        ON jl.journal_entry_id = je.id
      WHERE je.reference_type = 'PAYOUT_BANK_TRANSFER'
        AND je.reference_id = $1
      `,
      [transferId]
    );

    const oversizedTransfer = await request(`/api/payout/transfers/${transferId}`, {
      method: "PATCH",
      body: JSON.stringify({
        amount: "999999999",
      }),
    });

    checks.push({
      order_ref: order.ref_no,
      payout_id: payoutId,
      adjustment_id: adjustmentId,
      transfer_id: transferId,
      payout_journal_count: payoutJournal.journal_count,
      payout_line_count: payoutJournal.line_count,
      adjustment_journal_count: adjustmentJournal.journal_count,
      adjustment_line_count: adjustmentJournal.line_count,
      transfer_journal_count: transferJournal.journal_count,
      transfer_line_count: transferJournal.line_count,
      oversized_transfer_patch_status: oversizedTransfer.status,
    });

    if (payoutJournal.journal_count < 1 || payoutJournal.line_count < 2) {
      failures.push("Payout settlement journal tidak terbentuk lengkap.");
    }

    if (adjustmentJournal.journal_count < 1 || adjustmentJournal.line_count < 2) {
      failures.push("Payout adjustment journal tidak terbentuk lengkap.");
    }

    if (transferJournal.journal_count < 1 || transferJournal.line_count < 2) {
      failures.push("Payout bank transfer journal tidak terbentuk lengkap.");
    }

    if (oversizedTransfer.ok) {
      failures.push("Validasi transfer melebihi saldo payout unexpectedly succeeded.");
    }

    const report = {
      ok: failures.length === 0,
      base_url: BASE_URL,
      failures,
      checks,
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

    await db.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
