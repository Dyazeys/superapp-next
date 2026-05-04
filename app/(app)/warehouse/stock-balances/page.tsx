"use client";

import { useMemo, useState } from "react";
import { Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/foundation/page-shell";
import { MetricCard } from "@/components/layout/stats-card";
import { Button } from "@/components/ui/button";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { useWarehouseStockBalances } from "@/features/warehouse/use-warehouse-module";
import type { StockBalanceRecord } from "@/types/warehouse";

const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

function qtyAccentColor(qty: number) {
  if (qty > 0) return "border-l-slate-500";
  if (qty < 0) return "border-l-red-500";
  return "border-l-slate-300";
}

function qtyTextColor(qty: number) {
  if (qty > 0) return "text-slate-700";
  if (qty < 0) return "text-red-600";
  return "text-slate-400";
}

interface VariationGroup {
  variation: string | null;
  categoryCode: string | null;
  totalQty: number;
  totalHpp: string | null;
  unitPriceFallback: string | null;
  productNames: string[];
  items: Array<{
    inv_code: string;
    qty_on_hand: number;
    is_active: boolean;
    last_updated: string;
  }>;
  latestUpdate: string;
  anyInactive: boolean;
}

function groupByVariation(rows: StockBalanceRecord[]): VariationGroup[] {
  const groupMap = new Map<string, VariationGroup>();
  const ungrouped: VariationGroup[] = [];

  for (const row of rows) {
    const asMain = row.master_inventory.master_product_master_product_inv_mainTomaster_inventory;
    const productName = asMain[0]?.product_name ?? null;
    const inv = {
      inv_code: row.inv_code,
      qty_on_hand: row.qty_on_hand,
      is_active: row.master_inventory.is_active,
      last_updated: row.last_updated,
    };

    if (asMain.length > 0) {
      const product = asMain[0];
      if (!product.variations?.trim()) {
        ungrouped.push(makeSingle(inv, row.master_inventory.unit_price, product.category_code ?? null));
        continue;
      }
      const key = product.variations;
      const existing = groupMap.get(key);
      if (existing) {
        existing.totalQty += row.qty_on_hand;
        existing.items.push(inv);
        existing.totalHpp = product.total_hpp;
        if (productName && !existing.productNames.includes(productName)) {
          existing.productNames.push(productName);
        }
        if (row.last_updated > existing.latestUpdate) existing.latestUpdate = row.last_updated;
        if (!row.master_inventory.is_active) existing.anyInactive = true;
      } else {
        groupMap.set(key, {
          variation: key,
          categoryCode: product.category_code ?? null,
          totalQty: row.qty_on_hand,
          totalHpp: product.total_hpp,
          unitPriceFallback: null,
          productNames: productName ? [productName] : [],
          items: [inv],
          latestUpdate: row.last_updated,
          anyInactive: !row.master_inventory.is_active,
        });
      }
    } else {
      ungrouped.push(makeSingle(inv, row.master_inventory.unit_price, null));
    }
  }

  const grouped = [...groupMap.values()].sort((a, b) => {
    const ca = a.categoryCode ?? "zzz";
    const cb = b.categoryCode ?? "zzz";
    if (ca < cb) return -1;
    if (ca > cb) return 1;
    return (a.variation ?? "").localeCompare(b.variation ?? "");
  });
  const singles = ungrouped.sort((a, b) => {
    const ca = a.categoryCode ?? "zzz";
    const cb = b.categoryCode ?? "zzz";
    if (ca < cb) return -1;
    if (ca > cb) return 1;
    return a.items[0]?.inv_code.localeCompare(b.items[0]?.inv_code ?? "");
  });
  return [...grouped, ...singles];
}

function makeSingle(
  inv: VariationGroup["items"][number],
  unitPrice: string | null,
  categoryCode: string | null,
): VariationGroup {
  return {
    variation: null,
    categoryCode,
    totalQty: inv.qty_on_hand,
    totalHpp: null,
    unitPriceFallback: unitPrice,
    productNames: [],
    items: [inv],
    latestUpdate: inv.last_updated,
    anyInactive: !inv.is_active,
  };
}

export default function WarehouseStockBalancesPage() {
  const stockBalancesQuery = useWarehouseStockBalances();
  const rawRows = stockBalancesQuery.data;
  const allRows = useMemo(() => rawRows ?? [], [rawRows]);

  const [productFilter, setProductFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(24);

  const groups = useMemo(() => groupByVariation(allRows), [allRows]);

  const productNameToQty = useMemo(() => {
    const map = new Map<string, number>();
    for (const group of groups) {
      if (!group.variation) continue;
      for (const name of group.productNames) {
        map.set(name, (map.get(name) ?? 0) + group.totalQty);
      }
    }
    return map;
  }, [groups]);

  const productOptions: SearchableOption[] = useMemo(() => {
    const seen = new Set<string>();
    const options: SearchableOption[] = [{ label: "Semua", value: "ALL" }];
    for (const name of productNameToQty.keys()) {
      if (!seen.has(name)) {
        seen.add(name);
        options.push({ label: name, value: name });
      }
    }
    return options;
  }, [productNameToQty]);

  const filteredGroups = useMemo(() => {
    if (productFilter !== "ALL") {
      return groups.filter((g) => g.productNames.includes(productFilter));
    }
    return groups;
  }, [groups, productFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedGroups = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredGroups.slice(start, start + pageSize);
  }, [filteredGroups, safePage, pageSize]);

  const metrics = useMemo(() => {
    const data = productFilter === "ALL" ? groups : filteredGroups;
    const totalGroups = data.length;
    const groupsWithStock = data.filter((g) => g.totalQty > 0).length;
    const negativeGroups = data.filter((g) => g.totalQty < 0).length;
    const totalQty = data.reduce((sum, g) => sum + g.totalQty, 0);
    const latestUpdate =
      data.length === 0
        ? "-"
        : data
            .map((g) => g.latestUpdate)
            .reduce((latest, next) => (next > latest ? next : latest))
            .slice(0, 19)
            .replace("T", " ");
    return { totalGroups, groupsWithStock, negativeGroups, totalQty, latestUpdate };
  }, [groups, filteredGroups, productFilter]);

  const startRow = (safePage - 1) * pageSize + 1;
  const endRow = Math.min(safePage * pageSize, filteredGroups.length);

  return (
    <PageShell
      eyebrow="Warehouse"
      title="Stock Balances"
      description="Lihat saldo on-hand terkini yang di-group berdasarkan variasi produk."
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-5">
          <MetricCard title="Total groups" value={String(metrics.totalGroups)} subtitle="Jumlah grup variasi produk." />
          <MetricCard title="Dengan stok" value={String(metrics.groupsWithStock)} subtitle="Grup dengan qty > 0." />
          <MetricCard title="Negatif" value={String(metrics.negativeGroups)} subtitle="Grup dengan qty < 0." />
          <MetricCard title="Total qty" value={metrics.totalQty.toLocaleString("id-ID")} subtitle="Akumulasi qty semua grup." />
          <MetricCard title="Update terbaru" value={metrics.latestUpdate} subtitle="Update terbaru dari data yang terlihat." />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-56">
              <SearchableSelect
                options={productOptions}
                value={productFilter}
                onValueChange={(v) => {
                  setProductFilter(v || "ALL");
                  setPage(1);
                }}
                placeholder="Cari produk..."
                emptyText="Tidak ditemukan"
                portal={false}
                renderOption={(option) => {
                  if (option.value === "ALL") {
                    return <span className="text-slate-500">Semua</span>;
                  }
                  const qty = productNameToQty.get(option.value);
                  return (
                    <div className="flex items-center justify-between gap-4">
                      <span className="truncate">{option.label}</span>
                      <span className="shrink-0 whitespace-nowrap tabular-nums text-slate-500">
                        <i className="not-italic text-slate-400">total stock </i>
                        {qty?.toLocaleString("id-ID") ?? ""}
                      </span>
                    </div>
                  );
                }}
              />
            </div>
            {productFilter !== "ALL" ? (
              <span className="text-sm text-slate-600">
                <i>total stock</i>{" "}
                <span className="tabular-nums">
                  {productNameToQty.get(productFilter)?.toLocaleString("id-ID") ?? "0"}
                </span>
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>
              {filteredGroups.length === 0
                ? "Tidak ada data"
                : `${startRow}-${endRow} dari ${filteredGroups.length}`}
            </span>
            <select
              className="h-7 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-600"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}/hlm
                </option>
              ))}
            </select>
          </div>
        </div>

        {paginatedGroups.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white/50 text-sm text-slate-400">
            <Package className="size-10 text-slate-300" />
            <p>Belum ada data stock balance.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {paginatedGroups.map((group, idx) => {
              const accentKey = group.variation ?? `single-${idx}`;
              return (
                <Card
                  key={accentKey}
                  size="sm"
                  className={`border-l-4 ${qtyAccentColor(group.totalQty)} ${
                    group.anyInactive ? "opacity-50" : ""
                  }`}
                  style={{ padding: 0 }}
                >
                  <div className="flex flex-col gap-1.5 px-3 py-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className={`text-2xl font-bold tabular-nums tracking-tight ${qtyTextColor(group.totalQty)}`}
                      >
                        {group.totalQty.toLocaleString("id-ID")}
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">
                        {group.variation
                          ? group.totalHpp
                            ? `Rp ${Number(group.totalHpp).toLocaleString("id-ID")}`
                            : "-"
                          : group.unitPriceFallback
                            ? `Rp ${Number(group.unitPriceFallback).toLocaleString("id-ID")}`
                            : "-"}
                      </span>
                    </div>

                    {group.variation ? (
                      <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                        {group.variation}
                      </p>
                    ) : null}

                    <div className="space-y-0.5">
                      {group.items.slice(0, 5).map((item) => (
                        <p
                          key={item.inv_code}
                          className="flex items-baseline justify-between gap-2 font-mono text-xs text-slate-600"
                        >
                          <span className="min-w-0 truncate">{item.inv_code}</span>
                          <span className="shrink-0 font-medium tabular-nums text-slate-800">
                            {item.qty_on_hand.toLocaleString("id-ID")}
                          </span>
                        </p>
                      ))}
                      {group.items.length > 5 ? (
                        <p className="text-[11px] text-slate-400">
                          +{group.items.length - 5} lainnya
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                      <span>Update {new Date(group.latestUpdate).toLocaleDateString("id-ID")}</span>
                      {group.anyInactive ? (
                        <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 font-medium text-slate-500">
                          Inactive
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Sebelumnya
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== p - 1 ? (
                    <span className="px-1 text-xs text-slate-300">...</span>
                  ) : null}
                  <button
                    className={`min-w-[32px] rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                      p === safePage
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Selanjutnya
            </Button>
            <span className="ml-2 text-xs text-slate-400">
              Halaman {safePage} dari {totalPages}
            </span>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
