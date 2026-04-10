import "server-only";
import { z } from "zod";
import { prisma } from "@/db/prisma";
import { parseCsv } from "@/lib/csv";
import { channelSchema } from "@/schemas/channel-module";
import { masterInventorySchema, masterProductSchema, productCategorySchema } from "@/schemas/product-module";
import { salesCustomerSchema } from "@/schemas/sales-module";
import { vendorSchema } from "@/schemas/warehouse-module";

export const MASTER_IMPORT_KEYS = [
  "channel",
  "customer",
  "product_category",
  "product",
  "inventory",
  "vendor",
] as const;

export type MasterImportKey = (typeof MASTER_IMPORT_KEYS)[number];
export type MasterImportMode = "upsert" | "skip_duplicate";

export type MasterImportError = {
  row: number;
  message: string;
};

export type MasterImportResult = {
  master: MasterImportKey;
  mode: MasterImportMode;
  summary: {
    total_rows: number;
    success_rows: number;
    created_rows: number;
    updated_rows: number;
    skipped_rows: number;
    error_rows: number;
  };
  errors: MasterImportError[];
};

type ImportDefinition = {
  label: string;
  description: string;
  allowedColumns: string[];
  requiredColumns: string[];
};

export const MASTER_IMPORT_DEFINITIONS: Record<MasterImportKey, ImportDefinition> = {
  channel: {
    label: "Channel",
    description: "Master channel + mapping akun + kategori/group.",
    allowedColumns: [
      "channel_id",
      "channel_name",
      "slug",
      "is_marketplace",
      "category_name",
      "group_name",
      "piutang_account_code",
      "revenue_account_code",
      "saldo_account_code",
    ],
    requiredColumns: ["channel_name"],
  },
  customer: {
    label: "Customer",
    description: "Master customer non-transaksi.",
    allowedColumns: ["customer_id", "customer_name", "phone", "email", "is_active"],
    requiredColumns: ["customer_name"],
  },
  product_category: {
    label: "Product Category",
    description: "Master kategori produk.",
    allowedColumns: ["category_code", "category_name", "parent_category_code", "is_active"],
    requiredColumns: ["category_code", "category_name"],
  },
  product: {
    label: "Product",
    description: "Master produk/SKU.",
    allowedColumns: [
      "sku",
      "category_code",
      "sku_name",
      "product_name",
      "color",
      "color_code",
      "size",
      "variations",
      "busa_code",
      "inv_main",
      "inv_acc",
      "is_bundling",
      "is_active",
      "price_mp",
      "price_non_mp",
      "total_hpp",
    ],
    requiredColumns: ["sku", "sku_name", "product_name", "price_mp", "price_non_mp"],
  },
  inventory: {
    label: "Inventory",
    description: "Master inventory/bahan.",
    allowedColumns: ["inv_code", "inv_name", "description", "hpp", "is_active"],
    requiredColumns: ["inv_code", "inv_name", "hpp"],
  },
  vendor: {
    label: "Vendor",
    description: "Master vendor warehouse.",
    allowedColumns: ["vendor_code", "vendor_name", "pic_name", "phone", "address", "is_active"],
    requiredColumns: ["vendor_code", "vendor_name"],
  },
};

function normalizeHeader(value: string) {
  return value.trim().toLowerCase();
}

function asNullableString(value: string | undefined) {
  const trimmed = (value ?? "").trim();
  return trimmed.length ? trimmed : null;
}

function asBoolean(value: string | undefined, fallback = false) {
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized) return fallback;
  if (["true", "1", "yes", "y", "active"].includes(normalized)) return true;
  if (["false", "0", "no", "n", "inactive"].includes(normalized)) return false;
  throw new Error(`Invalid boolean value "${value}". Use true/false or 1/0.`);
}

