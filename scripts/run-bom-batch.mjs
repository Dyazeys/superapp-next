#!/usr/bin/env node
/**
 * run-bom-batch.mjs
 *
 * Batch executor untuk semua file TXT BOM template.
 * Loop semua file di data/master-upload/BOM-TEMPLATE/,
 * parse, generate BOM, tambah ongkir, sinkron total_hpp.
 *
 * Usage:
 *   node scripts/run-bom-batch.mjs [dry-run|execute]
 *
 * Contoh:
 *   node scripts/run-bom-batch.mjs dry-run
 *   node scripts/run-bom-batch.mjs execute
 *
 * Guardrails:
 *   - Exact match product_name (tidak pakai ILIKE)
 *   - Idempotent: delete+insert per SKU
 *   - Rollback otomatis jika gagal
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

const TEMPLATE_DIR = "data/master-upload/BOM-TEMPLATE";
const ONGKIR_COST = 2500;
const ONGKIR_NAME = "ongkir barang masuk";

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

  if (!header.product_name) {
    throw new Error(`Template missing "product_name" header`);
  }

  // Validasi: setiap block harus punya component_group, component_type, component_name, qty,
  // dan salah satu dari unit_cost atau unit_cost_source
  for (const b of blocks) {
    if (!b.fields.component_group) throw new Error(`Block missing "component_group"`);
    if (!b.fields.component_type) throw new Error(`Block missing "component_type"`);
    if (!b.fields.component_name) throw new Error(`Block missing "component_name"`);
    if (!b.fields.qty) throw new Error(`Block missing "qty"`);
    if (!b.fields.unit_cost && !b.fields.unit_cost_source) {
      throw new Error(`Block missing "unit_cost" or "unit_cost_source"`);
    }
    // Normalisasi: jika pakai unit_cost_source, anggap unit_cost
    if (b.fields.unit_cost_source && !b.fields.unit_cost) {
      b.fields.unit_cost = b.fields.unit_cost_source;
    }
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
      if (k === "unit_cost" || k === "unit_cost_source") continue; // handle separately
      resolved[k] = resolvePlaceholders(v, skuRow);
    }

    // Ambil cost dari unit_cost (sudah dinormalisasi)
    const unitCostRaw = resolvePlaceholders(block.fields.unit_cost || "0", skuRow);
    const unitCost = Number(unitCostRaw) || 0;

    // component_name sudah di-resolve di atas, tapi pastikan juga
    const componentName = resolvePlaceholders(block.fields.component_name, skuRow);

    const qty = Number(resolved.qty) || 0;

    rows.push({
      sku: skuRow.sku,
      sequence_no: Number(resolved.sequence_no) || 0,
      component_group: resolved.component_group,
      component_type: resolved.component_type,
      inv_code: resolved.inv_code || null,
      component_name: componentName,
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
    component_name: ONGKIR_NAME,
    qty: 1,
    unit_cost: ONGKIR_COST,
    line_cost: ONGKIR_COST,
    is_stock_tracked: false,
    is_active: true,
    notes: "Auto from BOM batch script",
  };
}

function formatRupiah(num) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
}

/* ────────── MAIN ────────── */

