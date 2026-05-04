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

  const visible = items.filter((d) => {
    if (filterDateFrom && d.date < filterDateFrom) return false;
    if (filterDateTo && d.date > filterDateTo) return false;
    return true;
  });

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

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    try {
      await deleteTiktokLivestream(id);
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Sesi</TableHead>
                <TableHead className="text-right">Impressions</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Product Clicks</TableHead>
                <TableHead className="text-right">Pesanan</TableHead>
                <TableHead className="text-right">Penjualan</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    Belum ada data. Klik &ldquo;Input Baru&rdquo; untuk menambahkan.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="whitespace-nowrap">{d.date}</TableCell>
                    <TableCell>{d.sesi}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.impressions))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.views))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.product_clicks))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.pesanan))}</TableCell>
                    <TableCell className="text-right">{formatIDR(Number(d.penjualan))}</TableCell>
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