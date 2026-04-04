import { z } from "zod";

const decimalInput = z
  .union([z.string(), z.number()])
  .transform((value) => String(value))
  .refine((value) => value.trim().length > 0, "Enter a valid number")
  .refine((value) => Number.isFinite(Number(value)), "Enter a valid number")
  .refine((value) => Number(value) >= 0, "Value cannot be negative");

export const productCategorySchema = z.object({
  category_code: z.string().min(1, "Category code is required").max(50),
  parent_category_code: z.string().max(50).optional().nullable(),
  category_name: z.string().min(2, "Category name is required").max(150),
  is_active: z.boolean(),
});

export const masterInventorySchema = z.object({
  inv_code: z.string().min(1, "Inventory code is required").max(100),
  inv_name: z.string().min(2, "Inventory name is required").max(255),
  description: z.string().optional().nullable(),
  hpp: decimalInput,
  is_active: z.boolean(),
});

export const masterProductSchema = z.object({
  sku: z.string().min(1, "SKU is required").max(100),
  category_code: z.string().max(50).optional().nullable(),
  sku_name: z.string().min(2, "SKU name is required").max(255),
  product_name: z.string().min(2, "Product name is required").max(255),
  color: z.string().max(100).optional().nullable(),
  color_code: z.string().max(50).optional().nullable(),
  size: z.string().max(50).optional().nullable(),
  variations: z.string().max(150).optional().nullable(),
  busa_code: z.string().max(50).optional().nullable(),
  inv_main: z.string().max(100).optional().nullable(),
  inv_acc: z.string().max(100).optional().nullable(),
  is_bundling: z.boolean(),
  is_active: z.boolean(),
  price_mp: decimalInput,
  price_non_mp: decimalInput,
  total_hpp: decimalInput.default("0"),
});

export const productBomSchema = z.object({
  sku: z.string().min(1, "SKU is required").max(100),
  component_group: z.string().min(1, "Group is required").max(50),
  component_type: z.string().min(1, "Type is required").max(50),
  inv_code: z.string().max(100).optional().nullable(),
  component_name: z.string().min(1, "Component name is required").max(255),
  qty: decimalInput,
  unit_cost: decimalInput,
  is_stock_tracked: z.boolean(),
  notes: z.string().optional().nullable(),
  sequence_no: z.coerce.number().int().min(1),
  is_active: z.boolean(),
}).superRefine((value, context) => {
  if (Number(value.qty) <= 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["qty"],
      message: "Quantity must be greater than zero",
    });
  }

  if (value.is_stock_tracked && !value.inv_code) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["inv_code"],
      message: "Tracked BOM rows require an inventory reference",
    });
  }

  if (value.component_type === "INVENTORY" && !value.inv_code) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["inv_code"],
      message: "Inventory BOM rows require an inventory reference",
    });
  }
});

export type ProductCategoryInput = z.infer<typeof productCategorySchema>;
export type MasterInventoryInput = z.infer<typeof masterInventorySchema>;
export type MasterProductInput = z.infer<typeof masterProductSchema>;
export type ProductBomInput = z.infer<typeof productBomSchema>;
export type ProductCategoryFormValues = z.input<typeof productCategorySchema>;
export type MasterInventoryFormValues = z.input<typeof masterInventorySchema>;
export type MasterProductFormValues = z.input<typeof masterProductSchema>;
export type ProductBomFormValues = z.input<typeof productBomSchema>;
