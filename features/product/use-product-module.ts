"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useForm, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { useState } from "react";
import { useModalState } from "@/hooks/use-modal-state";
import { productApi } from "@/features/product/api";
import {
  type MasterInventoryFormValues,
  masterInventorySchema,
  type MasterProductFormValues,
  masterProductSchema,
  productBomSchema,
  productCategorySchema,
  type ProductCategoryFormValues,
  type MasterInventoryInput,
  type MasterProductInput,
  type ProductBomInput,
  type ProductCategoryInput,
} from "@/schemas/product-module";
import type { MasterInventoryRecord, MasterProductRecord, ProductCategoryRecord } from "@/types/product";

function useBaseMutation(invalidateKeys: ReadonlyArray<ReadonlyArray<unknown>>) {
  const queryClient = useQueryClient();
  const invalidate = () => Promise.all(invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: key })));
  return invalidate;
}

export const PRODUCT_BOOLEAN_OPTIONS = [
  { label: "true", value: "true" },
  { label: "false", value: "false" },
] as const;

export function parseBooleanInput(value: string) {
  return value === "true";
}

export function createEmptyBomDraft(sku: string): ProductBomInput {
  return {
    sku,
    component_group: "MAIN",
    component_type: "INVENTORY",
    inv_code: null,
    component_name: "",
    qty: "1",
    unit_cost: "0",
    is_stock_tracked: true,
    notes: "",
    sequence_no: 1,
    is_active: true,
  };
}

type ProductCategoriesHook = {
  categoriesQuery: UseQueryResult<ProductCategoryRecord[]>;
  categoryForm: UseFormReturn<ProductCategoryFormValues, unknown, ProductCategoryInput>;
  categoryModal: ReturnType<typeof useModalState>;
  editingCategory: ProductCategoryRecord | null;
  openCategoryModal: (category?: ProductCategoryRecord) => void;
  saveCategory: (values: ProductCategoryInput) => Promise<void>;
  deleteCategory: (code: string) => Promise<void>;
};

type ProductInventoryHook = {
  inventoryQuery: UseQueryResult<MasterInventoryRecord[]>;
  inventoryForm: UseFormReturn<MasterInventoryFormValues, unknown, MasterInventoryInput>;
  inventoryModal: ReturnType<typeof useModalState>;
  editingInventory: MasterInventoryRecord | null;
  openInventoryModal: (inventory?: MasterInventoryRecord) => void;
  saveInventory: (values: MasterInventoryInput) => Promise<void>;
  deleteInventory: (code: string) => Promise<void>;
};

type ProductMasterHook = {
  productsQuery: UseQueryResult<MasterProductRecord[]>;
  productForm: UseFormReturn<MasterProductFormValues, unknown, MasterProductInput>;
  productModal: ReturnType<typeof useModalState>;
  editingProduct: MasterProductRecord | null;
  openProductModal: (product?: MasterProductRecord) => void;
  saveProduct: (values: MasterProductInput) => Promise<MasterProductRecord>;
  deleteProduct: (sku: string) => Promise<void>;
};

export function useProductCategories(): ProductCategoriesHook {
  const [editingCategory, setEditingCategory] = useState<ProductCategoryRecord | null>(null);
  const form = useForm<ProductCategoryFormValues, unknown, ProductCategoryInput>({
    resolver: zodResolver(productCategorySchema),
    defaultValues: {
      category_code: "",
      parent_category_code: null,
      category_name: "",
      is_active: true,
    },
  });
  const modal = useModalState();
  const query = useQuery({ queryKey: ["product-categories"], queryFn: productApi.categories.list });
  const invalidate = useBaseMutation([["product-categories"]]);

  const save = async (values: ProductCategoryInput) => {
    try {
      const action = editingCategory
        ? productApi.categories.update(editingCategory.category_code, values)
        : productApi.categories.create(values);
      await action;
      toast.success(`Category ${editingCategory ? "updated" : "created"}`);
      await invalidate();
      setEditingCategory(null);
      modal.closeModal();
      form.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save category");
      throw error;
    }
  };

  const remove = async (code: string) => {
    try {
      await productApi.categories.remove(code);
      toast.success("Category deleted");
      await invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete category");
      throw error;
    }
  };

  const open = (category?: ProductCategoryRecord) => {
    setEditingCategory(category ?? null);
    form.reset({
      category_code: category?.category_code ?? "",
      parent_category_code: category?.parent_category_code ?? null,
      category_name: category?.category_name ?? "",
      is_active: category?.is_active ?? true,
    });
    modal.openModal();
  };

  return {
    categoriesQuery: query,
    categoryForm: form,
    categoryModal: modal,
    editingCategory,
    openCategoryModal: open,
    saveCategory: save,
    deleteCategory: remove,
  };
}

