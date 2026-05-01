#!/usr/bin/env node
/**
 * Import real Sales Order + Order Item dari CSV ke database.
 *
 * File sumber:
 *   - data/master-upload/sales-order-data.csv
 *   - data/master-upload/order-item-data.csv
 *
 * Mode:
 *   --dry-run   = preview only, no DB writes
 *   (no flag)   = execute import with transactions
 *
 * Safety:
 *   - Gunakan batch (100 rows per batch)
 *   - Jangan drop/truncate tabel
 *   - Skip row yang sudah exist (order_no EXISTS)
 *   - Report errors lengkap tanpa berhenti
 *   - Historical data → is_historical=true
 */

import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ─── Config ───

const SALES_CSV = resolve(ROOT, "data/master-upload/sales-order-data.csv");
const ITEMS_CSV = resolve(ROOT, "data/master-upload/order-item-data.csv");
const BATCH_SIZE = 100;
const VALID_STATUSES = new Set(["PICKUP", "RETUR", "SUKSES"]);
const DEFAULT_STATUS = "PICKUP";
const CONNECTION_STRING = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;

const isDryRun = process.argv.includes("--dry-run");

if (!CONNECTION_STRING) {
  console.error("❌ PRISMA_DATABASE_URL or DATABASE_URL environment variable is required");
  process.exit(1);
}

// ─── CSV Parser (simple, no dependency) ───

function parseCsv(text) {
  const lines = text.trim().split("\n");
  if (lines.length === 0) return { headers: [], rows: [], rowsRaw: [] };
  const headers = parseLine(lines[0]);
  const rows = [];
  const rowsRaw = [];
  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;
    const values = parseLine(raw);
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? "";
    }
    rows.push(row);
    rowsRaw.push(values);
  }
  return { headers, rows, rowsRaw };
}

function parseLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// ─── Helpers ───

function log(msg) {
  console.log(`[${isDryRun ? "DRY-RUN" : "IMPORT"}] ${msg}`);
}

function warn(msg) {
  console.warn(`  ⚠  ${msg}`);
}

function error(msg) {
  console.error(`  ❌ ${msg}`);
}

function fmt(num) {
  return new Intl.NumberFormat("id-ID").format(num);
}

