/**
 * Tipe lokal untuk Content Daily Draft.
 * Belum ada DB — data disimpan di client state (mock).
 */
export type ContentDailyDraft = {
  id: string;
  report_date: string; // YYYY-MM-DD
  platform: "TIKTOK" | "INSTAGRAM";
  account_name: string;
  content_type: string;
  target: number;
  actual_posted: number;
  notes: string;
};

export const CONTENT_TYPE_OPTIONS = [
  "Video",
  "Reels",
  "Story",
  "Feed",
  "Carousel",
  "Live",
] as const;

export type ContentType = (typeof CONTENT_TYPE_OPTIONS)[number];

export const PLATFORM_OPTIONS = ["TIKTOK", "INSTAGRAM"] as const;

export type DraftAction =
  | { type: "upsert"; payload: ContentDailyDraft }
  | { type: "remove"; id: string }
  | { type: "set"; payload: ContentDailyDraft[] };