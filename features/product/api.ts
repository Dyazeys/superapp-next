import type {
  MasterInventoryRecord,
  MasterProductRecord,
  ProductBomRecord,
  ProductCategoryRecord,
} from "@/types/product";
import type {
  MasterInventoryInput,
  MasterProductInput,
  ProductBomInput,
  ProductCategoryInput,
} from "@/schemas/product-module";

async function request<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const productApi = {
  categories: {
    list: () => request<ProductCategoryRecord[]>("/api/product/categories"),
    create: (payload: ProductCategoryInput) =>
      request<ProductCategoryRecord>("/api/product/categories", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (categoryCode: string, payload: Partial<ProductCategoryInput>) =>
      request<ProductCategoryRecord>(`/api/product/categories/${encodeURIComponent(categoryCode)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (categoryCode: string) =>
      request<{ ok: true }>(`/api/product/categories/${encodeURIComponent(categoryCode)}`, {
        method: "DELETE",
      }),
  },
  inventory: {
    list: () => request<MasterInventoryRecord[]>("/api/product/inventory"),
    create: (payload: MasterInventoryInput) =>
      request<MasterInventoryRecord>("/api/product/inventory", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (invCode: string, payload: Partial<MasterInventoryInput>) =>
      request<MasterInventoryRecord>(`/api/product/inventory/${encodeURIComponent(invCode)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (invCode: string) =>
      request<{ ok: true }>(`/api/product/inventory/${encodeURIComponent(invCode)}`, {
        method: "DELETE",
      }),
  },
  products: {
    list: () => request<MasterProductRecord[]>("/api/product/products"),
    create: (payload: MasterProductInput) =>
      request<MasterProductRecord>("/api/product/products", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (sku: string, payload: Partial<MasterProductInput>) =>
      request<MasterProductRecord>(`/api/product/products/${encodeURIComponent(sku)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (sku: string) =>
      request<{ ok: true }>(`/api/product/products/${encodeURIComponent(sku)}`, {
        method: "DELETE",
      }),
    bom: {
      list: (sku: string) =>
        request<ProductBomRecord[]>(`/api/product/products/${encodeURIComponent(sku)}/bom`),
      create: (sku: string, payload: Omit<ProductBomInput, "sku">) =>
        request<ProductBomRecord>(`/api/product/products/${encodeURIComponent(sku)}/bom`, {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      update: (sku: string, id: string, payload: Partial<Omit<ProductBomInput, "sku">>) =>
        request<ProductBomRecord>(
          `/api/product/products/${encodeURIComponent(sku)}/bom/${encodeURIComponent(id)}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        ),
      remove: (sku: string, id: string) =>
        request<{ ok: true }>(
          `/api/product/products/${encodeURIComponent(sku)}/bom/${encodeURIComponent(id)}`,
          {
            method: "DELETE",
          }
        ),
    },
  },
};
