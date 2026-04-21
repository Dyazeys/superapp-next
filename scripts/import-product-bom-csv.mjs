import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

const DEFAULT_FILE = "data/master-upload/bom-from-updated-templates.fixed.csv";

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

function asNullableString(value) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

function asBoolean(value, fallback = false) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return fallback;
  if (["true", "1", "yes", "y", "active"].includes(normalized)) return true;
  if (["false", "0", "no", "n", "inactive"].includes(normalized)) return false;
  throw new Error(`Invalid boolean value "${value}"`);
}

function normalizeGroup(value) {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "OVERHEAD" || normalized === "OTHER_COST") return "BRANDING";
  if (normalized === "ACCESORY") return "ACCESSORY";
  return normalized;
}

function normalizeType(value) {
  const normalized = String(value ?? "").trim().toUpperCase();
  return normalized === "NON_INVENTORY" ? "NON_INVENTORY" : "INVENTORY";
}

async function main() {
  const fileArg = process.argv[2] || DEFAULT_FILE;
  const filePath = path.resolve(process.cwd(), fileArg);
  const csvText = fs.readFileSync(filePath, "utf8");
  const parsed = parseCsv(csvText);

  if (!parsed.headers.length) {
    throw new Error("CSV file is empty.");
  }

  const requiredHeaders = [
    "sku",
    "component_group",
    "component_type",
    "component_name",
    "qty",
    "unit_cost",
    "is_stock_tracked",
    "sequence_no",
    "is_active",
  ];

  const missingHeaders = requiredHeaders.filter((header) => !parsed.headers.includes(header));
  if (missingHeaders.length) {
    throw new Error(`Missing required headers: ${missingHeaders.join(", ")}`);
  }

  const client = new Client({
    connectionString: process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL,
  });
  await client.connect();

  const summary = {
    file: path.relative(process.cwd(), filePath),
    total_rows: parsed.rows.length,
    created_rows: 0,
    updated_rows: 0,
    skipped_rows: 0,
    error_rows: 0,
    touched_skus: 0,
  };
  const errors = [];
  const touchedSkus = new Set();

  try {
    for (let index = 0; index < parsed.rows.length; index += 1) {
      const row = parsed.rows[index];
      const rowNumber = parsed.rowNumbers[index] ?? index + 2;

      try {
        const sku = String(row.sku ?? "").trim();
        const component_group = normalizeGroup(row.component_group);
        const component_type = normalizeType(row.component_type);
        const inv_code = asNullableString(row.inv_code);
        const component_name = String(row.component_name ?? "").trim();
        const qty = String(row.qty ?? "").trim();
        const unit_cost = String(row.unit_cost ?? "").trim();
        const sequence_no = Number(row.sequence_no);
        const is_stock_tracked = asBoolean(row.is_stock_tracked, false);
        const is_active = asBoolean(row.is_active, true);
        const notes = asNullableString(row.notes);

        if (!sku || !component_group || !component_name || !qty || !unit_cost) {
          throw new Error("Missing required BOM values.");
        }
        if (!Number.isFinite(Number(qty)) || Number(qty) <= 0) {
          throw new Error("Invalid qty.");
        }
        if (!Number.isFinite(Number(unit_cost)) || Number(unit_cost) < 0) {
          throw new Error("Invalid unit_cost.");
        }
        if (!Number.isInteger(sequence_no) || sequence_no < 1) {
          throw new Error("Invalid sequence_no.");
        }
        if ((component_type === "INVENTORY" || is_stock_tracked) && !inv_code) {
          throw new Error("Inventory/stock-tracked row requires inv_code.");
        }

        const product = await client.query(
          `select sku from product.master_product where sku = $1 limit 1`,
          [sku],
        );
        if (!product.rows.length) {
          summary.skipped_rows += 1;
          continue;
        }

        if (inv_code) {
          const inventory = await client.query(
            `select inv_code from product.master_inventory where inv_code = $1 limit 1`,
            [inv_code],
          );
          if (!inventory.rows.length) {
            throw new Error(`Inventory reference "${inv_code}" was not found.`);
          }
        }

        const existing = await client.query(
          `select id
           from product.product_bom
           where sku = $1
             and component_group = $2
             and component_type = $3
             and coalesce(inv_code, '') = coalesce($4, '')
             and sequence_no = $5
           order by created_at asc
           limit 1`,
          [sku, component_group, component_type, inv_code, sequence_no],
        );

        const line_cost = (Number(qty) * Number(unit_cost)).toFixed(2);
        if (!existing.rows.length) {
          await client.query(
            `insert into product.product_bom (
               sku,
               component_group,
               component_type,
               inv_code,
               component_name,
               qty,
               unit_cost,
               line_cost,
               is_stock_tracked,
               notes,
               sequence_no,
               is_active
             ) values (
               $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
             )`,
            [
              sku,
              component_group,
              component_type,
              inv_code,
              component_name,
              qty,
              unit_cost,
              line_cost,
              is_stock_tracked,
              notes,
              sequence_no,
              is_active,
            ],
          );
          summary.created_rows += 1;
        } else {
          await client.query(
            `update product.product_bom
             set component_group = $2,
                 component_type = $3,
                 inv_code = $4,
                 component_name = $5,
                 qty = $6,
                 unit_cost = $7,
                 line_cost = $8,
                 is_stock_tracked = $9,
                 notes = $10,
                 sequence_no = $11,
                 is_active = $12,
                 updated_at = now()
             where id = $1`,
            [
              existing.rows[0].id,
              component_group,
              component_type,
              inv_code,
              component_name,
              qty,
              unit_cost,
              line_cost,
              is_stock_tracked,
              notes,
              sequence_no,
              is_active,
            ],
          );
          summary.updated_rows += 1;
        }

        touchedSkus.add(sku);
      } catch (error) {
        summary.error_rows += 1;
        errors.push({
          row: rowNumber,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    for (const sku of touchedSkus) {
      const aggregate = await client.query(
        `select coalesce(sum(line_cost), 0)::text as total_hpp
         from product.product_bom
         where sku = $1 and is_active = true`,
        [sku],
      );
      await client.query(
        `update product.master_product
         set total_hpp = $2, updated_at = now()
         where sku = $1`,
        [sku, aggregate.rows[0].total_hpp],
      );
    }

    summary.touched_skus = touchedSkus.size;
    console.log(
      JSON.stringify(
        {
          summary,
          errors_preview: errors.slice(0, 50),
        },
        null,
        2,
      ),
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
