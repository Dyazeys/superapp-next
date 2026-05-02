import type { MpAdsShopee, MpAdsTiktok, MpAdsFormData } from "@/types/marketing";

export type MpAdsPlatform = "shopee" | "tiktok";

function getBaseUrl(platform: MpAdsPlatform): string {
  return `/api/marketing/mp-ads/${platform}`;
}

/** Fetch all ads for a given platform. */
export async function fetchMpAds(platform: MpAdsPlatform): Promise<MpAdsShopee[] | MpAdsTiktok[]> {
  const res = await fetch(getBaseUrl(platform));
  if (!res.ok) {
    throw new Error(`Gagal memuat data iklan: ${res.status}`);
  }
  return res.json();
}

/** Create a new ad record. */
export async function createMpAd(
  platform: MpAdsPlatform,
  data: MpAdsFormData,
): Promise<MpAdsShopee | MpAdsTiktok> {
  const res = await fetch(getBaseUrl(platform), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Gagal menyimpan: ${res.status}`);
  }
  return res.json();
}

/** Update an existing ad record. */
export async function updateMpAd(
  platform: MpAdsPlatform,
  id: string,
  data: Partial<MpAdsFormData>,
): Promise<MpAdsShopee | MpAdsTiktok> {
  const res = await fetch(`${getBaseUrl(platform)}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Gagal memperbarui: ${res.status}`);
  }
  return res.json();
}

/** Delete an ad record. */
export async function deleteMpAd(
  platform: MpAdsPlatform,
  id: string,
): Promise<void> {
  const res = await fetch(`${getBaseUrl(platform)}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Gagal menghapus: ${res.status}`);
  }
}