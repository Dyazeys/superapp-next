import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT_DIR = process.cwd();
const MASTER_PRODUCT_CSV = path.join(ROOT_DIR, "data", "master-upload", "Master Produk - Edited.csv");
const TEMPLATE_DIR = path.join(ROOT_DIR, "data", "master-upload", "bom-templates-per-product", "updated");
const OUTPUT_CSV = path.join(ROOT_DIR, "data", "master-upload", "bom-from-updated-templates.fixed.csv");
const OUTPUT_ERROR_JSON = path.join(ROOT_DIR, "data", "master-upload", "bom-from-updated-templates.fixed.errors.json");
const DEFAULT_DEDUP_KEYS = ["sku", "component_group", "component_type", "inv_code", "sequence_no"];
const CSV_HEADERS = [
  "sku",
  "component_group",
  "component_type",
  "inv_code",
  "component_name",
  "qty",
  "unit_cost",
  "is_stock_tracked",
  "notes",
  "sequence_no",
  "is_active",
];

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);
  return result;
}

function parseCsvText(text) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.length > 0);

  if (!lines.length) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    for (let index = 0; index < headers.length; index += 1) {
      row[headers[index]] = (values[index] ?? "").trim();
    }
    return row;
  });
}

function parseSimpleBool(value, fallback) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return fallback;
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;
  return fallback;
}

function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function asNullableString(value) {
  const text = asString(value);
  return text.length ? text : null;
}

