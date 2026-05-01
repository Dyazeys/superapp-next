#!/usr/bin/env node
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const defaultCsv = resolve(ROOT, 'data/master-upload/db-payout.csv');
const CONNECTION_STRING = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;
const isDryRun = process.argv.includes('--dry-run');
const BATCH_SIZE = 200;
const fileArgIndex = process.argv.indexOf('--file');
const PAYOUT_CSV =
  fileArgIndex >= 0 && process.argv[fileArgIndex + 1]
    ? resolve(process.cwd(), process.argv[fileArgIndex + 1])
    : defaultCsv;

if (!CONNECTION_STRING) {
  console.error('❌ PRISMA_DATABASE_URL or DATABASE_URL environment variable is required');
  process.exit(1);
}

function parseLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;

    const cols = parseLine(raw);
    const row = {};
    for (let j = 0; j < headers.length; j++) row[headers[j]] = cols[j] ?? '';
    rows.push(row);
  }

  return { headers, rows };
}

function asMoney(value) {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "-" || raw === ".") return 0;

  // Support both:
  // 1) "525000" (plain integer)
  // 2) "525.000" / "1.250" (Indonesian thousands)
  // 3) "1,23" (comma decimal)
  const normalized = raw
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".")
    .replace(/[^0-9.-]/g, "");

  if (!normalized || normalized === "-" || normalized === ".") return 0;
  const num = Number.parseFloat(normalized);
  return Number.isFinite(num) ? num : 0;
}

function asPositiveMoney(value) {
  return Math.abs(asMoney(value));
}

function asInt(value) {
  const num = Number.parseInt(String(value ?? '').replace(/[^0-9-]/g, ''), 10);
  return Number.isFinite(num) ? num : 0;
}

function asDate(value) {
  const text = String(value ?? '').trim();
  const d = new Date(text);
  if (!Number.isFinite(d.getTime())) return null;
  return d;
}

function mapStatus(value) {
  const s = String(value ?? '').trim().toUpperCase();
  if (!s) return null;
  return s;
}

function fmt(n) {
  return new Intl.NumberFormat('id-ID').format(n);
}

