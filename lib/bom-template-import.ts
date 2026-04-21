import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";

export type BomTemplateImportMode = "upsert" | "skip_duplicate";

export type BomTemplateImportError = {
  product_name: string;
  sku: string;
  rule_index: number;
  row_index: number;
  message: string;
};

export type BomTemplateImportResult = {
  mode: BomTemplateImportMode;
  summary: {
    total_templates: number;
    total_skus_targeted: number;
    matched_skus: number;
    processed_rows: number;
    created_rows: number;
    updated_rows: number;
    skipped_rows: number;
    error_rows: number;
  };
  errors: BomTemplateImportError[];
};

type TemplateRoot = {
  execution_rule?: {
    deduplicate_key?: string[];
  };
  products?: TemplateProduct[];
  product?: TemplateProduct;
};

type TemplateProduct = {
  product_name?: string;
  rules?: TemplateRule[];
};

type TemplateRule = {
  when?: Record<string, unknown>;
  bom_rows?: TemplateBomRow[];
};

type TemplateBomRow = {
  sequence_no?: number | string;
  component_group?: string;
  component_type?: string;
  inv_code?: string | null;
  component_name?: string;
  qty?: number | string;
  unit_cost_source?: string;
  unit_cost?: number | string;
  is_stock_tracked?: boolean;
  is_active?: boolean;
  notes?: string | null;
};

type ProductRecord = {
  sku: string;
  product_name: string;
  inv_main: string | null;
  inv_acc: string | null;
};

const DEFAULT_DEDUP_KEYS = ["sku", "component_group", "component_type", "inv_code", "sequence_no"] as const;

function toMode(value: string | null | undefined): BomTemplateImportMode {
  if (value === "skip_duplicate") return "skip_duplicate";
  return "upsert";
}

function toProducts(root: TemplateRoot): TemplateProduct[] {
  if (Array.isArray(root.products)) return root.products;
  if (root.product && typeof root.product === "object") return [root.product];
  return [];
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNullableString(value: unknown) {
  const text = asString(value);
  return text.length ? text : null;
}

function toPositiveNumber(value: unknown, fallback: number) {
  const raw = typeof value === "number" || typeof value === "string" ? Number(value) : fallback;
  if (!Number.isFinite(raw) || raw <= 0) return fallback;
  return raw;
}

function normalizeComponentGroup(value: unknown) {
  const normalized = asString(value).toUpperCase();
  if (!normalized) return "MAIN";
  if (normalized === "OVERHEAD") return "BRANDING";
  return normalized;
}

function normalizeComponentType(value: unknown) {
  const normalized = asString(value).toUpperCase();
  if (normalized === "NON_INVENTORY") return "NON_INVENTORY";
  return "INVENTORY";
}

function shouldApplyRule(product: ProductRecord, when: Record<string, unknown> | undefined) {
  if (!when || typeof when !== "object") return true;

  const checks = Object.entries(when);
  if (!checks.length) return true;

  for (const [key, condition] of checks) {
    const markerValue = key === "inv_main" ? product.inv_main : key === "inv_acc" ? product.inv_acc : null;
    if (typeof condition === "string") {
      const normalized = condition.trim().toLowerCase();
      if (normalized === "not_null" && !markerValue) return false;
      continue;
    }
    if (condition && typeof condition === "object" && "not" in (condition as Record<string, unknown>)) {
      const notValue = (condition as Record<string, unknown>).not;
      if (notValue === null) {
        if (!markerValue) return false;
      }
    }

    if (condition && typeof condition === "object") {
      const conditionRecord = condition as Record<string, unknown>;
      const eqValue = conditionRecord.eq ?? conditionRecord.equals;
      if (typeof eqValue === "string" && markerValue !== eqValue.trim()) return false;
    }
  }

  return true;
}

function resolveMarkerToken(value: string, product: ProductRecord) {
  return value
    .replaceAll("{{INV_MAIN}}", product.inv_main ?? "")
    .replaceAll("{{INV_ACC}}", product.inv_acc ?? "");
}

function resolveUnitCost(row: TemplateBomRow) {
  const unitCostSourceRaw = asString(row.unit_cost_source);

  // Backward-compatible with field usage in templates where unit_cost_source is filled with nominal.
  const sourceAsNumber = Number(unitCostSourceRaw);
  if (Number.isFinite(sourceAsNumber) && sourceAsNumber >= 0) {
    return sourceAsNumber;
  }

  const unitCost = Number(row.unit_cost);
  if (Number.isFinite(unitCost) && unitCost >= 0) {
    return unitCost;
  }

  throw new Error("Unit cost wajib angka. Isi `unit_cost_source` dengan nominal (contoh: 70000) atau isi `unit_cost`.");
}

function parseTemplateText(input: string): { root: TemplateRoot; products: TemplateProduct[] } {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Template TXT kosong.");
  }

  // Backward-compatible: keep supporting JSON template text.
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error("Format TXT tidak valid. Gunakan JSON valid atau format simple key:value.");
    }

    if (!parsed || typeof parsed !== "object") {
      throw new Error("Template TXT JSON harus berupa object.");
    }

    const root = parsed as TemplateRoot;
    const products = toProducts(root);
    if (!products.length) {
      throw new Error("Template JSON tidak memiliki product(s). Gunakan key `products` atau `product`.");
    }

    return { root, products };
  }

  return parseSimpleTemplateText(trimmed);
}

