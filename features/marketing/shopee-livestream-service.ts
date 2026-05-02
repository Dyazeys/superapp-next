import type { ShopeeLivestream, ShopeeLivestreamFormData } from "@/types/marketing";

export async function fetchShopeeLivestream(): Promise<ShopeeLivestream[]> {
  const res = await fetch("/api/marketing/shopee-livestream");
  if (!res.ok) throw new Error(`Gagal memuat data livestream: ${res.status}`);
  return res.json();
}

export async function createShopeeLivestream(
  data: ShopeeLivestreamFormData,
): Promise<ShopeeLivestream> {
  const res = await fetch("/api/marketing/shopee-livestream", {
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

export async function updateShopeeLivestream(
  id: string,
  data: Partial<ShopeeLivestreamFormData>,
): Promise<ShopeeLivestream> {
  const res = await fetch(`/api/marketing/shopee-livestream/${id}`, {
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

export async function deleteShopeeLivestream(id: string): Promise<void> {
  const res = await fetch(`/api/marketing/shopee-livestream/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Gagal menghapus: ${res.status}`);
  }
}