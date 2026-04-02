import { z } from "zod";

const decimalInput = z
  .union([z.string(), z.number()])
  .transform((value) => String(value))
  .refine((value) => !Number.isNaN(Number(value)), "Enter a valid number");

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
  status: z.string().min(1, "Status is required").max(20),
});

export const inboundDeliverySchema = z.object({
  po_id: z.string().optional().nullable(),
  receive_date: dateInput,
  surat_jalan_vendor: z.string().max(100).optional().nullable(),
  qc_status: z.string().min(1, "QC status is required").max(20),
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
});

export const adjustmentSchema = z.object({
  adjustment_date: dateInput,
  inv_code: z.string().min(1, "Inventory code is required").max(100),
  adj_type: z.enum(["IN", "OUT"]),
  qty: z.coerce.number().int().min(1),
  reason: z.string().min(2, "Reason is required"),
  approved_by: z.string().max(100).optional().nullable(),
});

export type VendorInput = z.infer<typeof vendorSchema>;
export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;
export type InboundDeliveryInput = z.infer<typeof inboundDeliverySchema>;
export type InboundItemInput = z.infer<typeof inboundItemSchema>;
export type AdjustmentInput = z.infer<typeof adjustmentSchema>;
