"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createColumnHelper } from "@tanstack/react-table";
import { Lock, Pencil, Plus, Save, Search, Trash2, Upload, X } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { MetricCard } from "@/components/layout/stats-card";
import { Button } from "@/components/ui/button";
import { SelectNative } from "@/components/ui/select-native";
import {
  isInboundPosted,
  useWarehouseInbound,
  useWarehouseInboundItems,
  useWarehouseInboundSelection,
  useWarehouseInventoryLookup,
} from "@/features/warehouse/use-warehouse-module";
import type { InboundItemInput } from "@/schemas/warehouse-module";
import type { InboundItemRecord } from "@/types/warehouse";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<InboundItemRecord>();

type InventoryOption = {
  value: string;
  label: string;
};

type DraftSetter = React.Dispatch<React.SetStateAction<InboundItemInput | null>>;

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

function syncReceivedDraft(prev: InboundItemInput, nextReceived: number): InboundItemInput {
  const shouldFollowReceived =
    prev.qty_rejected_qc === 0 && (prev.qty_passed_qc === 0 || prev.qty_passed_qc === prev.qty_received);

  return {
    ...prev,
    qty_received: nextReceived,
    qty_passed_qc: shouldFollowReceived ? nextReceived : prev.qty_passed_qc,
  };
}

