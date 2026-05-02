import type { TikTokTraffic, TikTokTrafficFormData } from "@/types/marketing";

export async function fetchTiktokTraffic(): Promise<TikTokTraffic[]> {
  const res = await fetch("/api/marketing/tiktok-traffic");
  if (!res.ok) throw new Error(`Gagal memuat data traffic: ${res.status}`);
  return res.json();
}

export async function createTiktokTraffic(
  data: TikTokTrafficFormData,
): Promise<TikTokTraffic> {
  const res = await fetch("/api/marketing/tiktok-traffic", {
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

export async function updateTiktokTraffic(
  id: string,
  data: Partial<TikTokTrafficFormData>,
): Promise<TikTokTraffic> {
  const res = await fetch(`/api/marketing/tiktok-traffic/${id}`, {
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

export async function deleteTiktokTraffic(id: string): Promise<void> {
  const res = await fetch(`/api/marketing/tiktok-traffic/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Gagal menghapus: ${res.status}`);
  }
}