export function useProductInventory(): ProductInventoryHook {
  const [editingInventory, setEditingInventory] = useState<MasterInventoryRecord | null>(null);
  const form = useForm<MasterInventoryFormValues, unknown, MasterInventoryInput>({
    resolver: zodResolver(masterInventorySchema),
    defaultValues: { inv_code: "", inv_name: "", description: "", hpp: "0", is_active: true },
  });
  const modal = useModalState();
  const query = useQuery({ queryKey: ["product-inventory"], queryFn: productApi.inventory.list });
  const invalidate = useBaseMutation([["product-inventory"]]);

  const save = async (values: MasterInventoryInput) => {
    try {
      const action = editingInventory
        ? productApi.inventory.update(editingInventory.inv_code, values)
        : productApi.inventory.create(values);
      await action;
      toast.success(`Inventory ${editingInventory ? "updated" : "created"}`);
      await invalidate();
      setEditingInventory(null);
      modal.closeModal();
      form.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save inventory");
      throw error;
    }
  };

  const remove = async (code: string) => {
    try {
      await productApi.inventory.remove(code);
      toast.success("Inventory deleted");
      await invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete inventory");
      throw error;
    }
  };

  const open = (inventory?: MasterInventoryRecord) => {
    setEditingInventory(inventory ?? null);
    form.reset({
      inv_code: inventory?.inv_code ?? "",
      inv_name: inventory?.inv_name ?? "",
      description: inventory?.description ?? "",
      hpp: inventory?.hpp ?? "0",
      is_active: inventory?.is_active ?? true,
    });
    modal.openModal();
  };

  return {
    inventoryQuery: query,
    inventoryForm: form,
    inventoryModal: modal,
    editingInventory,
    openInventoryModal: open,
    saveInventory: save,
    deleteInventory: remove,
  };
}

export function useProductMaster(): ProductMasterHook {
  const [editingProduct, setEditingProduct] = useState<MasterProductRecord | null>(null);
  const form = useForm<MasterProductFormValues, unknown, MasterProductInput>({
    resolver: zodResolver(masterProductSchema),
    defaultValues: {
      sku: "",
      category_code: null,
      sku_name: "",
      product_name: "",
      color: "",
      color_code: "",
      size: "",
      variations: "",
      busa_code: "",
      inv_main: null,
      inv_acc: null,
      is_bundling: false,
      is_active: true,
      total_hpp: "0",
    },
  });
  const modal = useModalState();
  const query = useQuery({ queryKey: ["product-products"], queryFn: productApi.products.list });
  const invalidate = useBaseMutation([["product-products"]]);

  const save = async (values: MasterProductInput) => {
    try {
      const action = editingProduct
        ? productApi.products.update(editingProduct.sku, values)
        : productApi.products.create(values);
      const result = await action;
      toast.success(`Product ${editingProduct ? "updated" : "created"}`);
      await invalidate();
      modal.closeModal();
      setEditingProduct(null);
      form.reset();
      return result;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save product");
      throw error;
    }
  };

  const remove = async (sku: string) => {
    try {
      await productApi.products.remove(sku);
      toast.success("Product deleted");
      await invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete product");
      throw error;
    }
  };

  const open = (product?: MasterProductRecord) => {
    setEditingProduct(product ?? null);
    form.reset({
      sku: product?.sku ?? "",
      category_code: product?.category_code ?? null,
      sku_name: product?.sku_name ?? "",
      product_name: product?.product_name ?? "",
      color: product?.color ?? "",
      color_code: product?.color_code ?? "",
      size: product?.size ?? "",
      variations: product?.variations ?? "",
      busa_code: product?.busa_code ?? "",
      inv_main: product?.inv_main ?? null,
      inv_acc: product?.inv_acc ?? null,
      is_bundling: product?.is_bundling ?? false,
      is_active: product?.is_active ?? true,
      total_hpp: product?.total_hpp ?? "0",
    });
    modal.openModal();
  };

  return {
    productsQuery: query,
    productForm: form,
    productModal: modal,
    editingProduct,
    openProductModal: open,
    saveProduct: save,
    deleteProduct: remove,
  };
}

export function useProductBom(selectedSku?: string) {
  const [editingBomId, setEditingBomId] = useState<string | null>(null);
  const [bomDraft, setBomDraft] = useState<ProductBomInput | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const query = useQuery({
    queryKey: ["product-bom", selectedSku],
    queryFn: () => (selectedSku ? productApi.products.bom.list(selectedSku) : Promise.resolve([])),
    enabled: Boolean(selectedSku),
  });
  const invalidate = useBaseMutation([["product-bom", selectedSku], ["product-products"]]);

  const save = async (payload: ProductBomInput) => {
    if (!selectedSku) throw new Error("Select a product first");
    if (actionPending) return;

    try {
      setActionPending(true);
      const validated = productBomSchema.parse({ ...payload, sku: selectedSku });
      const body = Object.fromEntries(Object.entries(validated).filter(([key]) => key !== "sku")) as Omit<
        ProductBomInput,
        "sku"
      >;
      const action = editingBomId
        ? productApi.products.bom.update(selectedSku, editingBomId, body)
        : productApi.products.bom.create(selectedSku, body);
      await action;
      toast.success(`BOM row ${editingBomId ? "updated" : "created"}`);
      await invalidate();
      setEditingBomId(null);
      setBomDraft(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save BOM row");
      throw error;
    } finally {
      setActionPending(false);
    }
  };

  const remove = async (id: string) => {
    if (!selectedSku || actionPending) return;
    try {
      setActionPending(true);
      await productApi.products.bom.remove(selectedSku, id);
      toast.success("BOM row deleted");
      await invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete BOM row");
      throw error;
    } finally {
      setActionPending(false);
    }
  };

  return {
    bomQuery: query,
    editingBomId,
    setEditingBomId,
    bomDraft,
    setBomDraft,
    saveBom: save,
    deleteBom: remove,
    actionPending,
  };
}

export function useProductSelection(products: MasterProductRecord[] | undefined) {
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const currentSku = selectedSku ?? products?.[0]?.sku ?? null;

  return { selectedSku, currentSku, setSelectedSku };
}
