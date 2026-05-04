import { useMemo } from "react";
import { useWarehouseInventoryLookup } from "@/features/warehouse/use-warehouse-module";

export type InventoryOption = {
  value: string;
  label: string;
};

export function useInventoryOptions() {
  const inventoryQuery = useWarehouseInventoryLookup();
  const options = useMemo(
    () =>
      (inventoryQuery.data ?? []).map((inv) => ({
        value: inv.inv_code,
        label: `${inv.inv_code} - ${inv.inv_name}`,
      })),
    [inventoryQuery.data]
  );
  return { options, isLoading: inventoryQuery.isLoading, query: inventoryQuery };
}
