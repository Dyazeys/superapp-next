/**
 * Tipe untuk Content Module.
 * Sinkron dengan DB: marketing.daily_uploads
 * Gunakan tipe dari Zod schema untuk konsistensi validasi.
 */

// Re-export tipe utama dari Zod schema
export type {
  DailyUpload,
  DailyUploadCreate,
  DailyUploadUpdate,
} from "@/schemas/content-module";

// Re-export konstanta enum
export {
  dailyUploadPlatform as PLATFORM_OPTIONS,
  dailyUploadJenisKonten as CONTENT_TYPE_OPTIONS,
  dailyUploadTipeAktivitas as ACTIVITY_TYPE_OPTIONS,
  dailyUploadStatus as STATUS_OPTIONS,
} from "@/schemas/content-module";