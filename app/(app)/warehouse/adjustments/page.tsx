"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { MetricCard } from "@/components/layout/stats-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import { Textarea } from "@/components/ui/textarea";
import {
  WAREHOUSE_ADJUSTMENT_TYPE_OPTIONS,
  toDateInput,
  useWarehouseAdjustments,
  useWarehouseInventoryLookup,
} from "@/features/warehouse/use-warehouse-module";
import { WAREHOUSE_ADJUSTMENT_REASON_OPTIONS, type AdjustmentInput } from "@/schemas/warehouse-module";
import type { AdjustmentRecord } from "@/types/warehouse";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<AdjustmentRecord>();

type InventoryOption = {
  value: string;
  label: string;
};

function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function splitInventoryLabel(label: string) {
  const [code, ...rest] = label.split(" - ");
  return {
    code: code ?? "",
    name: rest.join(" - "),
  };
}

function InventoryPicker({
  value,
  options,
  onValueChange,
  placeholder,
  disabled,
  className,
  inputClassName,
  emptyText = "Inventory tidak ditemukan.",
  maxResults = 120,
}: {
  value: string;
  options: InventoryOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  emptyText?: string;
  maxResults?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({
    left: 0,
    top: 0,
    width: 0,
  });
  const selected = useMemo(() => options.find((option) => option.value === value) ?? null, [options, value]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const updateMenuPosition = useCallback(() => {
    const element = inputRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const menuHeight = 260;
    const desiredWidth = Math.max(rect.width + 80, 360);
    const gap = 12;
    const canOpenRight = rect.right + gap + desiredWidth <= viewportWidth - 16;
    const fallbackWidth = Math.min(desiredWidth, viewportWidth - 32);
    const centeredTop = rect.top + rect.height / 2 - menuHeight / 2;
    const top = Math.max(16, Math.min(centeredTop, viewportHeight - menuHeight - 16));
    const left = canOpenRight
      ? rect.right + gap
      : Math.min(rect.left, viewportWidth - fallbackWidth - 16);

    setMenuStyle({
      left,
      top,
      width: canOpenRight ? desiredWidth : fallbackWidth,
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    function onViewportChange() {
      updateMenuPosition();
    }

    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [open, updateMenuPosition]);

  const filteredOptions = useMemo(() => {
    const normalized = normalizeSearch(query);
    if (!normalized) {
      return options.slice(0, maxResults);
    }

    return options
      .filter((option) => normalizeSearch(option.label).includes(normalized) || normalizeSearch(option.value).includes(normalized))
      .slice(0, maxResults);
  }, [maxResults, options, query]);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          value={open ? query : (selected?.label ?? "")}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "h-10 w-full min-w-0 rounded-2xl border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm text-slate-800 shadow-sm shadow-slate-900/5 transition-colors outline-none placeholder:text-slate-400 focus-visible:border-slate-300 focus-visible:ring-4 focus-visible:ring-slate-200/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
            inputClassName,
          )}
          onFocus={() => {
            setOpen(true);
            setQuery(selected?.label ?? "");
            updateMenuPosition();
          }}
          onChange={(event) => {
            const nextValue = event.target.value;
            setQuery(nextValue);
            setOpen(true);
            updateMenuPosition();
            if (!nextValue.trim()) {
              onValueChange("");
            }
            requestAnimationFrame(() => {
              inputRef.current?.focus();
            });
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />
      </div>
      {typeof document !== "undefined" && open
        ? createPortal(
            <div
              className="fixed z-[200] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/12"
              style={menuStyle}
            >
              <div className="border-b border-slate-100 bg-slate-50/80 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                {filteredOptions.length} result{filteredOptions.length === 1 ? "" : "s"}
              </div>
              <div className="max-h-64 overflow-auto p-1.5">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => {
                    const parts = splitInventoryLabel(option.label);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={cn(
                          "block w-full rounded-xl px-3 py-2 text-left transition-colors hover:bg-slate-100",
                          option.value === value ? "bg-slate-100 ring-1 ring-slate-200" : undefined,
                        )}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          onValueChange(option.value);
                          setQuery(option.label);
                          setOpen(false);
                        }}
                      >
                        <div className="font-medium text-slate-900">{parts.code}</div>
                        {parts.name ? <div className="truncate text-xs text-slate-500">{parts.name}</div> : null}
                      </button>
                    );
                  })
                ) : (
                  <p className="px-3 py-3 text-sm text-slate-500">{emptyText}</p>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export default function WarehouseAdjustmentsPage() {
  const hooks = useWarehouseAdjustments();
  const inventoryQuery = useWarehouseInventoryLookup();
  const { adjustmentsQuery, adjustmentForm, adjustmentModal, editingAdjustment } = hooks;
  const inventoryOptions = useMemo(
    () =>
      (inventoryQuery.data ?? []).map((inventory) => ({
        value: inventory.inv_code,
        label: `${inventory.inv_code} - ${inventory.inv_name}`,
      })),
    [inventoryQuery.data],
  );
  const adjustmentRows = adjustmentsQuery.data ?? [];
  const totalAdjustments = adjustmentRows.length;
  const adjustmentsIn = adjustmentRows.filter((row) => row.adj_type === "IN").length;
  const adjustmentsOut = totalAdjustments - adjustmentsIn;
  const netQty = adjustmentRows.reduce(
    (sum, row) => sum + (row.adj_type === "IN" ? Number(row.qty || 0) : -Number(row.qty || 0)),
    0
  );
  const latestAdjustmentDate =
    adjustmentRows.length === 0
      ? "-"
      : adjustmentRows
          .map((row) => row.adjustment_date)
          .reduce((latest, next) => (next > latest ? next : latest))
          .slice(0, 10);

  const columns = [
    columnHelper.accessor("adjustment_date", {
      header: "Date",
      cell: (info) => toDateInput(info.getValue()),
    }),
    columnHelper.accessor("inv_code", {
      header: "Inventory",
      cell: (info) => (
        <div>
          <p className="font-medium">{info.getValue()}</p>
          <p className="text-xs text-muted-foreground">{info.row.original.master_inventory?.inv_name ?? ""}</p>
        </div>
      ),
    }),
    columnHelper.accessor("adj_type", {
      header: "Type",
      cell: (info) => <StatusBadge label={info.getValue()} tone={info.getValue() === "IN" ? "success" : "warning"} />,
    }),
    columnHelper.accessor("qty", { header: "Qty" }),
    columnHelper.accessor("reason", { header: "Reason" }),
    columnHelper.accessor("notes", {
      header: "Catatan",
      cell: (info) => info.getValue() ?? "-",
    }),
    columnHelper.accessor("approved_by", {
      header: "Approved By",
      cell: (info) => info.getValue() ?? "-",
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button size="icon-xs" variant="outline" onClick={() => hooks.openAdjustmentModal(row.original)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon-xs" variant="outline" onClick={() => hooks.deleteAdjustment(row.original.id)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    }),
  ];

  return (
    <PageShell
      eyebrow="Warehouse"
      title="Adjustments"
      description="Kelola penyesuaian stok untuk koreksi operasional, dengan jejak yang tetap konsisten di ledger."
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Total adjustments" value={String(totalAdjustments)} subtitle="Jumlah adjustment yang terlihat." />
          <MetricCard title="IN / OUT" value={`${adjustmentsIn} / ${adjustmentsOut}`} subtitle="Ringkas arah perubahan stok." />
          <MetricCard title="Net qty" value={netQty.toLocaleString("id-ID")} subtitle="IN dikurangi OUT (visible)." />
          <MetricCard title="Latest date" value={latestAdjustmentDate} subtitle="Tanggal adjustment terbaru." />
        </div>

        <div className="flex justify-end">
          <Button size="sm" onClick={() => hooks.openAdjustmentModal()}>
            <Plus className="size-4" />
            Add adjustment
          </Button>
        </div>
        <DataTable columns={columns} data={adjustmentsQuery.data ?? []} emptyMessage="No adjustments yet." />
      </div>

      <ModalFormShell
        open={adjustmentModal.open}
        onOpenChange={adjustmentModal.setOpen}
        title={editingAdjustment ? "Edit adjustment" : "Create adjustment"}
        description="Manage manual stock corrections using the existing warehouse adjustment flow."
        isSubmitting={adjustmentForm.formState.isSubmitting}
        onSubmit={() => {
          return adjustmentForm.handleSubmit((values: AdjustmentInput) => hooks.saveAdjustment(values))();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Adjustment date"
            htmlFor="adjustment_date"
            error={adjustmentForm.formState.errors.adjustment_date?.message}
          >
            <Input id="adjustment_date" type="date" {...adjustmentForm.register("adjustment_date")} />
          </FormField>
          <FormField
            label="Inventory code"
            htmlFor="adjustment_inv_code"
            error={adjustmentForm.formState.errors.inv_code?.message}
          >
            <InventoryPicker
              value={adjustmentForm.watch("inv_code") ?? ""}
              options={inventoryOptions}
              placeholder="Cari inventory..."
              disabled={inventoryQuery.isLoading}
              className="w-full"
              inputClassName="h-10"
              onValueChange={(next) =>
                adjustmentForm.setValue("inv_code", next, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
              }
            />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Type" htmlFor="adj_type" error={adjustmentForm.formState.errors.adj_type?.message}>
            <SelectNative id="adj_type" {...adjustmentForm.register("adj_type")}>
              {WAREHOUSE_ADJUSTMENT_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </SelectNative>
          </FormField>
          <FormField label="Quantity" htmlFor="adjustment_qty" error={adjustmentForm.formState.errors.qty?.message}>
            <Input id="adjustment_qty" type="number" {...adjustmentForm.register("qty", { valueAsNumber: true })} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Approved by" htmlFor="approved_by">
            <Input id="approved_by" {...adjustmentForm.register("approved_by")} />
          </FormField>
          <FormField label="Reason" htmlFor="adjustment_reason" error={adjustmentForm.formState.errors.reason?.message}>
            <SelectNative id="adjustment_reason" {...adjustmentForm.register("reason")}>
              {WAREHOUSE_ADJUSTMENT_REASON_OPTIONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </SelectNative>
          </FormField>
        </div>
        <FormField label="Catatan" htmlFor="adjustment_notes" error={adjustmentForm.formState.errors.notes?.message}>
          <Textarea id="adjustment_notes" rows={3} {...adjustmentForm.register("notes")} />
        </FormField>
      </ModalFormShell>
    </PageShell>
  );
}
