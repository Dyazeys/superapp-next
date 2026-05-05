"use client";

import { useState, useReducer, useEffect } from "react";
import { toast } from "sonner";
import type { ShopeeTraffic, ShopeeTrafficFormData } from "@/types/marketing";
import {
  fetchShopeeTraffic,
  createShopeeTraffic,
  updateShopeeTraffic,
  deleteShopeeTraffic,
} from "@/features/marketing/shopee-traffic-service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

/* ─── Helpers ─── */

function formatNum(val: number): string {
  return new Intl.NumberFormat("id-ID").format(val);
}

function formatUSD(val: number): string {
  return "$" + new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

function formatIDR(val: number): string {
  return "Rp" + new Intl.NumberFormat("id-ID").format(val);
}

function pct(val: number): string {
  return val.toFixed(2) + "%";
}

/* ─── Reducer ─── */

type Action =
  | { type: "set"; payload: ShopeeTraffic[] }
  | { type: "add"; payload: ShopeeTraffic }
  | { type: "update"; payload: ShopeeTraffic }
  | { type: "remove"; id: string };

function trafficReducer(state: ShopeeTraffic[], action: Action): ShopeeTraffic[] {
  switch (action.type) {
    case "set":
      return action.payload;
    case "add":
      return [...state, action.payload];
    case "update":
      return state.map((d) => (d.id === action.payload.id ? action.payload : d));
    case "remove":
      return state.filter((d) => d.id !== action.id);
    default:
      return state;
  }
}

/* ─── Empty form ─── */

const emptyForm: ShopeeTrafficFormData = {
  date: new Date().toISOString().slice(0, 10),
  region: "",
  gross_sales_usd: 0,
  gross_sales_local: 0,
  gross_sales_rebate_usd: 0,
  gross_sales_rebate_local: 0,
  gross_orders: 0,
  gross_units_sold: 0,
  gross_avg_basket_usd: 0,
  gross_avg_basket_local: 0,
  gross_item_per_order: 0,
  gross_avg_selling_price_usd: 0,
  gross_avg_selling_price_local: 0,
  product_views: 0,
  product_clicks: 0,
  unique_visitors: 0,
  gross_order_conversion_rate: 0,
  gross_item_conversion_rate: 0,
};

type FormErrors = Partial<Record<keyof ShopeeTrafficFormData, string>>;

function validateForm(d: ShopeeTrafficFormData): FormErrors {
  const errors: FormErrors = {};
  if (!d.date) errors.date = "Tanggal wajib diisi.";
  if (!d.region.trim()) errors.region = "Region wajib diisi.";
  if (d.gross_orders < 0) errors.gross_orders = "Tidak boleh negatif.";
  if (d.product_views < 0) errors.product_views = "Tidak boleh negatif.";
  return errors;
}

/* ─── Main component ─── */

export function ShopeeTrafficWorkspace() {
  const [items, dispatch] = useReducer(trafficReducer, []);
  const [form, setForm] = useState<ShopeeTrafficFormData>({ ...emptyForm });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchShopeeTraffic()
      .then((data) => dispatch({ type: "set", payload: data }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const [errors, setErrors] = useState<FormErrors>({});
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const visible = items.filter((d) => {
    if (filterDateFrom && d.date < filterDateFrom) return false;
    if (filterDateTo && d.date > filterDateTo) return false;
    return true;
  });

  useEffect(() => { setPageIndex(0); }, [filterDateFrom, filterDateTo]);

  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const paginated = visible.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  useEffect(() => {
    if (pageIndex >= pageCount) setPageIndex(Math.max(0, pageCount - 1));
  }, [pageIndex, pageCount]);

  function handleChange<K extends keyof ShopeeTrafficFormData>(key: K, value: ShopeeTrafficFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit() {
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateShopeeTraffic(editingId, form);
        dispatch({ type: "update", payload: updated });
      } else {
        const created = await createShopeeTraffic(form);
        dispatch({ type: "add", payload: created });
      }
      handleCloseModal();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan data.");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(d: ShopeeTraffic) {
    setForm({
      date: d.date.slice(0, 10),
      region: d.region,
      gross_sales_usd: Number(d.gross_sales_usd),
      gross_sales_local: Number(d.gross_sales_local),
      gross_sales_rebate_usd: Number(d.gross_sales_rebate_usd),
      gross_sales_rebate_local: Number(d.gross_sales_rebate_local),
      gross_orders: Number(d.gross_orders),
      gross_units_sold: Number(d.gross_units_sold),
      gross_avg_basket_usd: Number(d.gross_avg_basket_usd),
      gross_avg_basket_local: Number(d.gross_avg_basket_local),
      gross_item_per_order: Number(d.gross_item_per_order),
      gross_avg_selling_price_usd: Number(d.gross_avg_selling_price_usd),
      gross_avg_selling_price_local: Number(d.gross_avg_selling_price_local),
      product_views: Number(d.product_views),
      product_clicks: Number(d.product_clicks),
      unique_visitors: Number(d.unique_visitors),
      gross_order_conversion_rate: Number(d.gross_order_conversion_rate),
      gross_item_conversion_rate: Number(d.gross_item_conversion_rate),
    });
    setEditingId(d.id);
    setErrors({});
    setModalOpen(true);
  }

  function handleOpenModal() {
    setForm({ ...emptyForm });
    setEditingId(null);
    setErrors({});
    setModalOpen(true);
  }

  function handleCloseModal() {
    setForm({ ...emptyForm });
    setEditingId(null);
    setErrors({});
    setModalOpen(false);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === visible.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visible.map((d) => d.id).filter(Boolean) as string[]));
    }
  }

  function handleToolbarEdit() {
    const first = visible.find((d) => selectedIds.has(d.id));
    if (first) handleEdit(first);
  }

  async function handleToolbarDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Yakin ingin menghapus ${ids.length} data?`)) return;
    for (const id of ids) {
      await deleteShopeeTraffic(id)
        .then(() => dispatch({ type: "remove", id }))
        .catch(() => {});
    }
    setSelectedIds(new Set());
  }

  const isAllSelected = visible.length > 0 && selectedIds.size === visible.length;
  const someSelected = selectedIds.size > 0;

  return (
    <div className="space-y-6">
      {/* ── Filter ── */}
      <WorkspacePanel
        title="Filter Traffic Shopee"
        description="Filter data traffic Shopee berdasarkan rentang tanggal."
      >
        <div className="flex flex-wrap items-end gap-4">
          <FormField label="Dari tanggal" htmlFor="filter_from">
            <Input
              id="filter_from"
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
            />
          </FormField>
          <FormField label="Sampai tanggal" htmlFor="filter_to">
            <Input
              id="filter_to"
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
            />
          </FormField>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFilterDateFrom("");
              setFilterDateTo("");
            }}
          >
            Reset
          </Button>
          <Button size="sm" className="ml-auto" onClick={handleOpenModal}>
            <Plus className="mr-1 size-4" />
            Input Baru
          </Button>
        </div>
      </WorkspacePanel>

      {/* ── Input / Edit Modal ── */}
      <ModalFormShell
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseModal();
        }}
        title={editingId ? "Edit Traffic Shopee" : "Input Traffic Shopee"}
        description={
          editingId
            ? "Ubah data traffic toko Shopee."
            : "Isi data traffic toko Shopee untuk dicatat."
        }
        submitLabel={editingId ? "Simpan Perubahan" : "Simpan"}
        onSubmit={handleSubmit}
        isSubmitting={saving}
      >
        <ShopeeTrafficForm form={form} errors={errors} onChange={handleChange} />
      </ModalFormShell>

      {/* ── Table ── */}
      <WorkspacePanel
        title="Tabel Traffic Shopee"
        description="Data traffic toko Shopee harian per region."
      >
        {someSelected && (
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-border/70 bg-card/80 px-4 py-2">
            <span className="text-sm font-medium text-foreground">{selectedIds.size} terpilih</span>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleToolbarEdit} disabled={selectedIds.size !== 1}>
                <Pencil className="mr-1 size-3.5" />
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={handleToolbarDelete} className="text-destructive hover:text-destructive">
                <Trash2 className="mr-1 size-3.5" />
                Hapus
              </Button>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={isAllSelected} onCheckedChange={toggleSelectAll} />
                </TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Region</TableHead>
                <TableHead className="text-right">Gross Sales (USD)</TableHead>
                <TableHead className="text-right">Gross Sales (IDR)</TableHead>
                <TableHead className="text-right">Rebate (USD)</TableHead>
                <TableHead className="text-right">Rebate (IDR)</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Units Sold</TableHead>
                <TableHead className="text-right">Avg Basket (USD)</TableHead>
                <TableHead className="text-right">Avg Basket (IDR)</TableHead>
                <TableHead className="text-right">Item/Order</TableHead>
                <TableHead className="text-right">Avg Price (USD)</TableHead>
                <TableHead className="text-right">Avg Price (IDR)</TableHead>
                <TableHead className="text-right">Product Views</TableHead>
                <TableHead className="text-right">Product Clicks</TableHead>
                <TableHead className="text-right">Unique Visitors</TableHead>
                <TableHead className="text-right">Order Conv. Rate</TableHead>
                <TableHead className="text-right">Item Conv. Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={20} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={20} className="py-8 text-center text-muted-foreground">
                    Belum ada data. Klik &ldquo;Input Baru&rdquo; untuk menambahkan.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <Checkbox checked={selectedIds.has(d.id)} onCheckedChange={() => toggleSelect(d.id)} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{d.date}</TableCell>
                    <TableCell>{d.region}</TableCell>
                    <TableCell className="text-right">{formatUSD(Number(d.gross_sales_usd))}</TableCell>
                    <TableCell className="text-right">{formatIDR(Number(d.gross_sales_local))}</TableCell>
                    <TableCell className="text-right">{formatUSD(Number(d.gross_sales_rebate_usd))}</TableCell>
                    <TableCell className="text-right">{formatIDR(Number(d.gross_sales_rebate_local))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.gross_orders))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.gross_units_sold))}</TableCell>
                    <TableCell className="text-right">{formatUSD(Number(d.gross_avg_basket_usd))}</TableCell>
                    <TableCell className="text-right">{formatIDR(Number(d.gross_avg_basket_local))}</TableCell>
                    <TableCell className="text-right">{Number(d.gross_item_per_order).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{formatUSD(Number(d.gross_avg_selling_price_usd))}</TableCell>
                    <TableCell className="text-right">{formatIDR(Number(d.gross_avg_selling_price_local))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.product_views))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.product_clicks))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.unique_visitors))}</TableCell>
                    <TableCell className="text-right font-medium">{pct(Number(d.gross_order_conversion_rate))}</TableCell>
                    <TableCell className="text-right font-medium">{pct(Number(d.gross_item_conversion_rate))}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {visible.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-3 py-2">
            <p className="text-xs text-slate-500">
              Menampilkan {paginated.length > 0 ? `${pageIndex * pageSize + 1}-${pageIndex * pageSize + paginated.length}` : 0} dari {visible.length}
            </p>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500" htmlFor="straffic_page_size">Baris</label>
              <select
                id="straffic_page_size"
                className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700"
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPageIndex(0); }}
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <Button size="sm" variant="outline" className="h-8 px-2" disabled={pageIndex === 0} onClick={() => setPageIndex((p) => p - 1)}>
                Prev
              </Button>
              <span className="px-1 text-xs text-slate-600">{pageIndex + 1} / {pageCount}</span>
              <Button size="sm" variant="outline" className="h-8 px-2" disabled={pageIndex >= pageCount - 1} onClick={() => setPageIndex((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </WorkspacePanel>
    </div>
  );
}

/* ─── Sub-form ─── */

function ShopeeTrafficForm({
  form,
  errors,
  onChange,
}: {
  form: ShopeeTrafficFormData;
  errors: FormErrors;
  onChange: <K extends keyof ShopeeTrafficFormData>(key: K, value: ShopeeTrafficFormData[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <FormField label="Tanggal" htmlFor="date" error={errors.date}>
          <Input
            id="date"
            type="date"
            value={form.date}
            onChange={(e) => onChange("date", e.target.value)}
          />
        </FormField>
        <FormField label="Region" htmlFor="region" error={errors.region}>
          <Input
            id="region"
            placeholder="cth: Indonesia"
            value={form.region}
            onChange={(e) => onChange("region", e.target.value)}
          />
        </FormField>
        <FormField label="Gross Sales (USD)" htmlFor="gross_sales_usd">
          <Input
            id="gross_sales_usd"
            type="number"
            min={0}
            step="0.01"
            value={form.gross_sales_usd}
            onChange={(e) => onChange("gross_sales_usd", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Gross Sales (IDR)" htmlFor="gross_sales_local">
          <Input
            id="gross_sales_local"
            type="number"
            min={0}
            value={form.gross_sales_local}
            onChange={(e) => onChange("gross_sales_local", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Rebate (USD)" htmlFor="gross_sales_rebate_usd">
          <Input
            id="gross_sales_rebate_usd"
            type="number"
            min={0}
            step="0.01"
            value={form.gross_sales_rebate_usd}
            onChange={(e) => onChange("gross_sales_rebate_usd", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Rebate (IDR)" htmlFor="gross_sales_rebate_local">
          <Input
            id="gross_sales_rebate_local"
            type="number"
            min={0}
            value={form.gross_sales_rebate_local}
            onChange={(e) => onChange("gross_sales_rebate_local", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Gross Orders" htmlFor="gross_orders" error={errors.gross_orders}>
          <Input
            id="gross_orders"
            type="number"
            min={0}
            value={form.gross_orders}
            onChange={(e) => onChange("gross_orders", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Gross Units Sold" htmlFor="gross_units_sold">
          <Input
            id="gross_units_sold"
            type="number"
            min={0}
            value={form.gross_units_sold}
            onChange={(e) => onChange("gross_units_sold", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Avg Basket (USD)" htmlFor="gross_avg_basket_usd">
          <Input
            id="gross_avg_basket_usd"
            type="number"
            min={0}
            step="0.01"
            value={form.gross_avg_basket_usd}
            onChange={(e) => onChange("gross_avg_basket_usd", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Avg Basket (IDR)" htmlFor="gross_avg_basket_local">
          <Input
            id="gross_avg_basket_local"
            type="number"
            min={0}
            value={form.gross_avg_basket_local}
            onChange={(e) => onChange("gross_avg_basket_local", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Item per Order" htmlFor="gross_item_per_order">
          <Input
            id="gross_item_per_order"
            type="number"
            min={0}
            step="0.01"
            value={form.gross_item_per_order}
            onChange={(e) => onChange("gross_item_per_order", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Avg Selling Price (USD)" htmlFor="gross_avg_selling_price_usd">
          <Input
            id="gross_avg_selling_price_usd"
            type="number"
            min={0}
            step="0.01"
            value={form.gross_avg_selling_price_usd}
            onChange={(e) => onChange("gross_avg_selling_price_usd", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Avg Selling Price (IDR)" htmlFor="gross_avg_selling_price_local">
          <Input
            id="gross_avg_selling_price_local"
            type="number"
            min={0}
            value={form.gross_avg_selling_price_local}
            onChange={(e) => onChange("gross_avg_selling_price_local", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Product Views" htmlFor="product_views" error={errors.product_views}>
          <Input
            id="product_views"
            type="number"
            min={0}
            value={form.product_views}
            onChange={(e) => onChange("product_views", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Product Clicks" htmlFor="product_clicks">
          <Input
            id="product_clicks"
            type="number"
            min={0}
            value={form.product_clicks}
            onChange={(e) => onChange("product_clicks", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Unique Visitors" htmlFor="unique_visitors">
          <Input
            id="unique_visitors"
            type="number"
            min={0}
            value={form.unique_visitors}
            onChange={(e) => onChange("unique_visitors", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Order Conv. Rate (%)" htmlFor="gross_order_conversion_rate">
          <Input
            id="gross_order_conversion_rate"
            type="number"
            step="0.01"
            min={0}
            placeholder="cth: 3.84"
            value={form.gross_order_conversion_rate}
            onChange={(e) => onChange("gross_order_conversion_rate", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Item Conv. Rate (%)" htmlFor="gross_item_conversion_rate">
          <Input
            id="gross_item_conversion_rate"
            type="number"
            step="0.01"
            min={0}
            placeholder="cth: 5.00"
            value={form.gross_item_conversion_rate}
            onChange={(e) => onChange("gross_item_conversion_rate", e.target.valueAsNumber || 0)}
          />
        </FormField>
      </div>
    </div>
  );
}