function toPositiveNumber(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function normalizeComponentGroup(value) {
  const normalized = asString(value).toUpperCase();
  if (!normalized) return "MAIN";
  if (normalized === "OVERHEAD") return "BRANDING";
  if (normalized === "OTHER_COST") return "BRANDING";
  if (normalized === "ACCESORY") return "ACCESSORY";
  return normalized;
}

function normalizeComponentType(value) {
  const normalized = asString(value).toUpperCase();
  if (normalized === "NON_INVENTORY") return "NON_INVENTORY";
  return "INVENTORY";
}

function parseSimpleWhen(value) {
  const raw = asString(value);
  if (!raw || raw.toLowerCase() === "always") {
    return undefined;
  }

  const parts = raw.split(":").map((item) => item.trim()).filter(Boolean);
  if (parts.length < 2) {
    return undefined;
  }

  const field = parts[0].toLowerCase();
  const operator = parts[1].toLowerCase();
  if (field !== "inv_main" && field !== "inv_acc") {
    return undefined;
  }

  if (operator === "not_null") {
    return { [field]: { not: null } };
  }

  if (operator === "eq" && parts.length >= 3) {
    return { [field]: { eq: parts.slice(2).join(":") } };
  }

  return undefined;
}

function buildRuleFromKv(rowKv) {
  return {
    when: parseSimpleWhen(rowKv.get("when")),
    bom_rows: [
      {
        sequence_no: rowKv.get("sequence_no") || "1",
        component_group: rowKv.get("component_group") || "MAIN",
        component_type: rowKv.get("component_type") || "INVENTORY",
        inv_code: rowKv.get("inv_code") || "",
        component_name: rowKv.get("component_name") || "",
        qty: rowKv.get("qty") || "1",
        unit_cost_source: rowKv.get("unit_cost_source") || "",
        unit_cost: rowKv.get("unit_cost") || "",
        is_stock_tracked: parseSimpleBool(rowKv.get("is_stock_tracked"), true),
        is_active: parseSimpleBool(rowKv.get("is_active"), true),
        notes: rowKv.get("notes") || null,
      },
    ],
  };
}

function parseTemplateText(input, sourceName) {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#") && !line.startsWith("//"));

  let productName = "";
  let deduplicateKeys = [...DEFAULT_DEDUP_KEYS];
  const rules = [];
  let rowKv = null;

  for (const line of lines) {
    if (/^row_begin$/i.test(line)) {
      rowKv = new Map();
      continue;
    }

    if (/^row_end$/i.test(line)) {
      if (rowKv) {
        rules.push(buildRuleFromKv(rowKv));
        rowKv = null;
      }
      continue;
    }

    if (rowKv) {
      const separatorIndex = line.includes(":") ? line.indexOf(":") : line.indexOf("=");
      if (separatorIndex > -1) {
        const key = line.slice(0, separatorIndex).trim().toLowerCase();
        const value = line.slice(separatorIndex + 1).trim();
        if (key) rowKv.set(key, value);
      }
      continue;
    }

    if (/^product_name\s*[:=]/i.test(line)) {
      productName = line.replace(/^product_name\s*[:=]\s*/i, "").trim();
      continue;
    }

    if (/^deduplicate_key\s*[:=]/i.test(line)) {
      const raw = line.replace(/^deduplicate_key\s*[:=]\s*/i, "").trim();
      const keys = raw.split(",").map((item) => item.trim()).filter(Boolean);
      if (keys.length) {
        deduplicateKeys = keys;
      }
    }
  }

  if (!productName) {
    throw new Error(`Template ${sourceName} tidak punya product_name.`);
  }

  if (!rules.length) {
    throw new Error(`Template ${sourceName} tidak punya row_begin/row_end valid.`);
  }

  return { product_name: productName, deduplicate_keys: deduplicateKeys, rules };
}

function shouldApplyRule(product, when) {
  if (!when) return true;

  for (const [field, condition] of Object.entries(when)) {
    const markerValue = field === "inv_main" ? product.inv_main : field === "inv_acc" ? product.inv_acc : null;
    if (!condition || typeof condition !== "object") {
      continue;
    }

    if ("not" in condition && condition.not === null && !markerValue) {
      return false;
    }

    const eqValue = condition.eq ?? condition.equals;
    if (typeof eqValue === "string" && markerValue !== eqValue.trim()) {
      return false;
    }
  }

  return true;
}

function resolveMarkerToken(value, product) {
  return String(value ?? "")
    .replaceAll("{{INV_MAIN}}", product.inv_main ?? "")
    .replaceAll("{{INV_ACC}}", product.inv_acc ?? "");
}

function resolveUnitCost(row) {
  const unitCostSourceRaw = asString(row.unit_cost_source);
  if (unitCostSourceRaw.length > 0) {
    const numeric = Number(unitCostSourceRaw);
    if (Number.isFinite(numeric) && numeric >= 0) {
      return numeric;
    }
  }

  const unitCostRaw = asString(row.unit_cost);
  if (unitCostRaw.length > 0) {
    const numeric = Number(unitCostRaw);
    if (Number.isFinite(numeric) && numeric >= 0) {
      return numeric;
    }
  }

  throw new Error("Unit cost wajib angka. Isi unit_cost_source dengan nominal atau isi unit_cost.");
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function formatQty(value) {
  return formatNumericText(value, 4);
}

function formatCost(value) {
  return formatNumericText(value, 2);
}

function formatNumericText(value, maxDecimals) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "";
  }

  const fixed = numeric.toFixed(maxDecimals);
  return fixed.replace(/\.?0+$/, "");
}

function dedupKeyForRow(row, deduplicateKeys) {
  return deduplicateKeys.map((key) => row[key] ?? "").join("|");
}

