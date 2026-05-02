import type { TikTokLivestream, TikTokLivestreamFormData } from "@/types/marketing";

export async function fetchTiktokLivestream(): Promise<TikTokLivestream[]> {
  const res = await fetch("/api/marketing/tiktok-livestream");
  if (!res.ok) throw new Error(`Gagal memuat data livestream: ${res.status}`);
  return res.json();
}

export async function createTiktokLivestream(
  data: TikTokLivestreamFormData,
): Promise<TikTokLivestream> {
  const res = await fetch("/api/marketing/tiktok-livestream", {
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

export async function updateTiktokLivestream(
  id: string,
  data: Partial<TikTokLivestreamFormData>,
): Promise<TikTokLivestream> {
  const res = await fetch(`/api/marketing/tiktok-livestream/${id}`, {
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

export async function deleteTiktokLivestream(id: string): Promise<void> {
  const res = await fetch(`/api/marketing/tiktok-livestream/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Gagal menghapus: ${res.status}`);
  }
}