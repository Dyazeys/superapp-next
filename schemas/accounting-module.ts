import { z } from "zod";

const decimalInput = z
  .union([z.string(), z.number()])
  .transform((value) => String(value))
  .refine((value) => value.trim().length > 0, "Enter a valid number")
  .refine((value) => Number.isFinite(Number(value)), "Enter a valid number")
  .refine((value) => Number(value) >= 0, "Value cannot be negative");

const dateInput = z
  .string()
  .min(1, "Date is required")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date");

const optionalUuid = z
  .union([z.string().uuid(), z.literal(""), z.null(), z.undefined()])
  .transform((value) => {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    return value;
  });

const nullableTrimmedString = (max: number) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
      if (value == null) {
        return null;
      }

      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    })
    .refine((value) => value == null || value.length <= max, `Must be ${max} characters or fewer`);

export const operationalExpenseSchema = z.object({
  expense_date: dateInput,
  expense_account_id: z.string().uuid("Expense account is required"),
  payment_account_id: optionalUuid,
  expense_label: nullableTrimmedString(100),
  is_product_barter: z.boolean().default(false),
  qty: z.coerce.number().int().min(0).default(0),
  amount: decimalInput,
  description: z.string().trim().min(1, "Description is required").max(500),
  receipt_url: nullableTrimmedString(255),
  inv_code: nullableTrimmedString(100),
});

export const operationalExpensePatchSchema = z.object({
  expense_date: dateInput.optional(),
  expense_account_id: z.string().uuid("Expense account is required").optional(),
  payment_account_id: optionalUuid.optional(),
  expense_label: nullableTrimmedString(100).optional(),
  is_product_barter: z.boolean().optional(),
  qty: z.coerce.number().int().min(0).optional(),
  amount: decimalInput.optional(),
  description: z.string().trim().min(1, "Description is required").max(500).optional(),
  receipt_url: nullableTrimmedString(255).optional(),
  inv_code: nullableTrimmedString(100).optional(),
});

export const operationalExpenseBarterSchema = z.object({
  barter_date: dateInput,
  expense_account_id: z.string().uuid("Expense account is required"),
  expense_label: nullableTrimmedString(100),
  description: z.string().trim().min(1, "Description is required").max(500),
  reference_no: nullableTrimmedString(100),
  notes_internal: nullableTrimmedString(500),
});

export const operationalExpenseBarterPatchSchema = z.object({
  barter_date: dateInput.optional(),
  expense_account_id: z.string().uuid("Expense account is required").optional(),
  expense_label: nullableTrimmedString(100).optional(),
  description: z.string().trim().min(1, "Description is required").max(500).optional(),
  reference_no: nullableTrimmedString(100).optional(),
  notes_internal: nullableTrimmedString(500).optional(),
});

export const operationalExpenseBarterItemSchema = z.object({
  inv_code: z.string().trim().min(1, "Inventory is required").max(100),
  qty: z.coerce.number().int().min(1, "Qty must be greater than zero"),
  unit_amount: decimalInput,
  notes: nullableTrimmedString(500),
});

export const operationalExpenseBarterItemPatchSchema = z.object({
  inv_code: z.string().trim().min(1, "Inventory is required").max(100).optional(),
  qty: z.coerce.number().int().min(1, "Qty must be greater than zero").optional(),
  unit_amount: decimalInput.optional(),
  notes: nullableTrimmedString(500).optional(),
});

export type OperationalExpenseInput = z.infer<typeof operationalExpenseSchema>;
export type OperationalExpensePatchInput = z.infer<typeof operationalExpensePatchSchema>;
export type OperationalExpenseBarterInput = z.infer<typeof operationalExpenseBarterSchema>;
export type OperationalExpenseBarterPatchInput = z.infer<typeof operationalExpenseBarterPatchSchema>;
export type OperationalExpenseBarterItemInput = z.infer<typeof operationalExpenseBarterItemSchema>;
export type OperationalExpenseBarterItemPatchInput = z.infer<typeof operationalExpenseBarterItemPatchSchema>;