async function main() {
  const [masterCsvText, templateFiles] = await Promise.all([
    readFile(MASTER_PRODUCT_CSV, "utf8"),
    readdir(TEMPLATE_DIR, { withFileTypes: true }),
  ]);

  const masterProducts = parseCsvText(masterCsvText).map((row) => ({
    sku: asString(row.sku),
    product_name: asString(row.product_name),
    inv_main: asNullableString(row.inv_main),
    inv_acc: asNullableString(row.inv_acc),
  }));

  const productMap = new Map();
  for (const product of masterProducts) {
    if (!product.product_name) continue;
    const current = productMap.get(product.product_name) ?? [];
    current.push(product);
    productMap.set(product.product_name, current);
  }

  const txtFiles = templateFiles
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".txt"))
    .sort((left, right) => left.name.localeCompare(right.name));

  const outputRows = [];
  const errors = [];

  for (const entry of txtFiles) {
    const filePath = path.join(TEMPLATE_DIR, entry.name);
    let template;

    try {
      const templateText = await readFile(filePath, "utf8");
      template = parseTemplateText(templateText, entry.name);
    } catch (error) {
      errors.push({
        template_file: entry.name,
        product_name: null,
        sku: null,
        message: error instanceof Error ? error.message : "Gagal parse template.",
      });
      continue;
    }

    const targets = productMap.get(template.product_name) ?? [];
    if (!targets.length) {
      errors.push({
        template_file: entry.name,
        product_name: template.product_name,
        sku: null,
        message: "Tidak ada SKU master untuk product_name ini.",
      });
      continue;
    }

    for (const target of targets) {
      const seen = new Set();

      for (const rule of template.rules) {
        if (!shouldApplyRule(target, rule.when)) {
          continue;
        }

        for (const row of rule.bom_rows ?? []) {
          try {
            const component_group = normalizeComponentGroup(row.component_group);
            const component_type = normalizeComponentType(row.component_type);
            const inv_code = asNullableString(resolveMarkerToken(row.inv_code, target));
            const component_name = resolveMarkerToken(
              asString(row.component_name) || `${component_group} - ${inv_code ?? target.sku}`,
              target,
            );
            const qty = toPositiveNumber(row.qty, 1);
            const unit_cost = resolveUnitCost(row);
            const is_stock_tracked = Boolean(row.is_stock_tracked);
            const sequence_no = Math.max(1, Math.trunc(toPositiveNumber(row.sequence_no, 1)));
            const is_active = row.is_active === undefined ? true : Boolean(row.is_active);
            const notes = asNullableString(row.notes);

            if ((component_type === "INVENTORY" || is_stock_tracked) && !inv_code) {
              throw new Error("Row INVENTORY / stock-tracked wajib punya inv_code setelah marker di-resolve.");
            }

            const outputRow = {
              sku: target.sku,
              component_group,
              component_type,
              inv_code: inv_code ?? "",
              component_name,
              qty: formatQty(qty),
              unit_cost: formatCost(unit_cost),
              is_stock_tracked: String(is_stock_tracked).toLowerCase(),
              notes: notes ?? "",
              sequence_no: String(sequence_no),
              is_active: String(is_active).toLowerCase(),
            };

            const dedupKey = dedupKeyForRow(outputRow, template.deduplicate_keys);
            if (seen.has(dedupKey)) {
              continue;
            }

            seen.add(dedupKey);
            outputRows.push(outputRow);
          } catch (error) {
            errors.push({
              template_file: entry.name,
              product_name: template.product_name,
              sku: target.sku,
              message: error instanceof Error ? error.message : "Gagal build row BOM.",
            });
          }
        }
      }
    }
  }

  outputRows.sort((left, right) => {
    const bySku = left.sku.localeCompare(right.sku);
    if (bySku !== 0) return bySku;
    return Number(left.sequence_no) - Number(right.sequence_no);
  });

  const csvLines = [
    CSV_HEADERS.join(","),
    ...outputRows.map((row) => CSV_HEADERS.map((header) => csvEscape(row[header])).join(",")),
  ];

  await writeFile(OUTPUT_CSV, `${csvLines.join("\n")}\n`, "utf8");
  await writeFile(OUTPUT_ERROR_JSON, `${JSON.stringify(errors, null, 2)}\n`, "utf8");

  console.log(JSON.stringify({
    output_csv: path.relative(ROOT_DIR, OUTPUT_CSV),
    output_error_json: path.relative(ROOT_DIR, OUTPUT_ERROR_JSON),
    total_templates: txtFiles.length,
    total_master_products: masterProducts.length,
    total_output_rows: outputRows.length,
    total_errors: errors.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
