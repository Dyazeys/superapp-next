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

export const salesCustomerSchema = z.object({
  customer_name: z.string().trim().min(1, "Customer name is required").max(255),
  phone: nullableTrimmedString(50),
  email: nullableTrimmedString(255).refine(
    (value) => value == null || z.email().safeParse(value).success,
    "Enter a valid email address"
  ),
  is_active: z.boolean().default(true),
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
export type SalesCustomerInput = z.infer<typeof salesCustomerSchema>;
export type SalesOrderItemInput = z.infer<typeof salesOrderItemSchema>;
