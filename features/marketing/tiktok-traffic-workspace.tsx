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

  const visible = items.filter((d) => {
    if (filterDateFrom && d.date < filterDateFrom) return false;
    if (filterDateTo && d.date > filterDateTo) return false;
    return true;
  });

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
    });
    setEditingId(d.id);
    setErrors({});
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    try {
      await deleteTiktokTraffic(id);
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">GMV</TableHead>
                <TableHead className="text-right">Refund</TableHead>
                <TableHead className="text-right">Platform Subsidy</TableHead>
                <TableHead className="text-right">Products Sold</TableHead>
                <TableHead className="text-right">Buyers</TableHead>
                <TableHead className="text-right">Page Views</TableHead>
                <TableHead className="text-right">Store Visits</TableHead>
                <TableHead className="text-right">SKU Orders</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Conv. Rate</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="py-8 text-center text-muted-foreground">
                    Belum ada data. Klik &ldquo;Input Baru&rdquo; untuk menambahkan.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="whitespace-nowrap">{d.date}</TableCell>
                    <TableCell className="text-right">{formatIDR(Number(d.gross_merchandise_value))}</TableCell>
                    <TableCell className="text-right">{formatIDR(Number(d.refund_amount))}</TableCell>
                    <TableCell className="text-right">{formatIDR(Number(d.gross_revenue_platform_subsidy))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.products_sold))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.buyers))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.page_views))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.store_visits))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.sku_orders))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.orders))}</TableCell>
                    <TableCell className="text-right font-medium">{pct(Number(d.conversion_rate))}</TableCell>
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
        <FormField label="Refund Amount" htmlFor="refund_amount">
          <Input
            id="refund_amount"
            type="number"
            min={0}
            value={form.refund_amount}
            onChange={(e) => onChange("refund_amount", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Platform Subsidy" htmlFor="gross_revenue_platform_subsidy">
          <Input
            id="gross_revenue_platform_subsidy"
            type="number"
            min={0}
            value={form.gross_revenue_platform_subsidy}
            onChange={(e) => onChange("gross_revenue_platform_subsidy", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Products Sold" htmlFor="products_sold" error={errors.products_sold}>
          <Input
            id="products_sold"
            type="number"
            min={0}
            value={form.products_sold}
            onChange={(e) => onChange("products_sold", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Buyers" htmlFor="buyers">
          <Input
            id="buyers"
            type="number"
            min={0}
            value={form.buyers}
            onChange={(e) => onChange("buyers", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Page Views" htmlFor="page_views">
          <Input
            id="page_views"
            type="number"
            min={0}
            value={form.page_views}
            onChange={(e) => onChange("page_views", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Store Visits" htmlFor="store_visits">
          <Input
            id="store_visits"
            type="number"
            min={0}
            value={form.store_visits}
            onChange={(e) => onChange("store_visits", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="SKU Orders" htmlFor="sku_orders">
          <Input
            id="sku_orders"
            type="number"
            min={0}
            value={form.sku_orders}
            onChange={(e) => onChange("sku_orders", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Orders" htmlFor="orders">
          <Input
            id="orders"
            type="number"
            min={0}
            value={form.orders}
            onChange={(e) => onChange("orders", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Conv. Rate (%)" htmlFor="conversion_rate">
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
      </div>
    </div>
  );
}