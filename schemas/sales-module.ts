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

export const salesOrderSchema = z.object({
  order_no: z.string().min(1, "Order number is required").max(50),
  order_date: dateInput,
  ref_no: z.string().max(100).optional().nullable(),
  parent_order_no: z.string().max(50).optional().nullable(),
  channel_id: z.coerce.number().int().optional().nullable(),
  customer_id: z.coerce.number().int().optional().nullable(),
  total_amount: decimalInput.default("0"),
  status: z.string().min(1, "Status is required").max(50),
  is_historical: z.boolean().default(false),
});

export const salesOrderItemSchema = z.object({
  order_no: z.string().min(1, "Order number is required").max(50),
  sku: z.string().min(1, "SKU is required").max(100),
  qty: z.coerce.number().int().min(1),
  unit_price: decimalInput,
  discount_item: decimalInput.default("0"),
}).superRefine((value, context) => {
  if (Number(value.discount_item) > value.qty * Number(value.unit_price)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["discount_item"],
      message: "Discount cannot exceed the line gross amount",
    });
  }
});

export type SalesOrderInput = z.infer<typeof salesOrderSchema>;
export type SalesOrderItemInput = z.infer<typeof salesOrderItemSchema>;
