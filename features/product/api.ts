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
import { requestJson } from "@/lib/request";

export const productApi = {
  categories: {
    list: () => requestJson<ProductCategoryRecord[]>("/api/product/categories"),
    create: (payload: ProductCategoryInput) =>
      requestJson<ProductCategoryRecord>("/api/product/categories", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (categoryCode: string, payload: Partial<ProductCategoryInput>) =>
      requestJson<ProductCategoryRecord>(`/api/product/categories/${encodeURIComponent(categoryCode)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (categoryCode: string) =>
      requestJson<{ ok: true }>(`/api/product/categories/${encodeURIComponent(categoryCode)}`, {
        method: "DELETE",
      }),
  },
  inventory: {
    list: () => requestJson<MasterInventoryRecord[]>("/api/product/inventory"),
    create: (payload: MasterInventoryInput) =>
      requestJson<MasterInventoryRecord>("/api/product/inventory", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (invCode: string, payload: Partial<MasterInventoryInput>) =>
      requestJson<MasterInventoryRecord>(`/api/product/inventory/${encodeURIComponent(invCode)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (invCode: string) =>
      requestJson<{ ok: true }>(`/api/product/inventory/${encodeURIComponent(invCode)}`, {
        method: "DELETE",
      }),
  },
  products: {
    list: () => requestJson<MasterProductRecord[]>("/api/product/products"),
    create: (payload: MasterProductInput) =>
      requestJson<MasterProductRecord>("/api/product/products", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (sku: string, payload: Partial<MasterProductInput>) =>
      requestJson<MasterProductRecord>(`/api/product/products/${encodeURIComponent(sku)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (sku: string) =>
      requestJson<{ ok: true }>(`/api/product/products/${encodeURIComponent(sku)}`, {
        method: "DELETE",
      }),
    bom: {
      list: (sku: string) =>
        requestJson<ProductBomRecord[]>(`/api/product/products/${encodeURIComponent(sku)}/bom`),
      create: (sku: string, payload: Omit<ProductBomInput, "sku">) =>
        requestJson<ProductBomRecord>(`/api/product/products/${encodeURIComponent(sku)}/bom`, {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      update: (sku: string, id: string, payload: Partial<Omit<ProductBomInput, "sku">>) =>
        requestJson<ProductBomRecord>(
          `/api/product/products/${encodeURIComponent(sku)}/bom/${encodeURIComponent(id)}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        ),
      remove: (sku: string, id: string) =>
        requestJson<{ ok: true }>(
          `/api/product/products/${encodeURIComponent(sku)}/bom/${encodeURIComponent(id)}`,
          {
            method: "DELETE",
          }
        ),
    },
  },
};
