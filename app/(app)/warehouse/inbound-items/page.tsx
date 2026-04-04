"use client";

import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/feedback/status-badge";
import { PageShell } from "@/components/foundation/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useWarehouseInbound,
  useWarehouseInboundItems,
  useWarehouseInboundSelection,
  useWarehouseInventoryLookup,
} from "@/features/warehouse/use-warehouse-module";
import type { InboundItemRecord } from "@/types/warehouse";

const columnHelper = createColumnHelper<InboundItemRecord>();

export default function WarehouseInboundItemsPage() {
  const { inboundQuery } = useWarehouseInbound();
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

  const selectedInbound = (inboundQuery.data ?? []).find((record) => record.id === currentInboundId) ?? null;

  const rows = useMemo(() => {
    const base = inboundItemsQuery.data ?? [];
    if (!inboundItemDraft || editingInboundItemId) {
      return base;
    }

    return [
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
      ...base,
    ];
  }, [editingInboundItemId, inboundItemDraft, inboundItemsQuery.data, inventoryQuery.data]);

  const isEditingRow = (id: string) =>
    editingInboundItemId === id || (id === "__new__" && !editingInboundItemId && Boolean(inboundItemDraft));

  const columns = [
    columnHelper.accessor("inv_code", {
      header: "Inventory",
      cell: ({ row, getValue }) =>
        isEditingRow(row.original.id) ? (
          <Input
            list="warehouse-inbound-item-inventory-codes"
            value={inboundItemDraft?.inv_code ?? getValue()}
            onChange={(event) =>
              setInboundItemDraft((prev) => (prev ? { ...prev, inv_code: event.target.value } : prev))
            }
            className="h-8 min-w-[150px]"
          />
        ) : (
          <div>
            <p className="font-medium">{getValue()}</p>
            <p className="text-xs text-muted-foreground">{row.original.master_inventory?.inv_name ?? ""}</p>
          </div>
        ),
    }),
    columnHelper.accessor("qty_received", {
      header: "Received",
      cell: ({ row, getValue }) =>
        isEditingRow(row.original.id) ? (
          <Input
            value={String(inboundItemDraft?.qty_received ?? getValue())}
            onChange={(event) =>
              setInboundItemDraft((prev) => (prev ? { ...prev, qty_received: Number(event.target.value || 0) } : prev))
            }
            className="h-8 w-20"
          />
        ) : (
          getValue()
        ),
    }),
    columnHelper.accessor("qty_passed_qc", {
      header: "Passed QC",
      cell: ({ row, getValue }) =>
        isEditingRow(row.original.id) ? (
          <Input
            value={String(inboundItemDraft?.qty_passed_qc ?? getValue())}
            onChange={(event) =>
              setInboundItemDraft((prev) =>
                prev ? { ...prev, qty_passed_qc: Number(event.target.value || 0) } : prev
              )
            }
            className="h-8 w-20"
          />
        ) : (
          <StatusBadge label={String(getValue())} tone="success" />
        ),
    }),
    columnHelper.accessor("qty_rejected_qc", {
      header: "Rejected",
      cell: ({ row, getValue }) =>
        isEditingRow(row.original.id) ? (
          <Input
            value={String(inboundItemDraft?.qty_rejected_qc ?? getValue())}
            onChange={(event) =>
              setInboundItemDraft((prev) =>
                prev ? { ...prev, qty_rejected_qc: Number(event.target.value || 0) } : prev
              )
            }
            className="h-8 w-20"
          />
        ) : (
          getValue()
        ),
    }),
    columnHelper.accessor("unit_cost", {
      header: "Unit Cost",
      cell: ({ row, getValue }) =>
        isEditingRow(row.original.id) ? (
          <Input
            value={inboundItemDraft?.unit_cost ?? getValue() ?? ""}
            onChange={(event) =>
              setInboundItemDraft((prev) => (prev ? { ...prev, unit_cost: event.target.value || null } : prev))
            }
            className="h-8 w-24"
          />
        ) : (
          getValue() ?? "-"
        ),
    }),
    columnHelper.display({
      id: "stock_effect",
      header: "Stock Effect",
      cell: ({ row }) => (
        <StatusBadge
          label={`+${isEditingRow(row.original.id) ? inboundItemDraft?.qty_passed_qc ?? row.original.qty_passed_qc : row.original.qty_passed_qc}`}
          tone="success"
        />
      ),
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
              disabled={actionPending}
              onClick={() => inboundItemDraft && saveInboundItem(inboundItemDraft)}
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
              disabled={actionPending}
              onClick={() => startEditingInboundItem(row.original)}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button size="icon-xs" variant="outline" disabled={actionPending} onClick={() => deleteInboundItem(row.original.id)}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
    }),
  ];

  return (
    <PageShell
      eyebrow="Warehouse"
      title="Inbound Items"
      description="Manage inbound line items inline, preserving the existing stock logic that posts passed QC quantities."
    >
      <datalist id="warehouse-inbound-item-inventory-codes">
        {(inventoryQuery.data ?? []).map((inventory) => (
          <option key={inventory.inv_code} value={inventory.inv_code}>
            {inventory.inv_name}
          </option>
        ))}
      </datalist>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <label htmlFor="warehouse-inbound-selection" className="text-sm font-medium text-muted-foreground">
              Selected inbound
            </label>
            <select
              id="warehouse-inbound-selection"
              className="min-w-[320px] rounded-2xl border border-input bg-background px-3 py-2 text-sm"
              value={selectedInboundId ?? currentInboundId ?? ""}
              disabled={inboundQuery.isLoading}
              onChange={(event) => setSelectedInboundId(event.target.value || null)}
            >
              {(inboundQuery.data ?? []).map((inbound) => (
                <option key={inbound.id} value={inbound.id}>
                  {toInboundLabel(inbound.id, inbound.receive_date, inbound.purchase_orders?.po_number)}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground">
              {selectedInbound
                ? `${selectedInbound.purchase_orders?.po_number ?? "No PO"} · ${selectedInbound._count?.inbound_items ?? 0} item rows`
                : "Choose an inbound delivery to manage its item rows."}
            </p>
          </div>
          {currentInboundId ? (
            <Button size="sm" disabled={actionPending} onClick={startNewInboundItem}>
              <Plus className="size-4" />
              Add inbound item
            </Button>
          ) : null}
        </div>

        {inboundQuery.isError ? (
          <EmptyState title="Failed to load inbound deliveries" description={inboundQuery.error.message} />
        ) : inventoryQuery.isError ? (
          <EmptyState title="Failed to load inventory" description={inventoryQuery.error.message} />
        ) : inboundItemsQuery.isError ? (
          <EmptyState title="Failed to load inbound items" description={inboundItemsQuery.error.message} />
        ) : currentInboundId ? (
          <DataTable columns={columns} data={rows} emptyMessage="No inbound items yet." />
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
