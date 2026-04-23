import crypto from "crypto";
import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = process.env.SMOKE_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";
const DATABASE_URL = process.env.SMOKE_DATABASE_URL || process.env.DATABASE_URL;
const SMOKE_MODE = (process.env.SMOKE_MODE || process.argv[2] || "full").toLowerCase();

if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL (or SMOKE_DATABASE_URL) for smoke test.");
  process.exit(1);
}

if (!["fast", "full"].includes(SMOKE_MODE)) {
  console.error(`Invalid smoke mode: ${SMOKE_MODE}. Use 'fast' or 'full'.`);
  process.exit(1);
}

function deterministicSalesOrderItemReferenceId(orderItemId) {
  const hash = crypto
    .createHash("sha1")
    .update(`superapp:journal:sales-order-item:v1:${orderItemId}`)
    .digest("hex")
    .slice(0, 32)
    .split("");

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

async function createOrder(channelId, createdOrderNos, orderDate, orderNo) {
  await requestOrThrow("/api/sales/orders", {
    method: "POST",
    body: JSON.stringify({
      order_no: orderNo,
      order_date: orderDate,
      ref_no: null,
      parent_order_no: null,
      channel_id: channelId,
      customer_id: null,
      total_amount: "0",
      status: "PICKUP",
      is_historical: false,
    }),
  });
  createdOrderNos.push(orderNo);
}

async function runPostingCheck(db, channel, testCase, createdOrderNos, checks, failures, orderDate) {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const orderNo = `SMOKE-${testCase.type === "bundling" ? "BDL" : "SGL"}-${suffix}`.slice(0, 50);

  await createOrder(channel.channel_id, createdOrderNos, orderDate, orderNo);

  const createdItem = await requestOrThrow(`/api/sales/orders/${encodeURIComponent(orderNo)}/items`, {
    method: "POST",
    body: JSON.stringify({
      sku: testCase.sku,
      qty: testCase.qty,
      unit_price: testCase.unit_price,
      discount_item: testCase.discount_item,
    }),
  });

  await requestOrThrow(`/api/sales/orders/${encodeURIComponent(orderNo)}/post`, {
    method: "POST",
  });

  const movement = (
    await db.query(
      `
      SELECT COUNT(*)::int AS movement_count, COALESCE(SUM(qty_change), 0)::int AS movement_qty_sum
      FROM warehouse.stock_movements
      WHERE reference_type = 'SALE' AND reference_id = $1
      `,
      [String(createdItem.id)]
    )
  ).rows[0];

  const orderTotal = (
    await db.query(`SELECT total_amount::text AS total_amount FROM sales.t_order WHERE order_no = $1`, [orderNo])
  ).rows[0];

  const expectedTotal = (testCase.qty * Number(testCase.unit_price)).toFixed(2);

  const check = {
    test_case: testCase.type,
    order_no: orderNo,
    sku: testCase.sku,
    movement_count: movement.movement_count,
    expected_movement_count: testCase.tracked_rows,
    movement_qty_sum: movement.movement_qty_sum,
    total_amount: orderTotal.total_amount,
    expected_total_amount: expectedTotal,
  };

  if (SMOKE_MODE === "full") {
    const journal = (
      await db.query(
        `
        SELECT COUNT(*)::int AS journal_count
        FROM accounting.journal_entries
        WHERE reference_type = 'SALES_ORDER_ITEM' AND reference_id = $1
        `,
        [deterministicSalesOrderItemReferenceId(createdItem.id)]
      )
    ).rows[0];
    check.journal_count = journal.journal_count;

    if (journal.journal_count < 1) {
      failures.push(`${testCase.type}: journal tidak terbentuk untuk order item ${createdItem.id}`);
    }
  }

  checks.push(check);

  if (movement.movement_count !== testCase.tracked_rows) {
    failures.push(
      `${testCase.type}: movement_count ${movement.movement_count} tidak sesuai expected ${testCase.tracked_rows}`
    );
  }

  if (Number(orderTotal.total_amount).toFixed(2) !== expectedTotal) {
    failures.push(`${testCase.type}: total_amount ${orderTotal.total_amount} tidak sesuai expected ${expectedTotal}`);
  }
}

async function runSecurityGuard(channel, nonBundlingSku, createdOrderNos, checks, failures, orderDate) {
  const orderA = `SMOKE-GUARD-A-${Date.now()}`.slice(0, 50);
  const orderB = `SMOKE-GUARD-B-${Date.now()}`.slice(0, 50);

  for (const orderNo of [orderA, orderB]) {
    await createOrder(channel.channel_id, createdOrderNos, orderDate, orderNo);
  }

  const itemA = await requestOrThrow(`/api/sales/orders/${encodeURIComponent(orderA)}/items`, {
    method: "POST",
    body: JSON.stringify({
      sku: nonBundlingSku.sku,
      qty: 1,
      unit_price: "1000",
      discount_item: "0",
    }),
  });

  const itemB = await requestOrThrow(`/api/sales/orders/${encodeURIComponent(orderB)}/items`, {
    method: "POST",
    body: JSON.stringify({
      sku: nonBundlingSku.sku,
      qty: 1,
      unit_price: "2000",
      discount_item: "0",
    }),
  });

  const mismatchPatch = await request(`/api/sales/orders/${encodeURIComponent(orderA)}/items/${itemB.id}`, {
    method: "PATCH",
    body: JSON.stringify({ qty: 9 }),
  });

  const mismatchDelete = await request(`/api/sales/orders/${encodeURIComponent(orderA)}/items/${itemB.id}`, {
    method: "DELETE",
  });

  checks.push({
    test_case: "security_guard",
    order_a: orderA,
    order_b: orderB,
    item_a_id: itemA.id,
    item_b_id: itemB.id,
    mismatch_patch_status: mismatchPatch.status,
    mismatch_delete_status: mismatchDelete.status,
  });

  if (mismatchPatch.ok) {
    failures.push("security_guard: PATCH mismatch order unexpectedly succeeded");
  }

  if (mismatchDelete.ok) {
    failures.push("security_guard: DELETE mismatch order unexpectedly succeeded");
  }
}

async function main() {
  const db = new Client({ connectionString: DATABASE_URL });
  await db.connect();

  const createdOrderNos = [];
  const failures = [];
  const checks = [];

  try {
    const channel = (
      await db.query(`
        SELECT channel_id, channel_name
        FROM channel.m_channel
        WHERE piutang_account_id IS NOT NULL
        ORDER BY channel_id ASC
        LIMIT 1
      `)
    ).rows[0];

    const bundlingSku = (
      await db.query(`
        SELECT p.sku, p.product_name, COUNT(*)::int AS tracked_rows
        FROM product.master_product p
        JOIN product.product_bom b ON b.sku = p.sku
        WHERE p.is_active = true
          AND b.is_active = true
          AND b.is_stock_tracked = true
          AND b.inv_code IS NOT NULL
        GROUP BY p.sku, p.product_name
        HAVING COUNT(*) >= 2
        ORDER BY COUNT(*) DESC, p.sku ASC
        LIMIT 1
      `)
    ).rows[0];

    const nonBundlingSku = (
      await db.query(`
        SELECT p.sku, p.product_name, COUNT(*)::int AS tracked_rows
        FROM product.master_product p
        JOIN product.product_bom b ON b.sku = p.sku
        WHERE p.is_active = true
          AND b.is_active = true
          AND b.is_stock_tracked = true
          AND b.inv_code IS NOT NULL
        GROUP BY p.sku, p.product_name
        HAVING COUNT(*) = 1
        ORDER BY p.sku ASC
        LIMIT 1
      `)
    ).rows[0];

    if (!channel || !bundlingSku || !nonBundlingSku) {
      throw new Error("Seed data tidak cukup: channel/SKU bundling/non-bundling tidak ditemukan.");
    }

    const fullTestCases = [
      {
        type: "bundling",
        sku: bundlingSku.sku,
        product_name: bundlingSku.product_name,
        tracked_rows: Number(bundlingSku.tracked_rows),
        qty: 2,
        unit_price: "11111",
        discount_item: "111",
      },
      {
        type: "non-bundling",
        sku: nonBundlingSku.sku,
        product_name: nonBundlingSku.product_name,
        tracked_rows: Number(nonBundlingSku.tracked_rows),
        qty: 3,
        unit_price: "7777",
        discount_item: "77",
      },
    ];
    const testCases =
      SMOKE_MODE === "fast"
        ? [
            {
              ...fullTestCases[1],
              type: "fast-core",
            },
          ]
        : fullTestCases;

    const orderDate = new Date().toISOString().slice(0, 10);

    for (const testCase of testCases) {
      await runPostingCheck(db, channel, testCase, createdOrderNos, checks, failures, orderDate);
    }

    if (SMOKE_MODE === "full") {
      await runSecurityGuard(channel, nonBundlingSku, createdOrderNos, checks, failures, orderDate);
    }

    const report = {
      ok: failures.length === 0,
      mode: SMOKE_MODE,
      base_url: BASE_URL,
      channel,
      failures,
      checks,
    };

    console.log(JSON.stringify(report, null, 2));

    if (failures.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    for (const orderNo of createdOrderNos.reverse()) {
      try {
        await requestOrThrow(`/api/sales/orders/${encodeURIComponent(orderNo)}`, { method: "DELETE" });
      } catch (error) {
        console.error(`cleanup_failed:${orderNo}:${String(error)}`);
      }
    }

    await db.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