function parseSimpleBool(value: string | undefined, fallback: boolean) {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return fallback;
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;
  return fallback;
}

function parseSimpleWhen(value: string | undefined): Record<string, unknown> | undefined {
  const raw = (value ?? "").trim();
  if (!raw) return undefined;
  if (raw.toLowerCase() === "always") return undefined;

  const parts = raw.split(":").map((item) => item.trim()).filter(Boolean);
  if (parts.length < 2) return undefined;

  const field = parts[0].toLowerCase();
  const op = parts[1].toLowerCase();
  if (field !== "inv_main" && field !== "inv_acc") return undefined;

  if (op === "not_null") {
    return { [field]: { not: null } };
  }

  if (op === "eq" && parts.length >= 3) {
    const eqValue = parts.slice(2).join(":");
    if (!eqValue) return undefined;
    return { [field]: { eq: eqValue } };
  }

  return undefined;
}

function buildRuleFromSimpleKv(kv: Map<string, string>): TemplateRule {
  const bomRow: TemplateBomRow = {
    sequence_no: kv.get("sequence_no") || "1",
    component_group: kv.get("component_group") || "MAIN",
    component_type: kv.get("component_type") || "INVENTORY",
    inv_code: kv.get("inv_code") || "",
    component_name: kv.get("component_name") || "",
    qty: kv.get("qty") || "1",
    unit_cost_source: kv.get("unit_cost_source") || "inventory_unit_price",
    unit_cost: kv.get("unit_cost"),
    is_stock_tracked: parseSimpleBool(kv.get("is_stock_tracked"), true),
    is_active: parseSimpleBool(kv.get("is_active"), true),
    notes: kv.get("notes") || null,
  };

  return {
    when: parseSimpleWhen(kv.get("when")),
    bom_rows: [bomRow],
  };
}

function parseSimpleRowLine(line: string): TemplateRule | null {
  const payload = line.replace(/^row\s*:\s*/i, "").trim();
  if (!payload) return null;

  const chunks = payload
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);

  const kv = new Map<string, string>();
  for (const chunk of chunks) {
    const eqIndex = chunk.indexOf("=");
    if (eqIndex < 0) continue;
    const key = chunk.slice(0, eqIndex).trim().toLowerCase();
    const value = chunk.slice(eqIndex + 1).trim();
    kv.set(key, value);
  }

  return buildRuleFromSimpleKv(kv);
}