async function main() {
  console.log('='.repeat(72));
  console.log(isDryRun ? '🔍 DRY-RUN PAYOUT IMPORT' : '🚀 EXECUTE PAYOUT IMPORT');
  console.log('='.repeat(72));

  const raw = readFileSync(PAYOUT_CSV, 'utf8');
  const parsed = parseCsv(raw);
  const required = ['ref', 'payout_date', 'qty_produk', 'hpp', 'total_price', 'seller_discount', 'fee_admin', 'fee_service', 'fee_order_process', 'fee_program', 'fee_affiliate', 'shipping_cost', 'omset', 'payout_status'];
  const missingHeaders = required.filter((h) => !parsed.headers.includes(h));
  if (missingHeaders.length) {
    console.error(`❌ Missing headers: ${missingHeaders.join(', ')}`);
    process.exit(1);
  }

  const transformed = [];
  const duplicateRefs = new Set();
  const seen = new Set();
  const invalidRows = [];

  for (let i = 0; i < parsed.rows.length; i++) {
    const rowNum = i + 2;
    const r = parsed.rows[i];
    const ref = String(r.ref ?? '').trim();
    if (!ref) {
      invalidRows.push({ rowNum, reason: 'ref kosong' });
      continue;
    }
    if (seen.has(ref)) {
      duplicateRefs.add(ref);
      continue;
    }
    seen.add(ref);

    const payoutDate = asDate(r.payout_date);
    if (!payoutDate) {
      invalidRows.push({ rowNum, ref, reason: `payout_date invalid (${r.payout_date})` });
      continue;
    }

    transformed.push({
      ref,
      payout_date: payoutDate,
      qty_produk: asInt(r.qty_produk),
      hpp: asPositiveMoney(r.hpp),
      total_price: asPositiveMoney(r.total_price),
      seller_discount: asPositiveMoney(r.seller_discount),
      fee_admin: asPositiveMoney(r.fee_admin),
      fee_service: asPositiveMoney(r.fee_service),
      fee_order_process: asPositiveMoney(r.fee_order_process),
      fee_program: asPositiveMoney(r.fee_program),
      fee_affiliate: asPositiveMoney(r.fee_affiliate),
      shipping_cost: asPositiveMoney(r.shipping_cost),
      omset: asPositiveMoney(r.omset),
      payout_status: mapStatus(r.payout_status),
    });
  }

  console.log(`CSV rows: ${fmt(parsed.rows.length)}`);
  console.log(`Valid rows: ${fmt(transformed.length)}`);
  console.log(`Duplicate ref skipped: ${fmt(duplicateRefs.size)}`);
  console.log(`Invalid rows skipped: ${fmt(invalidRows.length)}`);

  const client = new Client({ connectionString: CONNECTION_STRING });
  await client.connect();

  try {
    const refs = transformed.map((x) => x.ref);
    const existingSet = new Set();
    for (let i = 0; i < refs.length; i += BATCH_SIZE) {
      const part = refs.slice(i, i + BATCH_SIZE);
      const q = await client.query('select ref_no from sales.t_order where ref_no = any($1::varchar[])', [part]);
      for (const row of q.rows) existingSet.add(row.ref_no);
    }

    const missingRefs = refs.filter((ref) => !existingSet.has(ref));
    console.log(`Missing ref in sales.t_order: ${fmt(missingRefs.length)}`);
    if (missingRefs.length > 0) {
      console.log(`Sample missing refs: ${missingRefs.slice(0, 20).join(', ')}`);
    }

    const rowsToImport = transformed.filter((x) => existingSet.has(x.ref));

    if (isDryRun) {
      console.log('Dry-run only, no DB writes.');
      return;
    }

    let inserted = 0;
    let updated = 0;

    await client.query('BEGIN');

    for (let i = 0; i < rowsToImport.length; i++) {
      const r = rowsToImport[i];
      const exists = await client.query('select payout_id from payout.t_payout where ref = $1 limit 1', [r.ref]);

      if (exists.rowCount > 0) {
        await client.query(
          `update payout.t_payout
           set payout_date=$2, qty_produk=$3, hpp=$4, total_price=$5, seller_discount=$6,
               fee_admin=$7, fee_service=$8, fee_order_process=$9, fee_program=$10,
               fee_affiliate=$11, shipping_cost=$12, omset=$13, payout_status=$14
           where ref=$1`,
          [
            r.ref, r.payout_date, r.qty_produk, r.hpp, r.total_price, r.seller_discount,
            r.fee_admin, r.fee_service, r.fee_order_process, r.fee_program,
            r.fee_affiliate, r.shipping_cost, r.omset, r.payout_status,
          ]
        );
        updated++;
      } else {
        await client.query(
          `insert into payout.t_payout
           (ref, payout_date, qty_produk, hpp, total_price, seller_discount, fee_admin, fee_service, fee_order_process, fee_program, fee_affiliate, shipping_cost, omset, payout_status)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
          [
            r.ref, r.payout_date, r.qty_produk, r.hpp, r.total_price, r.seller_discount,
            r.fee_admin, r.fee_service, r.fee_order_process, r.fee_program,
            r.fee_affiliate, r.shipping_cost, r.omset, r.payout_status,
          ]
        );
        inserted++;
      }

      if ((i + 1) % 200 === 0) {
        console.log(`Processed ${fmt(i + 1)}/${fmt(rowsToImport.length)} ...`);
      }
    }

    // Sync sales status from payout status
    await client.query(
      `update sales.t_order o
       set status = case p.payout_status
         when 'SETTLED' then 'SUKSES'
         when 'FAILED' then 'RETUR'
         else 'PICKUP'
       end,
       updated_at = now()
       from payout.t_payout p
       where p.ref = o.ref_no`
    );

    await client.query('COMMIT');

    const totalPayout = await client.query('select count(*)::int as n from payout.t_payout');
    console.log('='.repeat(72));
    console.log('✅ PAYOUT IMPORT DONE');
    console.log(`Imported rows (insert): ${fmt(inserted)}`);
    console.log(`Imported rows (update): ${fmt(updated)}`);
    console.log(`Skipped (missing ref): ${fmt(missingRefs.length)}`);
    console.log(`Total rows in payout.t_payout: ${fmt(totalPayout.rows[0].n)}`);
    console.log('='.repeat(72));
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error('❌ Fatal:', e.message);
  process.exit(1);
});
