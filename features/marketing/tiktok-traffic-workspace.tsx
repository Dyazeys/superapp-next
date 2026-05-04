"use client";

import { useState, useReducer, useEffect } from "react";
import { toast } from "sonner";
import type { TikTokTraffic, TikTokTrafficFormData } from "@/types/marketing";
import {
  fetchTiktokTraffic,
  createTiktokTraffic,
  updateTiktokTraffic,
  deleteTiktokTraffic,
} from "@/features/marketing/tiktok-traffic-service";
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
  | { type: "set"; payload: TikTokTraffic[] }
  | { type: "add"; payload: TikTokTraffic }
  | { type: "update"; payload: TikTokTraffic }
  | { type: "remove"; id: string };

function trafficReducer(state: TikTokTraffic[], action: Action): TikTokTraffic[] {
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

const emptyForm: TikTokTrafficFormData = {
  date: new Date().toISOString().slice(0, 10),
  gross_merchandise_value: 0,
  refund_amount: 0,
  gross_revenue_platform_subsidy: 0,
  products_sold: 0,
  buyers: 0,
  page_views: 0,
  store_visits: 0,
  sku_orders: 0,
  orders: 0,
  conversion_rate: 0,
  product_impressions: 0,
  unique_product_impressions: 0,
  product_clicks: 0,
  unique_clicks: 0,
  aov: 0,
};

type FormErrors = Partial<Record<keyof TikTokTrafficFormData, string>>;

function validateForm(d: TikTokTrafficFormData): FormErrors {
  const errors: FormErrors = {};
  if (!d.date) errors.date = "Tanggal wajib diisi.";
  if (d.gross_merchandise_value < 0) errors.gross_merchandise_value = "Tidak boleh negatif.";
  if (d.products_sold < 0) errors.products_sold = "Tidak boleh negatif.";
  return errors;
}

/* ─── Main component ─── */

export function TiktokTrafficWorkspace() {
  const [items, dispatch] = useReducer(trafficReducer, []);
  const [form, setForm] = useState<TikTokTrafficFormData>({ ...emptyForm });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchTiktokTraffic()
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

  function handleChange<K extends keyof TikTokTrafficFormData>(key: K, value: TikTokTrafficFormData[K]) {
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
        const updated = await updateTiktokTraffic(editingId, form);
        dispatch({ type: "update", payload: updated });
      } else {
        const created = await createTiktokTraffic(form);
        dispatch({ type: "add", payload: created });
      }
      handleCloseModal();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan data.");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(d: TikTokTraffic) {
    setForm({
      date: d.date.slice(0, 10),
      gross_merchandise_value: Number(d.gross_merchandise_value),
      refund_amount: Number(d.refund_amount),
      gross_revenue_platform_subsidy: Number(d.gross_revenue_platform_subsidy),
      products_sold: Number(d.products_sold),
      buyers: Number(d.buyers),
      page_views: Number(d.page_views),
      store_visits: Number(d.store_visits),
      sku_orders: Number(d.sku_orders),
      orders: Number(d.orders),
      conversion_rate: Number(d.conversion_rate),
      product_impressions: Number(d.product_impressions),
      unique_product_impressions: Number(d.unique_product_impressions),
      product_clicks: Number(d.product_clicks),
      unique_clicks: Number(d.unique_clicks),
      aov: Number(d.aov),
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
      setSelectedIds(new Set(visible.map((d) => d.id)));
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
      await deleteTiktokTraffic(id)
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
        title="Filter Traffic TikTok"
        description="Filter data traffic TikTok berdasarkan rentang tanggal."
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
        title={editingId ? "Edit Traffic TikTok" : "Input Traffic TikTok"}
        description={
          editingId
            ? "Ubah data traffic toko TikTok."
            : "Isi data traffic toko TikTok untuk dicatat."
        }
        submitLabel={editingId ? "Simpan Perubahan" : "Simpan"}
        onSubmit={handleSubmit}
        isSubmitting={saving}
      >
        <TiktokTrafficForm form={form} errors={errors} onChange={handleChange} />
      </ModalFormShell>

      {/* ── Table ── */}
      <WorkspacePanel
        title="Tabel Traffic TikTok"
        description="Data traffic toko TikTok harian."
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
                <TableHead className="text-right">GMV</TableHead>
                <TableHead className="text-right">Pesanan</TableHead>
                <TableHead className="text-right">Pembeli</TableHead>
                <TableHead className="text-right">Produk terjual</TableHead>
                <TableHead className="text-right">Produk yang dikembalikan dananya</TableHead>
                <TableHead className="text-right">Pesanan SKU</TableHead>
                <TableHead className="text-right">Pendapatan bruto</TableHead>
                <TableHead className="text-right">Tayangan halaman</TableHead>
                <TableHead className="text-right">Pengunjung</TableHead>
                <TableHead className="text-right">Persentase konversi</TableHead>
                <TableHead className="text-right">Impresi produk</TableHead>
                <TableHead className="text-right">Impresi unik</TableHead>
                <TableHead className="text-right">Klik produk</TableHead>
                <TableHead className="text-right">Klik unik</TableHead>
                <TableHead className="text-right">AOV</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={17} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={17} className="py-8 text-center text-muted-foreground">
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
                    <TableCell className="text-right">{formatIDR(Number(d.gross_merchandise_value))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.orders))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.buyers))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.products_sold))}</TableCell>
                    <TableCell className="text-right">{formatIDR(Number(d.refund_amount))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.sku_orders))}</TableCell>
                    <TableCell className="text-right">{formatIDR(Number(d.gross_revenue_platform_subsidy))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.page_views))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.store_visits))}</TableCell>
                    <TableCell className="text-right font-medium">{pct(Number(d.conversion_rate))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.product_impressions))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.unique_product_impressions))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.product_clicks))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.unique_clicks))}</TableCell>
                    <TableCell className="text-right">
                      {Number(d.orders) > 0 ? formatIDR(Number(d.gross_merchandise_value) / Number(d.orders)) : "—"}
                    </TableCell>
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
              <label className="text-xs text-slate-500" htmlFor="ttraffic_page_size">Baris</label>
              <select
                id="ttraffic_page_size"
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