function parseSimpleTemplateText(input: string): { root: TemplateRoot; products: TemplateProduct[] } {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#") && !line.startsWith("//"));

  let productName = "";
  let deduplicateKey: string[] = [...DEFAULT_DEDUP_KEYS];
  const rules: TemplateRule[] = [];
  let rowKv: Map<string, string> | null = null;

  for (const line of lines) {
    if (/^row_begin$/i.test(line)) {
      rowKv = new Map<string, string>();
      continue;
    }

    if (/^row_end$/i.test(line)) {
      if (rowKv) {
        rules.push(buildRuleFromSimpleKv(rowKv));
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
      const keys = raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      if (keys.length) deduplicateKey = keys;
      continue;
    }

    if (/^row\s*:/i.test(line)) {
      const rule = parseSimpleRowLine(line);
      if (rule) rules.push(rule);
    }
  }

  if (!productName) {
    throw new Error("Format simple TXT butuh `product_name: ...`.");
  }

  if (!rules.length) {
    throw new Error("Format simple TXT butuh minimal satu `row:`.");
  }

  return {
    root: {
      execution_rule: {
        deduplicate_key: deduplicateKey,
      },
      product: {
        product_name: productName,
        rules,
      },
    },
    products: [
      {
        product_name: productName,
        rules,
      },
    ],
  };
}

export async function importBomTemplateText(input: {
  txtText: string;
  mode?: string | null;
}): Promise<BomTemplateImportResult> {
  const mode = toMode(input.mode);
  const { root, products } = parseTemplateText(input.txtText);
  const dedupKeys = Array.isArray(root.execution_rule?.deduplicate_key)
    ? root.execution_rule?.deduplicate_key ?? [...DEFAULT_DEDUP_KEYS]
    : [...DEFAULT_DEDUP_KEYS];

  const productNames = [...new Set(products.map((item) => asString(item.product_name)).filter(Boolean))];
  if (!productNames.length) {
    throw new Error("Tidak ada product_name valid di template.");
  }

  const masterProducts = await prisma.master_product.findMany({
    where: {
      product_name: { in: productNames },
    },
    select: {
      sku: true,
      product_name: true,
      inv_main: true,
      inv_acc: true,
    },
    orderBy: [{ product_name: "asc" }, { sku: "asc" }],
  });

  const productMap = new Map<string, ProductRecord[]>();
  for (const row of masterProducts) {
    const list = productMap.get(row.product_name) ?? [];
    list.push(row);
    productMap.set(row.product_name, list);
  }

  const summary: BomTemplateImportResult["summary"] = {
    total_templates: products.length,
    total_skus_targeted: 0,
    matched_skus: 0,
    processed_rows: 0,
    created_rows: 0,
    updated_rows: 0,
    skipped_rows: 0,
    error_rows: 0,
  };
  const errors: BomTemplateImportError[] = [];

  for (const productTemplate of products) {
    const productName = asString(productTemplate.product_name);
    if (!productName) continue;

    const targets = productMap.get(productName) ?? [];
    summary.total_skus_targeted += targets.length;
    if (!targets.length) {
      errors.push({
        product_name: productName,
        sku: "-",
        rule_index: 0,
        row_index: 0,
        message: "Tidak ada SKU dengan product_name ini.",
      });
      summary.error_rows += 1;
      continue;
    }

    const rules = Array.isArray(productTemplate.rules) ? productTemplate.rules : [];
    if (!rules.length) {
      errors.push({
        product_name: productName,
        sku: "-",
        rule_index: 0,
        row_index: 0,
        message: "Tidak ada rules di template product.",
      });
      summary.error_rows += 1;
      continue;
    }

    for (const target of targets) {
      summary.matched_skus += 1;

      for (let ruleIndex = 0; ruleIndex < rules.length; ruleIndex += 1) {
        const rule = rules[ruleIndex];
        if (!shouldApplyRule(target, rule.when as Record<string, unknown> | undefined)) {
          continue;
        }

        const bomRows = Array.isArray(rule.bom_rows) ? rule.bom_rows : [];
        for (let rowIndex = 0; rowIndex < bomRows.length; rowIndex += 1) {
          const row = bomRows[rowIndex];

          try {
            const rawInv = asString(row.inv_code);
            const resolvedInvCode = asNullableString(resolveMarkerToken(rawInv, target));
            const componentType = normalizeComponentType(row.component_type);
            const isStockTracked = Boolean(row.is_stock_tracked);
            const componentGroup = normalizeComponentGroup(row.component_group);
            const componentNameRaw = asString(row.component_name) || `${componentGroup} - ${resolvedInvCode ?? target.sku}`;
            const componentName = resolveMarkerToken(componentNameRaw, target);
            const sequenceNo = Math.max(1, Math.trunc(toPositiveNumber(row.sequence_no, 1)));
            const qty = toPositiveNumber(row.qty, 1);
            const unitCost = resolveUnitCost(row);
            const lineCost = Number((qty * unitCost).toFixed(2));

            if ((componentType === "INVENTORY" || isStockTracked) && !resolvedInvCode) {
              throw new Error("BOM INVENTORY / stock-tracked wajib punya inv_code setelah marker di-resolve.");
            }

            const dedupWhere: Prisma.product_bomWhereInput = { sku: target.sku };
            for (const key of dedupKeys) {
              if (key === "sku") continue;
              if (key === "component_group") dedupWhere.component_group = componentGroup;
              if (key === "component_type") dedupWhere.component_type = componentType;
              if (key === "inv_code") dedupWhere.inv_code = resolvedInvCode;
              if (key === "sequence_no") dedupWhere.sequence_no = sequenceNo;
            }

            const existing = await prisma.product_bom.findFirst({
              where: dedupWhere,
              select: { id: true },
              orderBy: { created_at: "asc" },
            });

            if (existing) {
              if (mode === "skip_duplicate") {
                summary.skipped_rows += 1;
                continue;
              }

              await prisma.product_bom.update({
                where: { id: existing.id },
                data: {
                  component_group: componentGroup,
                  component_type: componentType,
                  inv_code: resolvedInvCode,
                  component_name: componentName,
                  qty: qty.toFixed(4),
                  unit_cost: unitCost.toFixed(2),
                  line_cost: lineCost.toFixed(2),
                  is_stock_tracked: isStockTracked,
                  notes: asNullableString(row.notes),
                  sequence_no: sequenceNo,
                  is_active: row.is_active === undefined ? true : Boolean(row.is_active),
                  updated_at: new Date(),
                },
              });
              summary.updated_rows += 1;
              summary.processed_rows += 1;
              continue;
            }

            await prisma.product_bom.create({
              data: {
                sku: target.sku,
                component_group: componentGroup,
                component_type: componentType,
                inv_code: resolvedInvCode,
                component_name: componentName,
                qty: qty.toFixed(4),
                unit_cost: unitCost.toFixed(2),
                line_cost: lineCost.toFixed(2),
                is_stock_tracked: isStockTracked,
                notes: asNullableString(row.notes),
                sequence_no: sequenceNo,
                is_active: row.is_active === undefined ? true : Boolean(row.is_active),
              },
            });
            summary.created_rows += 1;
            summary.processed_rows += 1;
          } catch (error) {
            summary.error_rows += 1;
            errors.push({
              product_name: productName,
              sku: target.sku,
              rule_index: ruleIndex + 1,
              row_index: rowIndex + 1,
              message: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }
      }
    }
  }

  return {
    mode,
    summary,
    errors,
  };
}