function asMoney(value) {
  const cleaned = String(value ?? "").replace(/[^0-9.\-]/g, "");
  const num = Number.parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function escapePg(val) {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number") return String(val);
  if (val instanceof Date) return `'${val.toISOString()}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

// ─── Main ───

async function main() {
  console.log("=".repeat(72));
  console.log(isDryRun ? "🔍 DRY-RUN MODE — no DB writes" : "🚀 EXECUTE MODE — will write to DB");
  console.log("=".repeat(72));

  // 1. Parse CSV files
  log("Reading sales-order-data.csv...");
  const salesRaw = readFileSync(SALES_CSV, "utf-8");
  const salesParsed = parseCsv(salesRaw);
  log(`  ${fmt(salesParsed.rows.length)} rows parsed`);

  log("Reading order-item-data.csv...");
  const itemsRaw = readFileSync(ITEMS_CSV, "utf-8");
  const itemsParsed = parseCsv(itemsRaw);
  log(`  ${fmt(itemsParsed.rows.length)} rows parsed`);

  // 2. Validate CSV structure
  const salesHeaders = salesParsed.headers;
  const itemHeaders = itemsParsed.headers;

  const requiredSalesHeaders = ["order_no", "order_date", "is_historical"];
  const requiredItemHeaders = ["order_no", "sku", "qty", "unit_price"];

  const missingSalesHeaders = requiredSalesHeaders.filter(h => !salesHeaders.includes(h));
  const missingItemHeaders = requiredItemHeaders.filter(h => !itemHeaders.includes(h));

  if (missingSalesHeaders.length > 0) {
    error(`Sales CSV missing headers: ${missingSalesHeaders.join(", ")}`);
    process.exit(1);
  }
  if (missingItemHeaders.length > 0) {
    error(`Items CSV missing headers: ${missingItemHeaders.join(", ")}`);
    process.exit(1);
  }

  log("CSV headers validated ✅");

  // 3. Detect duplicate total_amount column
  const totalAmtIndices = salesHeaders
    .map((h, i) => (h === "total_amount" ? i : -1))
    .filter(i => i >= 0);
  if (totalAmtIndices.length > 1) {
    warn(`Duplicate "total_amount" column detected at positions ${totalAmtIndices.join(", ")}`);
    warn(`Using the highest non-zero value among duplicate columns per row.`);
  }

  // 4. Validate & transform sales orders
  log("Validating sales orders...");
  const validationErrors = [];
  const warningErrors = [];
  const salesOrders = [];
  const seenOrderNos = new Set();
  const orderNoDuplicateErrors = [];

  for (let i = 0; i < salesParsed.rows.length; i++) {
    const raw = salesParsed.rows[i];
    const rowNum = i + 2; // 1-indexed + header

    const orderNo = raw["order_no"]?.trim();
    if (!orderNo) {
      validationErrors.push({ row: rowNum, type: "missing_order_no", detail: "order_no kosong" });
      continue;
    }

    if (seenOrderNos.has(orderNo)) {
      orderNoDuplicateErrors.push(rowNum);
      continue;
    }
    seenOrderNos.add(orderNo);

    // Parse total_amount safely even when header is duplicated.
    const totalAmtIdxList = totalAmtIndices.length > 0 ? totalAmtIndices : [salesHeaders.indexOf("total_amount")];
    const totalAmtCandidates = totalAmtIdxList
      .map((idx) => salesParsed.rowsRaw[i]?.[idx] ?? "")
      .map(asMoney);
    const totalAmount = totalAmtCandidates.reduce((max, v) => (v > max ? v : max), 0);

    // Parse customer_id
    const customerId = raw["customer_id"] ? parseInt(String(raw["customer_id"])) || null : null;

    // Parse channel_id
    const channelId = raw["channel_id"] ? parseInt(String(raw["channel_id"])) || null : null;

    // Parse status — default PICKUP jika kosong/invalid
    const rawStatus = String(raw["status"] || "").trim().toUpperCase();
    const status = VALID_STATUSES.has(rawStatus) ? rawStatus : DEFAULT_STATUS;
    if (rawStatus && !VALID_STATUSES.has(rawStatus)) {
      warningErrors.push({ row: rowNum, orderNo, rawStatus, mapped: DEFAULT_STATUS });
    }

    // Parse dates
    const rawDate = String(raw["order_date"] || "").trim();
    let orderDate = new Date(rawDate);
    if (isNaN(orderDate.getTime())) {
      warn(`Row ${rowNum}: invalid order_date "${rawDate}", using current timestamp`);
      orderDate = new Date();
    }

    const isHistorical = String(raw["is_historical"] || "").trim().toUpperCase() === "TRUE";

    salesOrders.push({
      order_no: orderNo,
      order_date: orderDate,
      ref_no: raw["ref_no"]?.trim() || null,
      parent_order_no: raw["parent_order_no"]?.trim() || null,
      channel_id: channelId,
      customer_id: customerId,
      total_amount: totalAmount,
      status,
      is_historical: isHistorical,
      rowNum,
    });
  }

  // Report duplicates
  if (orderNoDuplicateErrors.length > 0) {
    warn(`Found ${orderNoDuplicateErrors.length} duplicate order_no rows (skipped): rows ${orderNoDuplicateErrors.join(", ")}`);
  }

  // Report status warnings
  for (const w of warningErrors) {
    warn(`Row ${w.row} (${w.orderNo}): status "${w.rawStatus}" → default "${w.mapped}"`);
  }

  // Report validation errors
  for (const ve of validationErrors) {
    error(`Row ${ve.row}: ${ve.detail}`);
  }

  log(`${fmt(salesOrders.length)} valid sales orders (${fmt(validationErrors.length)} invalid skipped, ${fmt(orderNoDuplicateErrors.length)} duplicates skipped)`);

  // 5. Validate & transform order items
  log("Validating order items...");
  const itemValidationErrors = [];
  const missingParentOrders = new Set();
  const missingSku = new Set();
  const orderItems = [];
  const seenItemKeys = new Set();
  const duplicateItemKeys = [];

  const salesOrderNos = new Set(salesOrders.map(o => o.order_no));

  for (let i = 0; i < itemsParsed.rows.length; i++) {
    const raw = itemsParsed.rows[i];
    const rowNum = i + 2;

    const orderNo = String(raw["order_no"] || "").trim();
    if (!orderNo) {
      itemValidationErrors.push({ row: rowNum, type: "missing_order_no", detail: "order_no kosong" });
      continue;
    }

    const sku = String(raw["sku"] || "").trim();
    if (!sku) {
      missingSku.add("(empty)");
      itemValidationErrors.push({ row: rowNum, type: "missing_sku", detail: `order_no="${orderNo}" SKU kosong` });
      continue;
    }

    if (!salesOrderNos.has(orderNo)) {
      missingParentOrders.add(orderNo);
      // Skip — parent not in valid set
      continue;
    }

    const qty = parseInt(String(raw["qty"])) || 0;
    const unitPrice = parseFloat(String(raw["unit_price"] || "").replace(/[^0-9.\-]/g, "")) || 0;
    const discountItem = parseFloat(String(raw["discount_item"] || "").replace(/[^0-9.\-]/g, "")) || 0;

    const itemKey = `${orderNo}::${sku}::${qty}::${unitPrice}`;
    if (seenItemKeys.has(itemKey)) {
      duplicateItemKeys.push(rowNum);
      continue;
    }
    seenItemKeys.add(itemKey);

    orderItems.push({
      order_no: orderNo,
      sku,
      qty,
      unit_price: unitPrice,
      discount_item: discountItem,
      rowNum,
    });
  }

  for (const ve of itemValidationErrors) {
    error(`Item Row ${ve.row}: ${ve.detail}`);
  }

  if (missingParentOrders.size > 0) {
    warn(`${fmt(missingParentOrders.size)} order_no(s) in items CSV not found in sales orders (parent missing): ${[...missingParentOrders].slice(0, 20).join(", ")}${missingParentOrders.size > 20 ? ` ... and ${missingParentOrders.size - 20} more` : ""}`);
  }

  if (missingSku.size > 0) {
    warn(`${fmt(missingSku.size)} item(s) with empty/missing SKU`);
  }

  log(`${fmt(orderItems.length)} valid order items (${fmt(itemValidationErrors.length)} invalid, ${fmt(missingParentOrders.size)} missing parent)`);

  // 6. Generate report
  console.log("\n" + "=".repeat(72));
  console.log("📊 IMPORT REPORT");
  console.log("=".repeat(72));

  const orderStatusCounts = {};
  for (const o of salesOrders) {
    orderStatusCounts[o.status] = (orderStatusCounts[o.status] || 0) + 1;
  }

  console.log(`\n── Sales Order ──`);
  console.log(`  Total rows in CSV:        ${fmt(salesParsed.rows.length)}`);
  console.log(`  Valid for import:          ${fmt(salesOrders.length)}`);
  console.log(`  Invalid (skipped):         ${fmt(validationErrors.length)}`);
  console.log(`  Duplicate order_no:        ${fmt(orderNoDuplicateErrors.length)}`);
  console.log(`  Status breakdown:          ${Object.entries(orderStatusCounts).map(([k, v]) => `${k}=${v}`).join(", ")}`);
  console.log(`  Historical:                ${fmt(salesOrders.filter(o => o.is_historical).length)}`);
  console.log(`  Non-historical:            ${fmt(salesOrders.filter(o => !o.is_historical).length)}`);

  console.log(`\n── Order Item ──`);
  console.log(`  Total rows in CSV:        ${fmt(itemsParsed.rows.length)}`);
  console.log(`  Valid for import:          ${fmt(orderItems.length)}`);
  console.log(`  Invalid (skipped):         ${fmt(itemValidationErrors.length)}`);
  console.log(`  Missing parent orders:     ${fmt(missingParentOrders.size)}`);
  console.log(`  Duplicate items:           ${fmt(duplicateItemKeys.length)}`);
  console.log(`  Empty SKU:                 ${fmt(missingSku.size)}`);

  if (missingParentOrders.size > 0 && missingParentOrders.size <= 100) {
    console.log(`  Missing parent order_nos:  ${[...missingParentOrders].join(", ")}`);
  }

  console.log(`\n── DB Operations ──`);
  let executionResult = null;
  if (isDryRun) {
    console.log(`  🔍 DRY-RUN — no DB write`);
    console.log(`  To execute: node scripts/import-sales-real-data.mjs`);
  } else {
    console.log(`  🚀 EXECUTING...`);
    executionResult = await executeImport(salesOrders, orderItems);
  }

  // Summary
  console.log(`\n── Final Summary ──`);
  console.log(`  files_processed:            2`);
  console.log(`  sales_order_total_rows:     ${fmt(salesParsed.rows.length)}`);
  console.log(`  sales_order_imported:       ${isDryRun ? "N/A (dry-run)" : fmt(executionResult?.insertedOrders ?? 0)}`);
  console.log(`  sales_order_skipped:        ${isDryRun ? fmt(validationErrors.length + orderNoDuplicateErrors.length) : fmt((executionResult?.skippedOrders ?? 0) + validationErrors.length + orderNoDuplicateErrors.length)}`);
  console.log(`  order_item_total_rows:      ${fmt(itemsParsed.rows.length)}`);
  console.log(`  order_item_imported:        ${isDryRun ? "N/A (dry-run)" : fmt(executionResult?.insertedItems ?? 0)}`);
  console.log(`  order_item_skipped:         ${isDryRun ? fmt(itemValidationErrors.length + duplicateItemKeys.length) : fmt((executionResult?.skippedItems ?? 0) + itemValidationErrors.length + duplicateItemKeys.length)}`);
  console.log(`  missing_parent_orders:      ${fmt(missingParentOrders.size)}`);
  console.log(`  missing_sku:                ${isDryRun ? fmt(missingSku.size) : fmt(executionResult?.missingSkuCount ?? 0)}`);
  console.log(`  invalid_status_mapping:     ${fmt(warningErrors.length)}`);
  console.log(`  duplicate_keys:             ${isDryRun ? fmt(orderNoDuplicateErrors.length + duplicateItemKeys.length) : fmt(orderNoDuplicateErrors.length + duplicateItemKeys.length + (executionResult?.existingItemsSkipped ?? 0))}`);
  console.log(`  sample_error_rows:          see warnings above`);

  console.log("\n✅ Done.");
}

async function executeImport(salesOrders, orderItems) {
  const client = new Client({ connectionString: CONNECTION_STRING });
  try {
    await client.connect();
  } catch (err) {
    const code = err?.code || "UNKNOWN";
    const hint =
      code === "ECONNREFUSED" || code === "EPERM"
        ? "DB tunnel/port kemungkinan belum aktif atau tidak bisa diakses. Cek host/port DB dulu."
        : "Cek DATABASE_URL/PRISMA_DATABASE_URL dan akses jaringan ke database.";
    throw new Error(`Failed to connect DB (${code}). ${hint}`);
  }

  try {
    // ── Batch 1: Insert Sales Orders ──
    log("Inserting sales orders in batches...");
    let insertedOrders = 0;
    let skippedOrders = 0;
    const orderNoInserted = new Set();
    const existingOrderNos = [];

    for (let i = 0; i < salesOrders.length; i += BATCH_SIZE) {
      const batch = salesOrders.slice(i, i + BATCH_SIZE);

      for (const order of batch) {
        try {
          // Check if exists
          const checkRes = await client.query(
            `SELECT 1 FROM sales.t_order WHERE order_no = $1 LIMIT 1`,
            [order.order_no]
          );
          if (checkRes.rows.length > 0) {
            existingOrderNos.push(order.order_no);
            skippedOrders++;
            continue;
          }

          await client.query(
            `INSERT INTO sales.t_order (
              order_no, order_date, ref_no, parent_order_no,
              channel_id, customer_id, total_amount, status, is_historical
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [
              order.order_no,
              order.order_date,
              order.ref_no,
              order.parent_order_no,
              order.channel_id,
              order.customer_id,
              order.total_amount,
              order.status,
              order.is_historical,
            ]
          );
          orderNoInserted.add(order.order_no);
          insertedOrders++;
        } catch (err) {
          error(`Failed to insert order ${order.order_no}: ${err.message}`);
        }
      }

      log(`  Orders batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(salesOrders.length / BATCH_SIZE)}: ${fmt(insertedOrders)} inserted, ${fmt(skippedOrders)} skipped`);
    }

    if (existingOrderNos.length > 0) {
      const sample = existingOrderNos.slice(0, 15).join(", ");
      warn(`${fmt(existingOrderNos.length)} orders already exist and were skipped.`);
      warn(`Sample existing orders: ${sample}${existingOrderNos.length > 15 ? " ..." : ""}`);
    }

    // ── Batch 2: Insert Order Items ──
    log("Inserting order items in batches...");
    let insertedItems = 0;
    let skippedItems = 0;
    const missingSkuList = new Set();
    const badParentList = new Set();
    let existingItemsSkipped = 0;

    // Parent valid jika order memang ada di DB (baru insert ATAU sudah existing).
    const parentOrderNos = [...new Set(orderItems.map((i) => i.order_no))];
    const existingParentOrders = new Set();
    for (let i = 0; i < parentOrderNos.length; i += BATCH_SIZE) {
      const slice = parentOrderNos.slice(i, i + BATCH_SIZE);
      const params = slice.map((_, idx) => `$${idx + 1}`).join(",");
      const res = await client.query(
        `SELECT order_no FROM sales.t_order WHERE order_no IN (${params})`,
        slice
      );
      for (const row of res.rows) existingParentOrders.add(row.order_no);
    }

    // Pre-fetch all existing SKUs from master_product
    const skuRes = await client.query(`SELECT sku FROM product.master_product`);
    const existingSkus = new Set(skuRes.rows.map(r => r.sku));

    for (let i = 0; i < orderItems.length; i += BATCH_SIZE) {
      const batch = orderItems.slice(i, i + BATCH_SIZE);

      for (const item of batch) {
        try {
          // Verify parent exists in DB
          if (!existingParentOrders.has(item.order_no)) {
            badParentList.add(item.order_no);
            skippedItems++;
            continue;
          }

          // Verify SKU exists in master_product
          if (!existingSkus.has(item.sku)) {
            missingSkuList.add(item.sku);
            skippedItems++;
            continue;
          }

          // Guard rerun: skip jika row item identik sudah ada.
          const existingItemRes = await client.query(
            `SELECT 1
             FROM sales.t_order_item
             WHERE order_no = $1
               AND sku = $2
               AND qty = $3
               AND unit_price = $4
               AND discount_item = $5
             LIMIT 1`,
            [
              item.order_no,
              item.sku,
              item.qty,
              item.unit_price,
              item.discount_item,
            ]
          );
          if (existingItemRes.rows.length > 0) {
            existingItemsSkipped++;
            skippedItems++;
            continue;
          }

          await client.query(
            `INSERT INTO sales.t_order_item (
              order_no, sku, qty, unit_price, discount_item
            ) VALUES ($1,$2,$3,$4,$5)`,
            [
              item.order_no,
              item.sku,
              item.qty,
              item.unit_price,
              item.discount_item,
            ]
          );
          insertedItems++;
        } catch (err) {
          error(`Failed to insert item row ${item.rowNum}: ${err.message}`);
        }
      }

      log(`  Items batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(orderItems.length / BATCH_SIZE)}: ${fmt(insertedItems)} inserted, ${fmt(skippedItems)} skipped`);
    }

    log(`\n✅ IMPORT COMPLETE`);
    log(`  Orders: ${fmt(insertedOrders)} inserted, ${fmt(skippedOrders)} skipped`);
    log(`  Items: ${fmt(insertedItems)} inserted, ${fmt(skippedItems)} skipped`);
    log(`  Existing identical items skipped: ${fmt(existingItemsSkipped)}`);

    if (missingSkuList.size > 0) {
      console.log(`\n  SKU not found in master_product (${missingSkuList.size}):`);
      for (const sku of missingSkuList) {
        console.log(`    - ${sku}`);
      }
    }

    if (badParentList.size > 0) {
      console.log(`\n  Items with missing parent (${badParentList.size}):`);
      for (const orderNo of [...badParentList].slice(0, 20)) {
        console.log(`    - ${orderNo}`);
      }
    }

    return {
      insertedOrders,
      skippedOrders,
      insertedItems,
      skippedItems,
      missingSkuCount: missingSkuList.size,
      existingItemsSkipped,
    };

  } catch (err) {
    console.error(`\n❌ FATAL ERROR: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
