import { z } from "zod";
import { CANONICAL_PAYOUT_STATUSES } from "@/lib/payout-status";

export const PAYOUT_STATUS_OPTIONS = CANONICAL_PAYOUT_STATUSES;
export const PAYOUT_ADJUSTMENT_TYPE_OPTIONS = ["MANUAL", "FEE", "REFUND", "REVERSAL", "PROMO", "OTHER"] as const;

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

const optionalDateInput = z
  .union([z.string(), z.null(), z.undefined()])
  .refine(
    (value) => value == null || value === "" || !Number.isNaN(Date.parse(value)),
    "Enter a valid date"
  )
  .transform((value) => (value ? value : null));

export const payoutSchema = z.object({
  ref: z.string().max(100).optional().nullable(),
  payout_date: dateInput,
  qty_produk: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  hpp: decimalInput.default("0"),
  total_price: decimalInput.default("0"),
  seller_discount: decimalInput.default("0"),
  fee_admin: decimalInput.default("0"),
  fee_service: decimalInput.default("0"),
  fee_order_process: decimalInput.default("0"),
  fee_program: decimalInput.default("0"),
  fee_affiliate: decimalInput.default("0"),
  shipping_cost: decimalInput.default("0"),
  omset: decimalInput.default("0"),
  payout_status: z.enum(PAYOUT_STATUS_OPTIONS).optional().nullable(),
}).superRefine((value, context) => {
  if (Number(value.omset) > Number(value.total_price)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["omset"],
      message: "Net payout cannot exceed gross amount",
    });
  }
});

export const payoutPatchSchema = z.object({
  ref: z.string().max(100).optional().nullable(),
  payout_date: dateInput.optional(),
  qty_produk: z.coerce.number().int().min(1, "Quantity must be at least 1").optional(),
  hpp: decimalInput.optional(),
  total_price: decimalInput.optional(),
  seller_discount: decimalInput.optional(),
  fee_admin: decimalInput.optional(),
  fee_service: decimalInput.optional(),
  fee_order_process: decimalInput.optional(),
  fee_program: decimalInput.optional(),
  fee_affiliate: decimalInput.optional(),
  shipping_cost: decimalInput.optional(),
  omset: decimalInput.optional(),
  payout_status: z.enum(PAYOUT_STATUS_OPTIONS).optional().nullable(),
}).superRefine((value, context) => {
  if (value.omset !== undefined && value.total_price !== undefined) {
    if (Number(value.omset) > Number(value.total_price)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["omset"],
        message: "Net payout cannot exceed gross amount",
      });
    }
  }
});

export const payoutAdjustmentSchema = z.object({
  ref: z.string().max(100).optional().nullable(),
  marketplace: z.string().max(100).optional().nullable(),
  post: z.string().max(100).optional().nullable(),
  payout_date: dateInput,
  adjustment_date: optionalDateInput,
  channel_id: z.coerce.number().int().optional().nullable(),
  adjustment_type: z.enum(PAYOUT_ADJUSTMENT_TYPE_OPTIONS).optional().nullable(),
  reason: z.string().optional().nullable(),
  amount: decimalInput,
});

export const payoutTransferSchema = z.object({
  payout_id: z.coerce.number().int().positive("Payout is required"),
  transfer_date: dateInput,
  amount: decimalInput,
  bank_account_id: z.string().uuid("Bank account is required"),
  notes: z.string().optional().nullable(),
});

export type PayoutInput = z.infer<typeof payoutSchema>;
export type PayoutPatchInput = z.infer<typeof payoutPatchSchema>;
export type PayoutAdjustmentInput = z.infer<typeof payoutAdjustmentSchema>;
export type PayoutTransferInput = z.infer<typeof payoutTransferSchema>;
