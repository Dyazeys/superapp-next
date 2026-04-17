import { z } from "zod";

export const WAREHOUSE_PO_STATUS_OPTIONS = ["OPEN", "PARTIAL", "CLOSED"] as const;
export const WAREHOUSE_QC_STATUS_OPTIONS = ["PENDING", "PARTIAL", "PASSED", "REJECTED"] as const;
export const WAREHOUSE_ADJUSTMENT_TYPE_OPTIONS = ["IN", "OUT"] as const;

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

export const vendorSchema = z.object({
  vendor_code: z.string().min(1, "Vendor code is required").max(100),
  vendor_name: z.string().min(2, "Vendor name is required").max(255),
  pic_name: z.string().max(100).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

export const purchaseOrderSchema = z.object({
  po_number: z.string().min(1, "PO number is required").max(50),
  vendor_code: z.string().min(1, "Vendor is required").max(100),
  order_date: dateInput,
  status: z.enum(WAREHOUSE_PO_STATUS_OPTIONS),
});

export const inboundDeliverySchema = z.object({
  po_id: z.string().optional().nullable(),
  receive_date: dateInput,
  surat_jalan_vendor: z.string().max(100).optional().nullable(),
  qc_status: z.enum(WAREHOUSE_QC_STATUS_OPTIONS),
  received_by: z.string().min(1, "Receiver is required").max(100),
  notes: z.string().optional().nullable(),
});

export const inboundItemSchema = z.object({
  inbound_id: z.string().min(1, "Inbound is required"),
  inv_code: z.string().min(1, "Inventory code is required").max(100),
  qty_received: z.coerce.number().int().min(0),
  qty_passed_qc: z.coerce.number().int().min(0),
  qty_rejected_qc: z.coerce.number().int().min(0),
  unit_cost: z
    .union([decimalInput, z.literal(""), z.null(), z.undefined()])
    .transform((value) => {
      if (value === null || value === undefined || value === "") return null;
      return String(value);
    }),
}).superRefine((value, context) => {
  if (value.qty_passed_qc + value.qty_rejected_qc > value.qty_received) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["qty_passed_qc"],
      message: "Passed and rejected QC cannot exceed received quantity",
    });
  }

  if (value.qty_received === 0 && (value.qty_passed_qc > 0 || value.qty_rejected_qc > 0)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["qty_received"],
      message: "Received quantity must be greater than zero when QC quantities exist",
    });
  }
});

export const inboundItemPatchSchema = z.object({
  inbound_id: z.string().min(1, "Inbound is required").optional(),
  inv_code: z.string().min(1, "Inventory code is required").max(100).optional(),
  qty_received: z.coerce.number().int().min(0).optional(),
  qty_passed_qc: z.coerce.number().int().min(0).optional(),
  qty_rejected_qc: z.coerce.number().int().min(0).optional(),
  unit_cost: z
    .union([decimalInput, z.literal(""), z.null(), z.undefined()])
    .transform((value) => {
      if (value === null || value === undefined || value === "") return null;
      return String(value);
    })
    .optional(),
});

export const adjustmentSchema = z.object({
  adjustment_date: dateInput,
  inv_code: z.string().min(1, "Inventory code is required").max(100),
  adj_type: z.enum(WAREHOUSE_ADJUSTMENT_TYPE_OPTIONS),
  qty: z.coerce.number().int().min(1),
  reason: z.string().min(2, "Reason is required"),
  approved_by: z.string().max(100).optional().nullable(),
});

export type VendorInput = z.infer<typeof vendorSchema>;
export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;
export type InboundDeliveryInput = z.infer<typeof inboundDeliverySchema>;
export type InboundItemInput = z.infer<typeof inboundItemSchema>;
export type InboundItemPatchInput = z.infer<typeof inboundItemPatchSchema>;
export type AdjustmentInput = z.infer<typeof adjustmentSchema>;
