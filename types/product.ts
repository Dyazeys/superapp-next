export type ProductCategoryRecord = {
  category_code: string;
  parent_category_code: string | null;
  category_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  _count?: {
    other_category_product?: number;
    master_product?: number;
  };
};

export type MasterInventoryRecord = {
  inv_code: string;
  inv_name: string;
  description: string | null;
  hpp: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};

export type MasterProductRecord = {
  sku: string;
  category_code: string | null;
  sku_name: string;
  product_name: string;
  color: string | null;
  color_code: string | null;
  size: string | null;
  variations: string | null;
  busa_code: string | null;
  inv_main: string | null;
  inv_acc: string | null;
  is_bundling: boolean;
  is_active: boolean;
  price_mp: string;
  price_non_mp: string;
  total_hpp: string;
  created_at: string;
  updated_at: string | null;
  category_product?: ProductCategoryRecord | null;
  master_inventory_master_product_inv_mainTomaster_inventory?: MasterInventoryRecord | null;
  master_inventory_master_product_inv_accTomaster_inventory?: MasterInventoryRecord | null;
  _count?: {
    product_bom?: number;
  };
};

export type ProductBomRecord = {
  id: string;
  sku: string;
  component_group: string;
  component_type: string;
  inv_code: string | null;
  component_name: string;
  qty: string;
  unit_cost: string;
  line_cost: string;
  is_stock_tracked: boolean;
  notes: string | null;
  sequence_no: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};