function syncRejectedDraft(prev: InboundItemInput, nextRejected: number): InboundItemInput {
  const safeRejected = Math.max(0, nextRejected);
  const recalculatedPassed = Math.max(0, prev.qty_received - safeRejected);

  return {
    ...prev,
    qty_rejected_qc: safeRejected,
    qty_passed_qc: recalculatedPassed,
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
                        {parts.name ? (
                          <div className="truncate text-xs text-slate-500">{parts.name}</div>
                        ) : null}
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

function InventoryEditor({
  editing,
  value,
  label,
  options,
  disabled,
  setInboundItemDraft,
}: {
  editing: boolean;
  value: string;
  label?: string | null;
  options: InventoryOption[];
  disabled: boolean;
  setInboundItemDraft: DraftSetter;
}) {
  if (!editing) {
    return (
      <div>
        <p className="font-medium">{value}</p>
        <p className="text-xs text-muted-foreground">{label ?? ""}</p>
      </div>
    );
  }

  return (
    <InventoryPicker
      value={value}
      options={options}
      placeholder="Cari inventory..."
      emptyText="Inventory tidak ditemukan."
      maxResults={120}
      className="min-w-[260px]"
      inputClassName="h-8 min-w-[260px]"
      disabled={disabled}
      onValueChange={(next) => setInboundItemDraft((prev) => (prev ? { ...prev, inv_code: next } : prev))}
    />
  );
}

function NumberEditor({
  editing,
  value,
  onChange,
  className,
  renderDisplay,
}: {
  editing: boolean;
  value: number;
  onChange: (value: number) => void;
  className: string;
  renderDisplay?: (value: number) => React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  if (!editing) {
    return renderDisplay ? renderDisplay(value) : value;
  }

  return (
    <input
      value={String(value)}
      ref={inputRef}
      onChange={(event) => {
        const digitsOnly = event.target.value.replace(/[^\d]/g, "");
        onChange(Number(digitsOnly || 0));
        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
      }}
      className={cn(
        "h-8 rounded-xl border border-input bg-white px-3 py-1 text-sm text-slate-800 shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    />
  );
}

function UnitCostEditor({
  editing,
  value,
  setInboundItemDraft,
}: {
  editing: boolean;
  value: string;
  setInboundItemDraft: DraftSetter;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  if (!editing) {
    return value || "-";
  }

  return (
    <input
      value={value}
      ref={inputRef}
      onChange={(event) => {
        const normalized = event.target.value.replace(/[^\d.]/g, "");
        setInboundItemDraft((prev) => (prev ? { ...prev, unit_cost: normalized || null } : prev));
        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
      }}
      className="h-8 w-24 rounded-xl border border-input bg-white px-3 py-1 text-sm text-slate-800 shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    />
  );
}

export default function WarehouseInboundItemsPage() {
  const { inboundQuery, postInbound } = useWarehouseInbound();
  const inventoryQuery = useWarehouseInventoryLookup();
  const { selectedInboundId, currentInboundId, setSelectedInboundId } = useWarehouseInboundSelection(inboundQuery.data);
  const {
    inboundItemsQuery,
    editingInboundItemId,
    inboundItemDraft,
    setInboundItemDraft,
    saveInboundItem,
    deleteInboundItem,
    startNewInboundItem,
    startEditingInboundItem,
    cancelEditingInboundItem,
    actionPending,
  } = useWarehouseInboundItems(currentInboundId ?? undefined);

  const inboundItemRows = inboundItemsQuery.data ?? [];
  const totalItemRows = inboundItemRows.length;
  const distinctInventory = new Set(inboundItemRows.map((row) => row.inv_code)).size;
  const totalReceived = inboundItemRows.reduce((sum, row) => sum + Number(row.qty_received || 0), 0);
  const totalPassed = inboundItemRows.reduce((sum, row) => sum + Number(row.qty_passed_qc || 0), 0);
  const totalRejected = inboundItemRows.reduce((sum, row) => sum + Number(row.qty_rejected_qc || 0), 0);
  const totalValue = inboundItemRows.reduce((sum, row) => sum + Number(row.qty_passed_qc || 0) * Number(row.unit_cost || 0), 0);
  const selectedInbound =
    (inboundQuery.data ?? []).find((inbound) => inbound.id === (currentInboundId ?? selectedInboundId ?? "")) ?? null;
  const inboundPosted = isInboundPosted(selectedInbound?.qc_status);

  const inventoryOptions = useMemo(
    () =>
      (inventoryQuery.data ?? []).map((inventory) => ({
        value: inventory.inv_code,
        label: `${inventory.inv_code} - ${inventory.inv_name}`,
      })),
    [inventoryQuery.data],
  );

  const inboundItemDraftRef = useRef(inboundItemDraft);

  useEffect(() => {
    inboundItemDraftRef.current = inboundItemDraft;
  }, [inboundItemDraft]);

  const rows = useMemo(() => {
    const base = inboundItemsQuery.data ?? [];
    if (editingInboundItemId && inboundItemDraft) {
      return base.map((row) =>
        row.id === editingInboundItemId
          ? {
              ...row,
              inv_code: inboundItemDraft.inv_code,
              qty_received: inboundItemDraft.qty_received,
              qty_passed_qc: inboundItemDraft.qty_passed_qc,
              qty_rejected_qc: inboundItemDraft.qty_rejected_qc,
              unit_cost: inboundItemDraft.unit_cost,
              master_inventory:
                inventoryQuery.data?.find((inventory) => inventory.inv_code === inboundItemDraft.inv_code) ?? row.master_inventory ?? null,
            }
          : row,
      );
    }

    if (!inboundItemDraft) {
      return base;
    }

    return [
      ...base,
      {
        id: "__new__",
        inbound_id: inboundItemDraft.inbound_id,
        inv_code: inboundItemDraft.inv_code,
        qty_received: inboundItemDraft.qty_received,
        qty_passed_qc: inboundItemDraft.qty_passed_qc,
        qty_rejected_qc: inboundItemDraft.qty_rejected_qc,
        unit_cost: inboundItemDraft.unit_cost,
        created_at: new Date().toISOString(),
        master_inventory: inventoryQuery.data?.find((inventory) => inventory.inv_code === inboundItemDraft.inv_code) ?? null,
      },
    ];
  }, [editingInboundItemId, inboundItemDraft, inboundItemsQuery.data, inventoryQuery.data]);

  const hasInlineDraft = Boolean(inboundItemDraft);

  const isEditingRow = useCallback(
    (id: string) => editingInboundItemId === id || (id === "__new__" && !editingInboundItemId && hasInlineDraft),
    [editingInboundItemId, hasInlineDraft],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("inv_code", {
        header: "Inventory",
        cell: ({ row, getValue }) => (
            <InventoryEditor
              editing={isEditingRow(row.original.id)}
              value={getValue()}
              label={row.original.master_inventory?.inv_name}
              options={inventoryOptions}
              disabled={inboundPosted || inventoryQuery.isLoading}
              setInboundItemDraft={setInboundItemDraft}
          />
        ),
      }),
      columnHelper.accessor("qty_received", {
        header: "Received",
        cell: ({ row, getValue }) => (
          <NumberEditor
            editing={isEditingRow(row.original.id)}
            value={getValue()}
            className="h-8 w-20"
            onChange={(value) => setInboundItemDraft((prev) => (prev ? syncReceivedDraft(prev, value) : prev))}
          />
        ),
      }),
      columnHelper.accessor("qty_passed_qc", {
        header: "Passed QC",
        cell: ({ row, getValue }) => (
          <NumberEditor
            editing={isEditingRow(row.original.id)}
            value={getValue()}
            className="h-8 w-20"
            onChange={(value) => setInboundItemDraft((prev) => (prev ? { ...prev, qty_passed_qc: value } : prev))}
            renderDisplay={(value) => <StatusBadge label={String(value)} tone="success" />}
          />
        ),
      }),
      columnHelper.accessor("qty_rejected_qc", {
        header: "Rejected",
        cell: ({ row, getValue }) => (
          <NumberEditor
            editing={isEditingRow(row.original.id)}
            value={getValue()}
            className="h-8 w-20"
            onChange={(value) => setInboundItemDraft((prev) => (prev ? syncRejectedDraft(prev, value) : prev))}
          />
        ),
      }),
      columnHelper.accessor("unit_cost", {
        header: "Unit Cost",
        cell: ({ row, getValue }) => (
          <UnitCostEditor
            editing={isEditingRow(row.original.id)}
            value={getValue() ?? ""}
            setInboundItemDraft={setInboundItemDraft}
          />
        ),
      }),
      columnHelper.display({
        id: "stock_effect",
        header: "Stock Effect",
        cell: ({ row }) => <StatusBadge label={`+${row.original.qty_passed_qc}`} tone="success" />,
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) =>
          isEditingRow(row.original.id) ? (
            <div className="flex justify-end gap-2">
              <Button
                size="icon-xs"
                variant="outline"
                disabled={actionPending || inboundPosted}
                onClick={() => inboundItemDraftRef.current && saveInboundItem(inboundItemDraftRef.current)}
              >
                <Save className="size-3.5" />
              </Button>
              <Button size="icon-xs" variant="outline" disabled={actionPending} onClick={cancelEditingInboundItem}>
                <X className="size-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Button
                size="icon-xs"
                variant="outline"
                disabled={actionPending || inboundPosted}
                onClick={() => startEditingInboundItem(row.original)}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                size="icon-xs"
                variant="outline"
                disabled={actionPending || inboundPosted}
                onClick={() => deleteInboundItem(row.original.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ),
      }),
    ],
    [
      actionPending,
      cancelEditingInboundItem,
      deleteInboundItem,
      inboundPosted,
      inventoryOptions,
      inventoryQuery.isLoading,
      isEditingRow,
      saveInboundItem,
      setInboundItemDraft,
      startEditingInboundItem,
    ],
  );

  return (
    <PageShell
      eyebrow="Warehouse"
      title="Inbound Items"
      description="Kelola item inbound dan pastikan qty lulus QC menjadi penambah stok sesuai alur yang sudah ada."
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-5">
          <MetricCard title="Total item rows" value={String(totalItemRows)} subtitle="Baris item untuk inbound terpilih." />
          <MetricCard title="Inventory codes" value={String(distinctInventory)} subtitle="Jumlah kode inventory unik." />
          <MetricCard title="Qty received" value={totalReceived.toLocaleString("id-ID")} subtitle="Total qty diterima." />
          <MetricCard title="Qty passed QC" value={totalPassed.toLocaleString("id-ID")} subtitle="Qty yang mem-posting stok." />
          <MetricCard
            title="Value (passed)"
            value={totalValue.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
            subtitle={`Rejected: ${totalRejected.toLocaleString("id-ID")}`}
          />
        </div>

        <div className="flex flex-col gap-3 rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="w-full space-y-1.5 md:max-w-[520px]">
            <label htmlFor="warehouse-inbound-selection" className="text-xs font-medium tracking-[0.02em] text-foreground/80">
              Selected inbound
            </label>
            <SelectNative
              id="warehouse-inbound-selection"
              className="w-full"
              value={selectedInboundId ?? currentInboundId ?? ""}
              disabled={inboundQuery.isLoading}
              onChange={(event) => setSelectedInboundId(event.target.value || null)}
            >
              {(inboundQuery.data ?? []).map((inbound) => (
                <option key={inbound.id} value={inbound.id}>
                  {toInboundLabel(inbound.id, inbound.receive_date, inbound.purchase_orders?.po_number)}
                </option>
              ))}
            </SelectNative>
          </div>
          <div className="flex items-center gap-2">
            {selectedInbound ? (
              <StatusBadge
                label={selectedInbound.qc_status}
                tone={selectedInbound.qc_status === "PASSED" ? "info" : "neutral"}
              />
            ) : null}
            {currentInboundId ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionPending || inboundPosted || inboundItemRows.length === 0}
                  onClick={() => postInbound(currentInboundId)}
                >
                  {inboundPosted ? <Lock className="size-4" /> : <Upload className="size-4" />}
                  {inboundPosted ? "Posted" : "Post stock"}
                </Button>
                <Button
                  size="sm"
                  disabled={actionPending || inboundPosted}
                  onClick={startNewInboundItem}
                >
                  <Plus className="size-4" />
                  Add inbound item
                </Button>
              </>
            ) : null}
          </div>
        </div>
        {selectedInbound ? (
          <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
            {inboundPosted
              ? "Inbound ini sudah PASSED (posted). Stock movement dan stock balance sudah final, jadi item tidak bisa diubah lagi."
              : "Inbound item masih draft. Isi dan rapikan item dulu, lalu klik Post stock untuk benar-benar menambah stok dan mengunci inbound."}
          </div>
        ) : null}

        {inboundQuery.isError ? (
          <EmptyState title="Failed to load inbound deliveries" description={inboundQuery.error.message} />
        ) : inventoryQuery.isError ? (
          <EmptyState title="Failed to load inventory" description={inventoryQuery.error.message} />
        ) : inboundItemsQuery.isError ? (
          <EmptyState title="Failed to load inbound items" description={inboundItemsQuery.error.message} />
        ) : currentInboundId ? (
          <DataTable
            columns={columns}
            data={rows}
            getRowId={(row) => row.id}
            emptyMessage="No inbound items yet."
          />
        ) : (
          <EmptyState title="Select an inbound" description="Choose an inbound delivery to manage its item rows." />
        )}
      </div>
    </PageShell>
  );
}

function toInboundLabel(id: string, receiveDate: string, poNumber?: string | null) {
  const date = receiveDate.slice(0, 10);
  return `${poNumber ?? "No PO"} · ${date} · ${id.slice(0, 8)}`;
}
