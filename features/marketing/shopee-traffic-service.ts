import type { ShopeeTraffic, ShopeeTrafficFormData } from "@/types/marketing";

export async function fetchShopeeTraffic(): Promise<ShopeeTraffic[]> {
  const res = await fetch("/api/marketing/shopee-traffic");
  if (!res.ok) throw new Error(`Gagal memuat data traffic: ${res.status}`);
  return res.json();
}

export async function createShopeeTraffic(
  data: ShopeeTrafficFormData,
): Promise<ShopeeTraffic> {
  const res = await fetch("/api/marketing/shopee-traffic", {
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

export async function updateShopeeTraffic(
  id: string,
  data: Partial<ShopeeTrafficFormData>,
): Promise<ShopeeTraffic> {
  const res = await fetch(`/api/marketing/shopee-traffic/${id}`, {
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

export async function deleteShopeeTraffic(id: string): Promise<void> {
  const res = await fetch(`/api/marketing/shopee-traffic/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Gagal menghapus: ${res.status}`);
  }
}