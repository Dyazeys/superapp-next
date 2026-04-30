import { z } from "zod";

/**
 * Schema untuk MpAdsDraft — data iklan marketplace.
 * 14 field utama sesuai type MpAdsDraft di types/marketing.ts.
 */
export const mpAdsDraftSchema = z.object({
  date: z
    .string()
    .min(1, "Tanggal wajib diisi.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD."),
  produk: z
    .string()
    .min(1, "Nama produk wajib diisi.")
    .max(200, "Nama produk maksimal 200 karakter."),
  impression: z.number().min(0, "Tidak boleh negatif."),
  click: z.number().min(0, "Tidak boleh negatif."),
  ctr: z.number().min(0, "Tidak boleh negatif."),
  qty_buyer: z.number().int("Harus bilangan bulat.").min(0, "Tidak boleh negatif."),
  qty_produk: z.number().int("Harus bilangan bulat.").min(0, "Tidak boleh negatif."),
  omset: z.number().min(0, "Tidak boleh negatif."),
  spent: z.number().min(0, "Tidak boleh negatif."),
  roas: z.number().min(0, "Tidak boleh negatif."),
  cancel_qty: z.number().int("Harus bilangan bulat.").min(0, "Tidak boleh negatif."),
  cancel_omset: z.number().min(0, "Tidak boleh negatif."),
  roas_fix: z.number().min(0, "Tidak boleh negatif."),
  target_roas: z.number().min(0, "Tidak boleh negatif."),
});

export const mpAdsDraftCreateSchema = mpAdsDraftSchema;
export const mpAdsDraftUpdateSchema = mpAdsDraftSchema.partial();

export type MpAdsDraftInput = z.infer<typeof mpAdsDraftSchema>;
export type MpAdsDraftUpdateInput = z.infer<typeof mpAdsDraftUpdateSchema>;