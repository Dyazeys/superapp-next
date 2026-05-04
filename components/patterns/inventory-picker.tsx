"use client";

import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { useInventoryOptions } from "@/features/warehouse/use-inventory-options";

type InventoryPickerProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  inputClassName?: string;
  emptyText?: string;
  maxResults?: number;
  options?: SearchableOption[];
  isLoading?: boolean;
};

export function InventoryPicker({
  value,
  onValueChange,
  placeholder = "Cari inventory...",
  disabled,
  id,
  className,
  inputClassName,
  emptyText = "Inventory tidak ditemukan.",
  maxResults = 120,
  options: externalOptions,
  isLoading: externalLoading,
}: InventoryPickerProps) {
  const internal = useInventoryOptions();
  const options = externalOptions ?? internal.options;
  const isLoading = externalLoading ?? internal.isLoading;

  return (
    <SearchableSelect
      id={id}
      value={value}
      options={options}
      onValueChange={onValueChange}
      placeholder={isLoading ? "Loading inventory..." : placeholder}
      disabled={isLoading || disabled}
      className={className}
      inputClassName={inputClassName}
      emptyText={emptyText}
      maxResults={maxResults}
      renderOption={(option) => {
        const [code, ...rest] = option.label.split(" - ");
        return (
          <div className="leading-tight">
            <p className="font-medium text-slate-900">{code}</p>
            {rest.length > 0 ? (
              <p className="truncate text-xs text-slate-500">{rest.join(" - ")}</p>
            ) : null}
          </div>
        );
      }}
    />
  );
}