function TiktokTrafficForm({
  form,
  errors,
  onChange,
}: {
  form: TikTokTrafficFormData;
  errors: FormErrors;
  onChange: <K extends keyof TikTokTrafficFormData>(key: K, value: TikTokTrafficFormData[K]) => void;
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
        <FormField label="GMV" htmlFor="gross_merchandise_value" error={errors.gross_merchandise_value}>
          <Input
            id="gross_merchandise_value"
            type="number"
            min={0}
            value={form.gross_merchandise_value}
            onChange={(e) => onChange("gross_merchandise_value", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Pesanan" htmlFor="orders">
          <Input
            id="orders"
            type="number"
            min={0}
            value={form.orders}
            onChange={(e) => onChange("orders", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Pembeli" htmlFor="buyers">
          <Input
            id="buyers"
            type="number"
            min={0}
            value={form.buyers}
            onChange={(e) => onChange("buyers", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Produk terjual" htmlFor="products_sold" error={errors.products_sold}>
          <Input
            id="products_sold"
            type="number"
            min={0}
            value={form.products_sold}
            onChange={(e) => onChange("products_sold", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Produk yang dikembalikan dananya" htmlFor="refund_amount">
          <Input
            id="refund_amount"
            type="number"
            min={0}
            value={form.refund_amount}
            onChange={(e) => onChange("refund_amount", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Pesanan SKU" htmlFor="sku_orders">
          <Input
            id="sku_orders"
            type="number"
            min={0}
            value={form.sku_orders}
            onChange={(e) => onChange("sku_orders", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Pendapatan bruto" htmlFor="gross_revenue_platform_subsidy">
          <Input
            id="gross_revenue_platform_subsidy"
            type="number"
            min={0}
            value={form.gross_revenue_platform_subsidy}
            onChange={(e) => onChange("gross_revenue_platform_subsidy", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Tayangan halaman" htmlFor="page_views">
          <Input
            id="page_views"
            type="number"
            min={0}
            value={form.page_views}
            onChange={(e) => onChange("page_views", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Pengunjung" htmlFor="store_visits">
          <Input
            id="store_visits"
            type="number"
            min={0}
            value={form.store_visits}
            onChange={(e) => onChange("store_visits", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Persentase konversi" htmlFor="conversion_rate">
          <Input
            id="conversion_rate"
            type="number"
            step="0.01"
            min={0}
            placeholder="cth: 3.84"
            value={form.conversion_rate}
            onChange={(e) => onChange("conversion_rate", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Impresi produk" htmlFor="product_impressions">
          <Input
            id="product_impressions"
            type="number"
            min={0}
            value={form.product_impressions}
            onChange={(e) => onChange("product_impressions", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Impresi produk unik" htmlFor="unique_product_impressions">
          <Input
            id="unique_product_impressions"
            type="number"
            min={0}
            value={form.unique_product_impressions}
            onChange={(e) => onChange("unique_product_impressions", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Klik produk" htmlFor="product_clicks">
          <Input
            id="product_clicks"
            type="number"
            min={0}
            value={form.product_clicks}
            onChange={(e) => onChange("product_clicks", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Klik unik" htmlFor="unique_clicks">
          <Input
            id="unique_clicks"
            type="number"
            min={0}
            value={form.unique_clicks}
            onChange={(e) => onChange("unique_clicks", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="AOV" htmlFor="aov">
          <Input
            id="aov"
            type="number"
            min={0}
            value={form.aov}
            onChange={(e) => onChange("aov", e.target.valueAsNumber || 0)}
          />
        </FormField>
      </div>
    </div>
  );
}