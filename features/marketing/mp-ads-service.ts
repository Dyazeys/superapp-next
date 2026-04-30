import type { MpAdsDraft } from "@/types/marketing";

const BASE_URL = "/api/marketing/mp-ads";

/**
 * Fetch seluruh data Iklan MP dari API (read-only stub).
 * Data masih mock dari server side.
 */
export async function fetchMpAds(): Promise<MpAdsDraft[]> {
  const res = await fetch(BASE_URL);
  if (!res.ok) {
    throw new Error(`Gagal memuat data Iklan MP: ${res.status}`);
  }
  return res.json();
}