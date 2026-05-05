"use client";

import { useState, useReducer, useEffect } from "react";
import { toast } from "sonner";
import type { TikTokLivestream, TikTokLivestreamFormData } from "@/types/marketing";
import {
  fetchTiktokLivestream,
  createTiktokLivestream,
  updateTiktokLivestream,
  deleteTiktokLivestream,
} from "@/features/marketing/tiktok-livestream-service";
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
  return "Rp" + new Intl.NumberFormat("id-ID").format(val);
}

/* ─── Reducer ─── */

type Action =
  | { type: "set"; payload: TikTokLivestream[] }
  | { type: "add"; payload: TikTokLivestream }
  | { type: "update"; payload: TikTokLivestream }
  | { type: "remove"; id: string };

function livestreamReducer(state: TikTokLivestream[], action: Action): TikTokLivestream[] {
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

const emptyForm: TikTokLivestreamFormData = {
  date: new Date().toISOString().slice(0, 10),
  sesi: "1",
  impressions: 0,
  views: 0,
  product_clicks: 0,
  pesanan: 0,
  penjualan: 0,
};

type FormErrors = Partial<Record<keyof TikTokLivestreamFormData, string>>;

function validateForm(d: TikTokLivestreamFormData): FormErrors {
  const errors: FormErrors = {};
  if (!d.date) errors.date = "Tanggal wajib diisi.";
  if (!d.sesi.trim()) errors.sesi = "Sesi wajib diisi.";
  if (d.impressions < 0) errors.impressions = "Tidak boleh negatif.";
  if (d.views < 0) errors.views = "Tidak boleh negatif.";
  if (d.pesanan < 0) errors.pesanan = "Tidak boleh negatif.";
  if (d.penjualan < 0) errors.penjualan = "Tidak boleh negatif.";
  return errors;
}

/* ─── Main component ─── */

export function TiktokLivestreamWorkspace() {
  const [items, dispatch] = useReducer(livestreamReducer, []);
  const [form, setForm] = useState<TikTokLivestreamFormData>({ ...emptyForm });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchTiktokLivestream()
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

  function handleChange<K extends keyof TikTokLivestreamFormData>(key: K, value: TikTokLivestreamFormData[K]) {
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
        const updated = await updateTiktokLivestream(editingId, form);
        dispatch({ type: "update", payload: updated });
      } else {
        const created = await createTiktokLivestream(form);
        dispatch({ type: "add", payload: created });
      }
      handleCloseModal();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan data.");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(d: TikTokLivestream) {
    setForm({
      date: d.date.slice(0, 10),
      sesi: d.sesi,
      impressions: Number(d.impressions),
      views: Number(d.views),
      product_clicks: Number(d.product_clicks),
      pesanan: Number(d.pesanan),
      penjualan: Number(d.penjualan),
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
      await deleteTiktokLivestream(id)
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
        title="Filter Livestream TikTok"
        description="Filter data livestream TikTok berdasarkan rentang tanggal."
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
        title={editingId ? "Edit Livestream TikTok" : "Input Livestream TikTok"}
        description={
          editingId
            ? "Ubah data sesi livestream TikTok."
            : "Isi data sesi livestream TikTok untuk dicatat."
        }
        submitLabel={editingId ? "Simpan Perubahan" : "Simpan"}
        onSubmit={handleSubmit}
        isSubmitting={saving}
      >
        <TiktokLivestreamForm form={form} errors={errors} onChange={handleChange} />
      </ModalFormShell>

      {/* ── Table ── */}
      <WorkspacePanel
        title="Tabel Livestream TikTok"
        description="Data sesi livestream TikTok."
      >
        {someSelected && (
          <div className="flex items-center gap-2 mb-3">
            <Button variant="outline" size="sm" onClick={handleToolbarEdit}>
              <Pencil className="mr-1 size-4" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={handleToolbarDelete}>
              <Trash2 className="mr-1 size-4" />
              Hapus ({selectedIds.size})
            </Button>
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
                <TableHead>Sesi</TableHead>
                <TableHead className="text-right">Impressions</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Product Clicks</TableHead>
                <TableHead className="text-right">Pesanan</TableHead>
                <TableHead className="text-right">Penjualan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
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
                    <TableCell>{d.sesi}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.impressions))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.views))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.product_clicks))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.pesanan))}</TableCell>
                    <TableCell className="text-right">{formatIDR(Number(d.penjualan))}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        {visible.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-3 py-2">
            <p className="text-xs text-slate-500">
              Menampilkan {paginated.length > 0 ? `${pageIndex * pageSize + 1}-${pageIndex * pageSize + paginated.length}` : 0} dari {visible.length}
            </p>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500" htmlFor="tlive_page_size">Baris</label>
              <select
                id="tlive_page_size"
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
        </div>
      </WorkspacePanel>
    </div>
  );
}

/* ─── Sub-form ─── */

function TiktokLivestreamForm({
  form,
  errors,
  onChange,
}: {
  form: TikTokLivestreamFormData;
  errors: FormErrors;
  onChange: <K extends keyof TikTokLivestreamFormData>(key: K, value: TikTokLivestreamFormData[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FormField label="Tanggal" htmlFor="date" error={errors.date}>
          <Input
            id="date"
            type="date"
            value={form.date}
            onChange={(e) => onChange("date", e.target.value)}
          />
        </FormField>
        <FormField label="Sesi" htmlFor="sesi" error={errors.sesi}>
          <Input
            id="sesi"
            placeholder="cth: 1, sesi-1"
            value={form.sesi}
            onChange={(e) => onChange("sesi", e.target.value)}
          />
        </FormField>
        <FormField label="Impressions" htmlFor="impressions" error={errors.impressions}>
          <Input
            id="impressions"
            type="number"
            min={0}
            value={form.impressions}
            onChange={(e) => onChange("impressions", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Views" htmlFor="views" error={errors.views}>
          <Input
            id="views"
            type="number"
            min={0}
            value={form.views}
            onChange={(e) => onChange("views", e.target.valueAsNumber || 0)}
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
        <FormField label="Pesanan" htmlFor="pesanan" error={errors.pesanan}>
          <Input
            id="pesanan"
            type="number"
            min={0}
            value={form.pesanan}
            onChange={(e) => onChange("pesanan", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Penjualan" htmlFor="penjualan" error={errors.penjualan}>
          <Input
            id="penjualan"
            type="number"
            min={0}
            value={form.penjualan}
            onChange={(e) => onChange("penjualan", e.target.valueAsNumber || 0)}
          />
        </FormField>
      </div>
    </div>
  );
}