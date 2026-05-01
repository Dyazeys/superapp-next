import { z } from "zod";

// ─── Daily Upload ───────────────────────────────────────────────────────────
// Sinkron dengan skema DB: marketing.daily_uploads

export const dailyUploadAkun = ["Official", "Marketing"] as const;
export const dailyUploadPlatform = ["Instagram", "TikTok", "YouTube"] as const;
export const dailyUploadJenisKontenByPlatform = {
  Instagram: ["Feed", "Story", "Reel"],
  TikTok: ["Video TikTok"],
  YouTube: ["Video", "Shorts"],
} as const;
export const dailyUploadJenisKonten = [
  ...dailyUploadJenisKontenByPlatform.Instagram,
  ...dailyUploadJenisKontenByPlatform.TikTok,
  ...dailyUploadJenisKontenByPlatform.YouTube,
] as const;
export const dailyUploadTipeAktivitas = [
  "Upload",
  "Collab",
  "Paid",
  "Mirror",
] as const;
export const dailyUploadStatus = ["Draft", "Uploaded"] as const;

function addJenisKontenIssue(
  platform: (typeof dailyUploadPlatform)[number],
  jenisKonten: string,
  ctx: z.RefinementCtx
) {
  const allowedJenisKonten = dailyUploadJenisKontenByPlatform[platform];

  if (!allowedJenisKonten.includes(jenisKonten as never)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["jenis_konten"],
      message: `Jenis konten ${jenisKonten} tidak valid untuk platform ${platform}.`,
    });
  }
}

const dailyUploadBaseSchema = z.object({
  id: z.string().uuid().optional(),
  tanggal_aktivitas: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  akun: z.enum(dailyUploadAkun, {
    message: "Akun harus Official / Marketing",
  }),
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

export const DailyUploadSchema = dailyUploadBaseSchema.superRefine((value, ctx) => {
  addJenisKontenIssue(value.platform, value.jenis_konten, ctx);
});

export const DailyUploadCreateSchema = dailyUploadBaseSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).superRefine((value, ctx) => {
  addJenisKontenIssue(value.platform, value.jenis_konten, ctx);
});

export const DailyUploadUpdateSchema = dailyUploadBaseSchema
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
  })
  .partial()
  .superRefine((value, ctx) => {
    if (value.platform && value.jenis_konten) {
      addJenisKontenIssue(value.platform, value.jenis_konten, ctx);
    }
  });

// Tipe hasil infer
export type DailyUpload = z.infer<typeof DailyUploadSchema>;
export type DailyUploadCreate = z.infer<typeof DailyUploadCreateSchema>;
export type DailyUploadUpdate = z.infer<typeof DailyUploadUpdateSchema>;
