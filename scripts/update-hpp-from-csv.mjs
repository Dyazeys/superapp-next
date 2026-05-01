import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

const DEFAULT_FILE = "data/master-upload/Master-produk-updated-hpp-value.csv";

function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseCsv(text) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd());

  const nonEmpty = lines
    .map((line, index) => ({ line, rowNumber: index + 1 }))
    .filter((entry) => entry.line.trim().length > 0);

  if (!nonEmpty.length) {
    return { headers: [], rows: [], rowNumbers: [] };
  }

  const headers = splitCsvLine(nonEmpty[0].line).map((header) => header.trim());
  const rows = [];
  const rowNumbers = [];

  for (let index = 1; index < nonEmpty.length; index += 1) {
    const values = splitCsvLine(nonEmpty[index].line);
    const row = {};
    for (let headerIndex = 0; headerIndex < headers.length; headerIndex += 1) {
      row[headers[headerIndex]] = (values[headerIndex] ?? "").trim();
    }
    rows.push(row);
    rowNumbers.push(nonEmpty[index].rowNumber);
  }

  return { headers, rows, rowNumbers };
}

async function main() {
  const fileArg = process.argv[2] || DEFAULT_FILE;
  const mode = process.argv[3] || "dry-run"; // "dry-run" | "execute"

  const filePath = path.resolve(process.cwd(), fileArg);
  const csvText = fs.readFileSync(filePath, "utf8");
  const parsed = parseCsv(csvText);

  if (!parsed.headers.length) {
    throw new Error("CSV file is empty.");
  }

  // Validasi header
  const requiredHeaders = ["sku", "total_hpp"];
  const missingHeaders = requiredHeaders.filter((h) => !parsed.headers.includes(h));
  if (missingHeaders.length) {
    throw new Error(`Missing required headers: ${missingHeaders.join(", ")}`);
  }

  const client = new Client({
    connectionString: process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL,
  });
  await client.connect();

  try {
    // Step 1: Validasi semua SKU di CSV vs database
    const allSku = parsed.rows.map((r) => String(r.sku ?? "").trim()).filter(Boolean);
    const uniqueSku = [...new Set(allSku)];

    const products = await client.query(
      `select sku, total_hpp::text from product.master_product where sku = any($1::varchar[])`,
      [uniqueSku],
    );

    const dbSkuMap = new Map(products.rows.map((r) => [r.sku, r.total_hpp]));
    const unmatchedKeys = [];
    const beforeSnapshots = [];

    for (const sku of uniqueSku) {
      const dbHpp = dbSkuMap.get(sku);
      if (dbHpp === undefined) {
        unmatchedKeys.push(sku);
      }
    }

    // Step 2: Bangun snapshot before
    const csvRowMap = new Map(); // sku -> total_hpp (last wins if duplicate)
    for (const row of parsed.rows) {
      const sku = String(row.sku ?? "").trim();
      if (!sku) continue;
      csvRowMap.set(sku, String(row.total_hpp ?? "0").trim());
    }

    const matchedSkus = [];
    for (const sku of uniqueSku) {
      if (dbSkuMap.has(sku)) {
        const hppBefore = dbSkuMap.get(sku);
        const hppAfter = csvRowMap.get(sku) ?? hppBefore;
        if (hppBefore !== hppAfter) {
          beforeSnapshots.push({ sku, hpp_before: hppBefore, hpp_after: hppAfter });
        }
        matchedSkus.push(sku);
      }
    }

    // Step 3: Laporan
    const report = {
      file: path.relative(process.cwd(), filePath),
      mode,
      total_csv_rows: parsed.rows.length,
      unique_sku_in_csv: uniqueSku.length,
      matched_sku_in_db: matchedSkus.length,
      unmatched_sku_count: unmatchedKeys.length,
      unmatched_keys: unmatchedKeys,
      rows_with_changes: beforeSnapshots.length,
      sample_before_after: beforeSnapshots.slice(0, 10),
    };

    if (mode === "dry-run") {
      console.log(JSON.stringify({ action: "DRY_RUN", ...report }, null, 2));
      console.log("\n✅ Dry-run selesai. Tidak ada perubahan database.");
      console.log(`➡️  Gunakan: node scripts/update-hpp-from-csv.mjs [file.csv] execute`);
    } else if (mode === "execute") {
      // Step 4: Update dalam 1 transaksi
      await client.query("BEGIN");

      try {
        let updatedRows = 0;
        for (const snap of beforeSnapshots) {
          await client.query(
            `update product.master_product
             set total_hpp = $2::decimal, updated_at = now()
             where sku = $1`,
            [snap.sku, snap.hpp_after],
          );
          updatedRows += 1;
        }

        report.updated_rows = updatedRows;
        report.failed_rows = 0;

        await client.query("COMMIT");

        console.log(JSON.stringify({ action: "EXECUTE", ...report }, null, 2));
        console.log(`\n✅ Update selesai. ${updatedRows} row diubah.`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    } else {
      throw new Error(`Invalid mode "${mode}". Gunakan "dry-run" atau "execute".`);
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});