"use client";

import { useState, useReducer, useEffect } from "react";
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
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

/* ─── Helpers ─── */

function formatNum(val: number): string {
  return new Intl.NumberFormat("id-ID").format(val);
}

function formatUSD(val: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

function formatIDR(val: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
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

  const visible = items.filter((d) => {
    if (filterDateFrom && d.date < filterDateFrom) return false;
    if (filterDateTo && d.date > filterDateTo) return false;
    return true;
  });

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
    } catch {
      // error handled by api-error
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(d: ShopeeTraffic) {
    setForm({
      date: d.date,
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

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    try {
      await deleteShopeeTraffic(id);
      dispatch({ type: "remove", id });
    } catch {
      // error handled by api-error
    }
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
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
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={19} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={19} className="py-8 text-center text-muted-foreground">
                    Belum ada data. Klik &ldquo;Input Baru&rdquo; untuk menambahkan.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((d) => (
                  <TableRow key={d.id}>
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
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(d)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(d.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
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