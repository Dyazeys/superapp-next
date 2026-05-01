import { z } from "zod";

// ─── Daily Upload ───────────────────────────────────────────────────────────
// Sinkron dengan skema DB: marketing.daily_uploads

export const dailyUploadPlatform = ["Instagram", "TikTok", "YouTube"] as const;
export const dailyUploadJenisKonten = [
  "Feed",
  "Story",
  "Reels",
  "Live",
  "Shorts",
  "Video",
  "Carousel",
] as const;
export const dailyUploadTipeAktivitas = [
  "Upload",
  "Live Streaming",
  "Paid Promote",
] as const;
export const dailyUploadStatus = ["Draft", "Published", "Archived"] as const;

export const DailyUploadSchema = z.object({
  id: z.string().uuid().optional(),
  tanggal_aktivitas: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  akun: z.string().min(1, "Akun wajib diisi").max(50),
  platform: z.enum(dailyUploadPlatform, {
    message: "Platform harus Instagram / TikTok / YouTube",
  }),
  jenis_konten: z.enum(dailyUploadJenisKonten, {
    message: "Jenis konten tidak valid",
  }),
  tipe_aktivitas: z.enum(dailyUploadTipeAktivitas, {
    message: "Tipe aktivitas tidak valid",
  }),
  produk: z.string().min(1, "Produk wajib diisi").max(255),
  link_konten: z.string().url("Link konten harus URL valid").max(500),
  pic: z.string().min(1, "PIC wajib diisi").max(100),
  status: z.enum(dailyUploadStatus).default("Draft"),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional().nullable(),
});

export const DailyUploadCreateSchema = DailyUploadSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const DailyUploadUpdateSchema = DailyUploadCreateSchema.partial();

// Tipe hasil infer
export type DailyUpload = z.infer<typeof DailyUploadSchema>;
export type DailyUploadCreate = z.infer<typeof DailyUploadCreateSchema>;
export type DailyUploadUpdate = z.infer<typeof DailyUploadUpdateSchema>;