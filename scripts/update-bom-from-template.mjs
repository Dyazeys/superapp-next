#!/usr/bin/env node
/**
 * update-bom-from-template.mjs
 *
 * Baca template TXT BOM, terapkan ke seluruh SKU yang match product_name,
 * tambah komponen ongkir, lalu sinkron total_hpp.
 *
 * Usage:
 *   node scripts/update-bom-from-template.mjs <template.txt> [dry-run|execute]
 *
 * Contoh:
 *   node scripts/update-bom-from-template.mjs data/master-upload/BOM-TEMPLATE/bom-template-doja.txt dry-run
 *   node scripts/update-bom-from-template.mjs data/master-upload/BOM-TEMPLATE/bom-template-doja.txt execute
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

/* ────────── HELPERS ────────── */

function parseTemplate(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/);

  const header = {};
  const blocks = [];
  let currentBlock = null;
  let inBlock = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("#")) continue;
    if (line === "") continue;

    if (line === "row_begin") {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { fields: {}, when: null };
      inBlock = true;
      continue;
    }

    if (line === "row_end") {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = null;
      inBlock = false;
      continue;
    }

    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim();

    if (inBlock && currentBlock) {
      if (key === "when") {
        currentBlock.when = val;
      } else {
        currentBlock.fields[key] = val;
      }
    } else if (!inBlock) {
      header[key] = val;
    }
  }

  if (currentBlock) blocks.push(currentBlock);

  if (!header.product_name) throw new Error(`Template missing "product_name" header`);

  for (const b of blocks) {
    if (!b.fields.component_group) throw new Error(`Block missing "component_group"`);
    if (!b.fields.component_type) throw new Error(`Block missing "component_type"`);
    if (!b.fields.component_name) throw new Error(`Block missing "component_name"`);
    if (!b.fields.qty) throw new Error(`Block missing "qty"`);
    if (!b.fields.unit_cost_source) throw new Error(`Block missing "unit_cost_source"`);
  }

  return { header, blocks, filePath: path.basename(filePath) };
}

function evaluateWhen(when, row) {
  if (!when || when === "always") return true;

  const parts = when.split(":");
  if (parts.length < 2) return true;

  const field = parts[0];
  const op = parts[1];
  const val = parts.slice(2).join(":") || null;

  const rowVal = row[field] ?? null;

  if (op === "not_null") return rowVal !== null;
  if (op === "eq") return rowVal === val;

  return true;
}

function resolvePlaceholders(value, row) {
  return value
    .replace(/\{\{INV_MAIN\}\}/g, row.inv_main ?? "")
    .replace(/\{\{INV_ACC\}\}/g, row.inv_acc ?? "")
    .replace(/\{\{SKU\}\}/g, row.sku ?? "");
}

function generateExpectedRows(skuRow, blocks) {
  const rows = [];

  for (const block of blocks) {
    if (!evaluateWhen(block.when, skuRow)) continue;

    const resolved = {};
    for (const [k, v] of Object.entries(block.fields)) {
      resolved[k] = resolvePlaceholders(v, skuRow);
    }

    resolved.component_name = resolvePlaceholders(block.fields.component_name, skuRow);

    const qty = Number(resolved.qty) || 0;
    const unitCost = Number(resolved.unit_cost_source) || 0;

    rows.push({
      sku: skuRow.sku,
      sequence_no: Number(resolved.sequence_no) || 0,
      component_group: resolved.component_group,
      component_type: resolved.component_type,
      inv_code: resolved.inv_code || null,
      component_name: resolved.component_name,
      qty,
      unit_cost: unitCost,
      line_cost: qty * unitCost,
      is_stock_tracked: String(resolved.is_stock_tracked ?? "false").toUpperCase() === "TRUE",
      is_active: String(resolved.is_active ?? "true").toUpperCase() !== "FALSE",
      notes: resolved.notes ?? "",
    });
  }

  return rows;
}