function asOptionalPositiveInt(value: string | undefined) {
  const normalized = (value ?? "").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid integer value "${value}".`);
  }
  return parsed;
}

type RowAction = "created" | "updated" | "skipped";

async function handleChannelRow(
  row: Record<string, string>,
  mode: MasterImportMode,
  refs: {
    accountIdByCode: Map<string, string>;
    groupIdByName: Map<string, number>;
    categoryIdByKey: Map<string, number>;
  }
): Promise<RowAction> {
  const categoryName = asNullableString(row.category_name);
  const groupName = asNullableString(row.group_name);
  if (!categoryName && groupName) {
    throw new Error("group_name cannot be set when category_name is empty.");
  }

  const resolveAccountId = (code: string | null, label: string) => {
    if (!code) return null;
    const id = refs.accountIdByCode.get(code);
    if (!id) {
      throw new Error(`${label} account code "${code}" was not found.`);
    }
    return id;
  };

  const piutangAccountId = resolveAccountId(asNullableString(row.piutang_account_code), "piutang");
  const revenueAccountId = resolveAccountId(asNullableString(row.revenue_account_code), "revenue");
  const saldoAccountId = resolveAccountId(asNullableString(row.saldo_account_code), "saldo");

  let categoryId: number | null = null;
  if (categoryName) {
    let groupId: number | null = null;
    if (groupName) {
      const groupKey = groupName.toLowerCase();
      if (refs.groupIdByName.has(groupKey)) {
        groupId = refs.groupIdByName.get(groupKey) ?? null;
      } else {
        const existingGroup = await prisma.m_channel_group.findUnique({
          where: { group_name: groupName },
          select: { group_id: true },
        });
        if (existingGroup) {
          groupId = existingGroup.group_id;
        } else {
          const createdGroup = await prisma.m_channel_group.create({
            data: { group_name: groupName },
            select: { group_id: true },
          });
          groupId = createdGroup.group_id;
        }
        refs.groupIdByName.set(groupKey, groupId);
      }
    }

    const categoryKey = `${categoryName.toLowerCase()}::${groupId ?? "null"}`;
    if (refs.categoryIdByKey.has(categoryKey)) {
      categoryId = refs.categoryIdByKey.get(categoryKey) ?? null;
    } else {
      const existingCategory = await prisma.m_channel_category.findFirst({
        where: {
          category_name: categoryName,
          group_id: groupId,
        },
        orderBy: { category_id: "asc" },
        select: { category_id: true },
      });
      if (existingCategory) {
        categoryId = existingCategory.category_id;
      } else {
        const createdCategory = await prisma.m_channel_category.create({
          data: {
            category_name: categoryName,
            group_id: groupId,
          },
          select: { category_id: true },
        });
        categoryId = createdCategory.category_id;
      }
      refs.categoryIdByKey.set(categoryKey, categoryId);
    }
  }

  const payload = channelSchema.parse({
    category_id: categoryId,
    channel_name: row.channel_name,
    slug: asNullableString(row.slug),
    piutang_account_id: piutangAccountId,
    revenue_account_id: revenueAccountId,
    saldo_account_id: saldoAccountId,
    is_marketplace: asBoolean(row.is_marketplace, false),
  });

  const channelId = asOptionalPositiveInt(row.channel_id);
  const slug = asNullableString(row.slug);
  const channelName = row.channel_name.trim();
  const existing =
    (channelId
      ? await prisma.m_channel.findUnique({ where: { channel_id: channelId }, select: { channel_id: true } })
      : null) ??
    (slug
      ? await prisma.m_channel.findUnique({ where: { slug }, select: { channel_id: true } })
      : null) ??
    (await prisma.m_channel.findFirst({
      where: { channel_name: channelName },
      orderBy: { channel_id: "asc" },
      select: { channel_id: true },
    }));

  if (existing) {
    if (mode === "skip_duplicate") {
      return "skipped";
    }
    await prisma.m_channel.update({
      where: { channel_id: existing.channel_id },
      data: {
        category_id: payload.category_id,
        channel_name: payload.channel_name,
        slug: payload.slug || null,
        piutang_account_id: payload.piutang_account_id,
        revenue_account_id: payload.revenue_account_id,
        saldo_account_id: payload.saldo_account_id,
        is_marketplace: payload.is_marketplace,
        updated_at: new Date(),
      },
    });
    return "updated";
  }

  await prisma.m_channel.create({
    data: {
      category_id: payload.category_id,
      channel_name: payload.channel_name,
      slug: payload.slug || null,
      piutang_account_id: payload.piutang_account_id,
      revenue_account_id: payload.revenue_account_id,
      saldo_account_id: payload.saldo_account_id,
      is_marketplace: payload.is_marketplace,
    },
  });
  return "created";
}

async function handleCustomerRow(row: Record<string, string>, mode: MasterImportMode): Promise<RowAction> {
  const payload = salesCustomerSchema.parse({
    customer_name: row.customer_name,
    phone: asNullableString(row.phone),
    email: asNullableString(row.email),
    is_active: asBoolean(row.is_active, true),
  });

  const customerId = asOptionalPositiveInt(row.customer_id);
  const email = asNullableString(row.email);
  const customerName = row.customer_name.trim();
  const phone = asNullableString(row.phone);
  const existing =
    (customerId
      ? await prisma.master_customer.findUnique({
          where: { customer_id: customerId },
          select: { customer_id: true },
        })
      : null) ??
    (email
      ? await prisma.master_customer.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
          select: { customer_id: true },
        })
      : null) ??
    (await prisma.master_customer.findFirst({
      where: { customer_name: customerName, phone },
      orderBy: { customer_id: "asc" },
      select: { customer_id: true },
    }));

  if (existing) {
    if (mode === "skip_duplicate") {
      return "skipped";
    }
    await prisma.master_customer.update({
      where: { customer_id: existing.customer_id },
      data: {
        customer_name: payload.customer_name,
        phone: payload.phone,
        email: payload.email,
        is_active: payload.is_active,
        updated_at: new Date(),
      },
    });
    return "updated";
  }

  await prisma.master_customer.create({
    data: {
      customer_name: payload.customer_name,
      phone: payload.phone,
      email: payload.email,
      is_active: payload.is_active,
    },
  });
  return "created";
}

async function handleProductCategoryRow(row: Record<string, string>, mode: MasterImportMode): Promise<RowAction> {
  const categoryCode = row.category_code.trim();
  const parentCategoryCode = asNullableString(row.parent_category_code);
  const payload = productCategorySchema.parse({
    category_code: categoryCode,
    parent_category_code: parentCategoryCode,
    category_name: row.category_name,
    is_active: asBoolean(row.is_active, true),
  });

  if (parentCategoryCode && parentCategoryCode === categoryCode) {
    throw new Error("parent_category_code cannot be the same as category_code.");
  }

  if (parentCategoryCode) {
    const parent = await prisma.category_product.findUnique({
      where: { category_code: parentCategoryCode },
      select: { category_code: true },
    });
    if (!parent) {
      throw new Error(`Parent category "${parentCategoryCode}" was not found.`);
    }
  }

  const existing = await prisma.category_product.findUnique({
    where: { category_code: categoryCode },
    select: { category_code: true },
  });

  if (existing) {
    if (mode === "skip_duplicate") {
      return "skipped";
    }
    await prisma.category_product.update({
      where: { category_code: categoryCode },
      data: {
        category_name: payload.category_name,
        parent_category_code: payload.parent_category_code || null,
        is_active: payload.is_active,
        updated_at: new Date(),
      },
    });
    return "updated";
  }

  await prisma.category_product.create({
    data: {
      category_code: payload.category_code,
      category_name: payload.category_name,
      parent_category_code: payload.parent_category_code || null,
      is_active: payload.is_active,
    },
  });
  return "created";
}

async function handleProductRow(row: Record<string, string>, mode: MasterImportMode): Promise<RowAction> {
  const payload = masterProductSchema.parse({
    sku: row.sku,
    category_code: asNullableString(row.category_code),
    sku_name: row.sku_name,
    product_name: row.product_name,
    color: asNullableString(row.color),
    color_code: asNullableString(row.color_code),
    size: asNullableString(row.size),
    variations: asNullableString(row.variations),
    busa_code: asNullableString(row.busa_code),
    inv_main: asNullableString(row.inv_main),
    inv_acc: asNullableString(row.inv_acc),
    is_bundling: asBoolean(row.is_bundling, false),
    is_active: asBoolean(row.is_active, true),
    price_mp: row.price_mp,
    price_non_mp: row.price_non_mp,
    total_hpp: (row.total_hpp ?? "").trim() || "0",
  });

  if (payload.category_code) {
    const category = await prisma.category_product.findUnique({
      where: { category_code: payload.category_code },
      select: { category_code: true },
    });
    if (!category) {
      throw new Error(`Category "${payload.category_code}" was not found.`);
    }
  }

  if (payload.inv_main) {
    const inventory = await prisma.master_inventory.findUnique({
      where: { inv_code: payload.inv_main },
      select: { inv_code: true },
    });
    if (!inventory) {
      throw new Error(`Main inventory "${payload.inv_main}" was not found.`);
    }
  }

  if (payload.inv_acc) {
    const inventory = await prisma.master_inventory.findUnique({
      where: { inv_code: payload.inv_acc },
      select: { inv_code: true },
    });
    if (!inventory) {
      throw new Error(`Accessory inventory "${payload.inv_acc}" was not found.`);
    }
  }

  const existing = await prisma.master_product.findUnique({
    where: { sku: payload.sku },
    select: { sku: true },
  });
  if (existing) {
    if (mode === "skip_duplicate") {
      return "skipped";
    }
    await prisma.master_product.update({
      where: { sku: payload.sku },
      data: {
        category_code: payload.category_code || null,
        sku_name: payload.sku_name,
        product_name: payload.product_name,
        color: payload.color || null,
        color_code: payload.color_code || null,
        size: payload.size || null,
        variations: payload.variations || null,
        busa_code: payload.busa_code || null,
        inv_main: payload.inv_main || null,
        inv_acc: payload.inv_acc || null,
        is_bundling: payload.is_bundling,
        is_active: payload.is_active,
        price_mp: payload.price_mp,
        price_non_mp: payload.price_non_mp,
        total_hpp: payload.total_hpp,
        updated_at: new Date(),
      },
    });
    return "updated";
  }

  await prisma.master_product.create({
    data: {
      sku: payload.sku,
      category_code: payload.category_code || null,
      sku_name: payload.sku_name,
      product_name: payload.product_name,
      color: payload.color || null,
      color_code: payload.color_code || null,
      size: payload.size || null,
      variations: payload.variations || null,
      busa_code: payload.busa_code || null,
      inv_main: payload.inv_main || null,
      inv_acc: payload.inv_acc || null,
      is_bundling: payload.is_bundling,
      is_active: payload.is_active,
      price_mp: payload.price_mp,
      price_non_mp: payload.price_non_mp,
      total_hpp: payload.total_hpp,
    },
  });
  return "created";
}

async function handleInventoryRow(row: Record<string, string>, mode: MasterImportMode): Promise<RowAction> {
  const payload = masterInventorySchema.parse({
    inv_code: row.inv_code,
    inv_name: row.inv_name,
    description: asNullableString(row.description),
    hpp: row.hpp,
    is_active: asBoolean(row.is_active, true),
  });

  const existing = await prisma.master_inventory.findUnique({
    where: { inv_code: payload.inv_code },
    select: { inv_code: true },
  });
  if (existing) {
    if (mode === "skip_duplicate") {
      return "skipped";
    }
    await prisma.master_inventory.update({
      where: { inv_code: payload.inv_code },
      data: {
        inv_name: payload.inv_name,
        description: payload.description || null,
        hpp: payload.hpp,
        is_active: payload.is_active,
        updated_at: new Date(),
      },
    });
    return "updated";
  }

  await prisma.master_inventory.create({
    data: {
      inv_code: payload.inv_code,
      inv_name: payload.inv_name,
      description: payload.description || null,
      hpp: payload.hpp,
      is_active: payload.is_active,
    },
  });
  return "created";
}

async function handleVendorRow(row: Record<string, string>, mode: MasterImportMode): Promise<RowAction> {
  const payload = vendorSchema.parse({
    vendor_code: row.vendor_code,
    vendor_name: row.vendor_name,
    pic_name: asNullableString(row.pic_name),
    phone: asNullableString(row.phone),
    address: asNullableString(row.address),
    is_active: asBoolean(row.is_active, true),
  });

  const existing = await prisma.master_vendor.findUnique({
    where: { vendor_code: payload.vendor_code },
    select: { vendor_code: true },
  });
  if (existing) {
    if (mode === "skip_duplicate") {
      return "skipped";
    }
    await prisma.master_vendor.update({
      where: { vendor_code: payload.vendor_code },
      data: {
        vendor_name: payload.vendor_name,
        pic_name: payload.pic_name || null,
        phone: payload.phone || null,
        address: payload.address || null,
        is_active: payload.is_active,
        updated_at: new Date(),
      },
    });
    return "updated";
  }

  await prisma.master_vendor.create({
    data: {
      vendor_code: payload.vendor_code,
      vendor_name: payload.vendor_name,
      pic_name: payload.pic_name || null,
      phone: payload.phone || null,
      address: payload.address || null,
      is_active: payload.is_active,
    },
  });
  return "created";
}

function toMasterMode(value: string | undefined | null): MasterImportMode {
  if (value === "skip_duplicate") return "skip_duplicate";
  return "upsert";
}

function assertMaster(value: string): MasterImportKey {
  if ((MASTER_IMPORT_KEYS as readonly string[]).includes(value)) {
    return value as MasterImportKey;
  }
  throw new Error(`Unsupported master "${value}".`);
}

function validateColumns(master: MasterImportKey, headers: string[]) {
  const definition = MASTER_IMPORT_DEFINITIONS[master];
  const unknown = headers.filter((header) => !definition.allowedColumns.includes(header));
  if (unknown.length > 0) {
    throw new Error(`Unknown columns for ${master}: ${unknown.join(", ")}`);
  }

  const missing = definition.requiredColumns.filter((required) => !headers.includes(required));
  if (missing.length > 0) {
    throw new Error(`Missing required columns for ${master}: ${missing.join(", ")}`);
  }
}

function normalizeRows(headers: string[], rows: Array<Record<string, string>>) {
  const normalizedHeaders = headers.map(normalizeHeader);
  const duplicateHeaders = normalizedHeaders.filter((header, index) => normalizedHeaders.indexOf(header) !== index);
  if (duplicateHeaders.length > 0) {
    throw new Error(`Duplicate CSV headers: ${[...new Set(duplicateHeaders)].join(", ")}`);
  }

  const normalizedRows = rows.map((row) => {
    const normalized: Record<string, string> = {};
    for (let i = 0; i < headers.length; i += 1) {
      normalized[normalizedHeaders[i]] = row[headers[i]] ?? "";
    }
    return normalized;
  });

  return { normalizedHeaders, normalizedRows };
}

export async function importMasterDataCsv(input: {
  master: string;
  csvText: string;
  mode?: string | null;
}): Promise<MasterImportResult> {
  const master = assertMaster(input.master);
  const mode = toMasterMode(input.mode);
  const parsed = parseCsv(input.csvText);
  if (parsed.headers.length === 0) {
    throw new Error("CSV file is empty.");
  }

  const { normalizedHeaders, normalizedRows } = normalizeRows(parsed.headers, parsed.rows);
  validateColumns(master, normalizedHeaders);

  const summary = {
    total_rows: normalizedRows.length,
    success_rows: 0,
    created_rows: 0,
    updated_rows: 0,
    skipped_rows: 0,
    error_rows: 0,
  };
  const errors: MasterImportError[] = [];

  const refs = {
    accountIdByCode: new Map<string, string>(),
    groupIdByName: new Map<string, number>(),
    categoryIdByKey: new Map<string, number>(),
  };
  if (master === "channel") {
    const accounts = await prisma.accounts.findMany({
      select: { id: true, code: true },
    });
    for (const account of accounts) {
      refs.accountIdByCode.set(account.code, account.id);
    }
  }

  for (let index = 0; index < normalizedRows.length; index += 1) {
    const row = normalizedRows[index];
    const rowNumber = parsed.rowNumbers[index] ?? index + 2;

    try {
      const action =
        master === "channel"
          ? await handleChannelRow(row, mode, refs)
          : master === "customer"
            ? await handleCustomerRow(row, mode)
            : master === "product_category"
              ? await handleProductCategoryRow(row, mode)
              : master === "product"
                ? await handleProductRow(row, mode)
                : master === "inventory"
                  ? await handleInventoryRow(row, mode)
                  : await handleVendorRow(row, mode);

      summary.success_rows += 1;
      if (action === "created") summary.created_rows += 1;
      if (action === "updated") summary.updated_rows += 1;
      if (action === "skipped") summary.skipped_rows += 1;
    } catch (error) {
      summary.error_rows += 1;
      const message =
        error instanceof z.ZodError
          ? error.issues[0]?.message ?? "Validation error."
          : error instanceof Error
            ? error.message
            : "Unknown error";
      errors.push({ row: rowNumber, message });
    }
  }

  return {
    master,
    mode,
    summary,
    errors,
  };
}