async function main() {
  const mode = (process.argv[2] || "dry-run").toLowerCase();

  if (!["dry-run", "execute"].includes(mode)) {
    console.error(`Invalid mode "${mode}". Gunakan "dry-run" atau "execute".`);
    process.exit(1);
  }

  const templateDir = path.resolve(process.cwd(), TEMPLATE_DIR);
  if (!fs.existsSync(templateDir)) {
    console.error(`Template directory not found: ${templateDir}`);
    process.exit(1);
  }

  // Kumpulkan semua file TXT
  const files = fs.readdirSync(templateDir)
    .filter(f => f.startsWith("bom-template-") && f.endsWith(".txt"))
    .sort();

  if (files.length === 0) {
    console.error(`Tidak ada file template ditemukan di ${templateDir}`);
    process.exit(1);
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log(`📋 BOM BATCH EXECUTOR — Mode: ${mode.toUpperCase()}`);
  console.log(`   Template files ditemukan: ${files.length}`);
  console.log(`${"=".repeat(70)}\n`);

  // Parse semua template dulu untuk validasi awal
  const templates = [];
  const parseErrors = [];

  for (const file of files) {
    const tmplPath = path.join(templateDir, file);
    try {
      const tmpl = parseTemplate(tmplPath);
      templates.push(tmpl);
    } catch (err) {
      parseErrors.push({ file, error: err.message });
    }
  }

  if (parseErrors.length > 0) {
    console.log(`\n❌ Parse errors (${parseErrors.length}):`);
    for (const pe of parseErrors) {
      console.log(`   - ${pe.file}: ${pe.error}`);
    }
    console.log("\nPerbaiki template sebelum melanjutkan.");
    process.exit(1);
  }

  /* ── Koneksi DB ── */
  const client = new Client({
    connectionString: process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL,
  });
  await client.connect();

  const globalReport = {
    mode,
    total_templates: templates.length,
    executed_templates: 0,
    skipped_templates: [],
    error_templates: [],
    total_target_sku: 0,
    total_bom_created_rows: 0,
    total_ongkir_created_rows: 0,
    total_hpp_updated_sku: 0,
    reports: [],
    total_duration_ms: 0,
  };

  const startTime = Date.now();

  try {
    for (let i = 0; i < templates.length; i++) {
      const tmpl = templates[i];
      const { header, blocks, filePath: templateFile } = tmpl;
      const productName = header.product_name;

      const fileLabel = `[${i + 1}/${templates.length}] ${templateFile}`;
      console.log(`\n${"─".repeat(70)}`);
      console.log(`📄 ${fileLabel}`);
      console.log(`   product_name: "${productName}"`);
      console.log(`   blocks parsed: ${blocks.length}`);

      const report = {
        template_file: templateFile,
        product_name: productName,
        target_sku_count: 0,
        matched_sku: [],
        bom_created_rows: 0,
        bom_updated_rows: 0,
        ongkir_created_rows: 0,
        ongkir_skipped_duplicate_rows: 0,
        error_rows: 0,
        error_skus: [],
        sample_before_after_hpp: [],
        status: "pending",
      };

      try {
        /* ── Ambil SKU target (exact match) ── */
        const skuRes = await client.query(
          `select sku, product_name, inv_main, inv_acc, total_hpp::text
           from product.master_product
           where product_name = $1
           order by sku`,
          [productName],
        );

        const targetSkus = skuRes.rows;
        report.target_sku_count = targetSkus.length;
        report.matched_sku = targetSkus.map((r) => r.sku);
        report.status = "ok";

        if (targetSkus.length === 0) {
          console.log(`   ⚠️  product_name "${productName}" tidak match ke SKU mana pun.`);
          globalReport.skipped_templates.push(templateFile);
          globalReport.reports.push(report);
          continue;
        }

        report.status = "has_sku";
        globalReport.executed_templates += 1;

        console.log(`   🎯 Target SKU: ${targetSkus.length}`);

        /* ── Generate expected rows ── */
        const expectedMap = new Map();
        for (const row of targetSkus) {
          expectedMap.set(row.sku, generateExpectedRows(row, blocks));
        }

        /* ── Snapshot before HPP ── */
        const hppBeforeMap = new Map();
        for (const row of targetSkus) {
          hppBeforeMap.set(row.sku, row.total_hpp);
        }

        if (mode === "dry-run") {
          console.log(`   🔍 DRY RUN — Tidak ada perubahan database.`);
          let totalBomRows = 0;
          let sampleCount = 0;

          for (const row of targetSkus) {
            const expected = expectedMap.get(row.sku) || [];
            const maxSeq = expected.length > 0 ? Math.max(...expected.map((e) => e.sequence_no)) : 0;
            const ongkir = generateOngkirRow(row.sku, maxSeq);
            const totalCost = expected.reduce((sum, e) => sum + e.line_cost, 0) + ongkir.line_cost;
            totalBomRows += expected.length;

            if (sampleCount < 3) {
              console.log(`\n   📦 ${row.sku} (inv_main=${row.inv_main ?? "—"}, inv_acc=${row.inv_acc ?? "—"})`);
              console.log(`      BOM rows: ${expected.length} + 1 ongkir`);
              console.log(`      HPP: ${formatRupiah(Number(row.total_hpp))} → ${formatRupiah(totalCost)}`);
              sampleCount++;
            }
          }

          report.bom_created_rows = totalBomRows;
          report.ongkir_created_rows = targetSkus.length;

          console.log(`\n   📊 Sub-total: ${targetSkus.length} SKU, ${totalBomRows} BOM rows, ${targetSkus.length} ongkir rows`);
          globalReport.reports.push(report);
          continue;
        }

        /* ── EXECUTE MODE ── */
        console.log(`   ⚡ EXECUTE — Memproses update BOM...`);

        await client.query("BEGIN");

        try {
          for (const row of targetSkus) {
            const sku = row.sku;
            const expected = expectedMap.get(sku) || [];

            // Hapus semua BOM untuk SKU ini, lalu rebuild
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

            // Tambah ongkir (idempotent karena delete BOM sudah hapus semua)
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

          /* ── Sinkron total_hpp ── */
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

            globalReport.total_hpp_updated_sku += 1;
          }

          await client.query("COMMIT");

          // Simpan hanya sampling 5 SKU untuk laporan
          report.sample_before_after_hpp = report.sample_before_after_hpp.slice(0, 5);
          report.status = "executed";

          globalReport.total_target_sku += targetSkus.length;
          globalReport.total_bom_created_rows += report.bom_created_rows;
          globalReport.total_ongkir_created_rows += report.ongkir_created_rows;

          console.log(`   ✅ ${targetSkus.length} SKU selesai (${report.bom_created_rows} BOM rows, ${report.ongkir_created_rows} ongkir)`);
          globalReport.reports.push(report);

        } catch (err) {
          await client.query("ROLLBACK");
          report.error_rows += targetSkus.length;
          report.error_skus = targetSkus.map((r) => r.sku);
          report.error_message = err.message;
          report.status = "error";
          globalReport.error_templates.push(templateFile);
          globalReport.reports.push(report);
          console.log(`   ❌ ROLLBACK — ${err.message}`);
          // Jangan throw, lanjut ke template berikutnya
        }

      } catch (err) {
        report.error_rows = -1;
        report.error_message = err.message;
        report.status = "error";
        globalReport.error_templates.push(templateFile);
        globalReport.reports.push(report);
        console.log(`   ❌ Error: ${err.message}`);
      }
    }

    globalReport.total_duration_ms = Date.now() - startTime;

    /* ── Tampilkan Ringkasan Global ── */
    console.log(`\n${"=".repeat(70)}`);
    console.log(`📊 RINGKASAN GLOBAL — ${mode.toUpperCase()}`);
    console.log(`${"=".repeat(70)}`);

    if (mode === "dry-run") {
      const withSku = globalReport.reports.filter(r => r.status === "has_sku");
      const withoutSku = globalReport.reports.filter(r => r.status === "ok" && r.target_sku_count === 0);
      const totalBomRows = withSku.reduce((s, r) => s + r.bom_created_rows, 0);
      const totalOngkirRows = withSku.reduce((s, r) => s + r.ongkir_created_rows, 0);

      console.log(`\n✅ Template dengan SKU match: ${withSku.length}/${templates.length}`);
      console.log(`⚠️  Template tanpa SKU match: ${withoutSku.length}/${templates.length}`);
      console.log(`📦 Total target SKU: ${withSku.reduce((s, r) => s + r.target_sku_count, 0)}`);
      console.log(`📋 Total BOM rows akan dibuat: ${totalBomRows}`);
      console.log(`🚚 Total ongkir rows akan dibuat: ${totalOngkirRows}`);
      console.log(`⏱️  Durasi: ${(globalReport.total_duration_ms / 1000).toFixed(1)} detik\n`);

      console.log(`📋 Daftar template tanpa SKU match:`);
      for (const r of withoutSku) {
        console.log(`   ⚠️  ${r.template_file} → product_name "${r.product_name}"`);
      }

    } else {
      console.log(`\n✅ Template dieksekusi: ${globalReport.executed_templates}/${templates.length}`);
      console.log(`❌ Template error: ${globalReport.error_templates.length}`);
      console.log(`📦 Total SKU diproses: ${globalReport.total_target_sku}`);
      console.log(`📋 Total BOM rows dibuat: ${globalReport.total_bom_created_rows}`);
      console.log(`🚚 Total ongkir rows dibuat: ${globalReport.total_ongkir_created_rows}`);
      console.log(`💰 Total HPP updated: ${globalReport.total_hpp_updated_sku} SKU`);
      console.log(`⏱️  Durasi: ${(globalReport.total_duration_ms / 1000).toFixed(1)} detik\n`);
    }

    /* ── Tampilkan detail per template ── */
    console.log(`${"=".repeat(70)}`);
    console.log(`📋 LAPORAN DETAIL PER TEMPLATE`);
    console.log(`${"=".repeat(70)}`);
    console.log(`\n${"template_file".padEnd(35)} | product_name${"".padEnd(12)} | SKU | BOM | Ongkir | Status`);
    console.log(`─`.repeat(90));

    for (const r of globalReport.reports) {
      const status = r.status === "executed" ? "✅" : r.status === "has_sku" ? "🔍" : r.status === "ok" ? "⚠️" : "❌";
      const skuStr = String(r.target_sku_count).padStart(3);
      const bomStr = String(r.bom_created_rows).padStart(5);
      const ongkirStr = String(r.ongkir_created_rows).padStart(5);
      const name = r.product_name.padEnd(20);
      const file = r.template_file.padEnd(35);
      console.log(`${file} | ${name} | ${skuStr} | ${bomStr} | ${ongkirStr} | ${status}`);
    }

    // Output JSON untuk programmatic use
    console.log(`\n${"=".repeat(70)}`);
    console.log(`📄 RAW REPORT (JSON)`);
    console.log(`${"=".repeat(70)}`);
    console.log(JSON.stringify(globalReport, null, 2));

  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});