function generateOngkirRow(sku, maxSeq) {
  return {
    sku,
    sequence_no: maxSeq + 1,
    component_group: "PACKING",
    component_type: "NON_INVENTORY",
    inv_code: null,
    component_name: "ongkir barang masuk",
    qty: 1,
    unit_cost: 2500,
    line_cost: 2500,
    is_stock_tracked: false,
    is_active: true,
    notes: "Auto from BOM template script",
  };
}

/* ────────── MAIN ────────── */

async function main() {
  const tmplArg = process.argv[2];
  const mode = (process.argv[3] || "dry-run").toLowerCase();

  if (!tmplArg) {
    console.error("Usage: node scripts/update-bom-from-template.mjs <template.txt> [dry-run|execute]");
    process.exit(1);
  }

  if (!["dry-run", "execute"].includes(mode)) {
    console.error(`Invalid mode "${mode}". Gunakan "dry-run" atau "execute".`);
    process.exit(1);
  }

  const tmplPath = path.resolve(process.cwd(), tmplArg);
  if (!fs.existsSync(tmplPath)) {
    console.error(`Template file not found: ${tmplPath}`);
    process.exit(1);
  }

  /* ── Parse template ── */
  console.log(`📄 Loading template: ${tmplArg}`);
  const { header, blocks, filePath: templateFile } = parseTemplate(tmplPath);
  const productName = header.product_name;
  console.log(`   product_name: "${productName}"`);
  console.log(`   blocks parsed: ${blocks.length}`);

  /* ── Koneksi DB ── */
  const client = new Client({
    connectionString: process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL,
  });
  await client.connect();

  const report = {
    template_file: templateFile,
    product_name: productName,
    total_target_sku: 0,
    matched_sku: [],
    bom_created_rows: 0,
    ongkir_created_rows: 0,
    ongkir_skipped_duplicate_rows: 0,
    error_rows: 0,
    error_skus: [],
    sample_before_after_hpp: [],
  };

  try {
    /* ── Step 1: Ambil SKU target ── */
    const skuRes = await client.query(
      `select sku, product_name, inv_main, inv_acc, total_hpp::text
       from product.master_product
       where product_name = $1
       order by sku`,
      [productName],
    );

    const targetSkus = skuRes.rows;
    report.total_target_sku = targetSkus.length;
    report.matched_sku = targetSkus.map((r) => r.sku);

    if (targetSkus.length === 0) {
      console.log(`\n❌ STOP: product_name "${productName}" tidak match ke SKU mana pun.`);
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    console.log(`\n🎯 Target SKU: ${targetSkus.length}`);

    /* ── Step 2: Generate expected rows ── */
    const expectedMap = new Map();
    for (const row of targetSkus) {
      expectedMap.set(row.sku, generateExpectedRows(row, blocks));
    }

    /* ── Step 3: Snapshot before HPP ── */
    const hppBeforeMap = new Map();
    for (const row of targetSkus) {
      hppBeforeMap.set(row.sku, row.total_hpp);
    }

    if (mode === "dry-run") {
      console.log("\n🔍 DRY RUN — Tidak ada perubahan database.");
      console.log("=".repeat(60));

      for (const row of targetSkus) {
        const expected = expectedMap.get(row.sku) || [];
        console.log(`\n📦 ${row.sku} (inv_main=${row.inv_main ?? "—"}, inv_acc=${row.inv_acc ?? "—"})`);
        console.log(`   Expected BOM rows: ${expected.length}`);
        for (const e of expected) {
          console.log(`   [${e.sequence_no}] ${e.component_group}/${e.component_type} — ${e.component_name} @ ${e.unit_cost} x ${e.qty} = ${e.line_cost}`);
        }

        const maxSeq = expected.length > 0 ? Math.max(...expected.map((e) => e.sequence_no)) : 0;
        const ongkir = generateOngkirRow(row.sku, maxSeq);
        console.log(`   [${ongkir.sequence_no}] ${ongkir.component_group}/${ongkir.component_type} — ${ongkir.component_name} @ ${ongkir.unit_cost} x ${ongkir.qty} = ${ongkir.line_cost} (akan ditambah)`);

        const totalCost = expected.reduce((sum, e) => sum + e.line_cost, 0) + ongkir.line_cost;
        console.log(`   HPP: ${row.total_hpp} → ${totalCost}`);
      }

      console.log("\n✅ Dry-run selesai.");
      console.log(`➡️  Jalankan: node scripts/update-bom-from-template.mjs "${tmplArg}" execute`);
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    /* ── EXECUTE MODE ── */
    console.log("\n⚡ EXECUTE — Memproses update BOM...");

    await client.query("BEGIN");

    try {
      for (const row of targetSkus) {
        const sku = row.sku;
        const expected = expectedMap.get(sku) || [];

        // Hapus semua BOM untuk SKU ini, lalu rebuild dari template + ongkir
        await client.query(
          `delete from product.product_bom where sku = $1`,
          [sku],
        );

        // Insert BOM rows from template
        for (const e of expected) {
          await client.query(
            `insert into product.product_bom
             (sku, sequence_no, component_group, component_type, inv_code,
              component_name, qty, unit_cost, line_cost,
              is_stock_tracked, is_active, notes)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
            [
              sku,
              e.sequence_no,
              e.component_group,
              e.component_type,
              e.inv_code,
              e.component_name,
              e.qty,
              e.unit_cost,
              e.line_cost,
              e.is_stock_tracked,
              e.is_active,
              e.notes,
            ],
          );
          report.bom_created_rows += 1;
        }

        // Tambah ongkir
        const maxSeq = expected.length > 0 ? Math.max(...expected.map((e) => e.sequence_no)) : 0;
        const ongkir = generateOngkirRow(sku, maxSeq);

        await client.query(
          `insert into product.product_bom
           (sku, sequence_no, component_group, component_type, inv_code,
            component_name, qty, unit_cost, line_cost,
            is_stock_tracked, is_active, notes)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [
            ongkir.sku,
            ongkir.sequence_no,
            ongkir.component_group,
            ongkir.component_type,
            ongkir.inv_code,
            ongkir.component_name,
            ongkir.qty,
            ongkir.unit_cost,
            ongkir.line_cost,
            ongkir.is_stock_tracked,
            ongkir.is_active,
            ongkir.notes,
          ],
        );
        report.ongkir_created_rows += 1;
      }

      /* ── Step 4: Sinkron total_hpp ── */
      for (const row of targetSkus) {
        const sku = row.sku;

        const costRes = await client.query(
          `select coalesce(sum(line_cost), 0) as total_cost
           from product.product_bom
           where sku = $1 and is_active = true`,
          [sku],
        );

        const totalCost = costRes.rows[0]?.total_cost ?? 0;

        await client.query(
          `update product.master_product
           set total_hpp = $2::decimal, updated_at = now()
           where sku = $1`,
          [sku, totalCost],
        );

        const hppBefore = hppBeforeMap.get(sku) || "0";
        report.sample_before_after_hpp.push({
          sku,
          hpp_before: hppBefore,
          hpp_after: String(totalCost),
        });
      }

      await client.query("COMMIT");

      report.sample_before_after_hpp = report.sample_before_after_hpp.slice(0, 10);

      console.log("\n✅ Execute selesai.");
      console.log(JSON.stringify(report, null, 2));

    } catch (err) {
      await client.query("ROLLBACK");
      report.error_rows += targetSkus.length;
      report.error_skus = targetSkus.map((r) => r.sku);
      report.error_message = err.message;
      console.log("\n❌ ROLLBACK — Error terjadi:");
      console.error(err);
      console.log(JSON.stringify(report, null, 2));
      throw err;
    }

  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});