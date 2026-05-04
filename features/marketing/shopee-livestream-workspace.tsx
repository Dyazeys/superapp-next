"use client";

import { useState, useReducer, useEffect } from "react";
import { toast } from "sonner";
import type { ShopeeLivestream, ShopeeLivestreamFormData } from "@/types/marketing";
import {
  fetchShopeeLivestream,
  createShopeeLivestream,
  updateShopeeLivestream,
  deleteShopeeLivestream,
} from "@/features/marketing/shopee-livestream-service";
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

/* ─── Reducer ─── */

type Action =
  | { type: "set"; payload: ShopeeLivestream[] }
  | { type: "add"; payload: ShopeeLivestream }
  | { type: "update"; payload: ShopeeLivestream }
  | { type: "remove"; id: string };

function livestreamReducer(state: ShopeeLivestream[], action: Action): ShopeeLivestream[] {
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

const emptyForm: ShopeeLivestreamFormData = {
  date: new Date().toISOString().slice(0, 10),
  sesi: "1",
  pengunjung: 0,
  penonton_terbanyak: 0,
  rata_durasi_menonton: "00:00:00",
  pesanan: 0,
  penjualan: 0,
};

type FormErrors = Partial<Record<keyof ShopeeLivestreamFormData, string>>;

function validateForm(d: ShopeeLivestreamFormData): FormErrors {
  const errors: FormErrors = {};
  if (!d.date) errors.date = "Tanggal wajib diisi.";
  if (!d.sesi.trim()) errors.sesi = "Sesi wajib diisi.";
  if (d.pengunjung < 0) errors.pengunjung = "Tidak boleh negatif.";
  if (d.penonton_terbanyak < 0) errors.penonton_terbanyak = "Tidak boleh negatif.";
  if (d.pesanan < 0) errors.pesanan = "Tidak boleh negatif.";
  if (d.penjualan < 0) errors.penjualan = "Tidak boleh negatif.";
  return errors;
}

/* ─── Main component ─── */

export function ShopeeLivestreamWorkspace() {
  const [items, dispatch] = useReducer(livestreamReducer, []);
  const [form, setForm] = useState<ShopeeLivestreamFormData>({ ...emptyForm });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchShopeeLivestream()
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

  function handleChange<K extends keyof ShopeeLivestreamFormData>(key: K, value: ShopeeLivestreamFormData[K]) {
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
        const updated = await updateShopeeLivestream(editingId, form);
        dispatch({ type: "update", payload: updated });
      } else {
        const created = await createShopeeLivestream(form);
        dispatch({ type: "add", payload: created });
      }
      handleCloseModal();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan data.");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(d: ShopeeLivestream) {
    setForm({
      date: d.date.slice(0, 10),
      sesi: d.sesi,
      pengunjung: Number(d.pengunjung),
      penonton_terbanyak: Number(d.penonton_terbanyak),
      rata_durasi_menonton: d.rata_durasi_menonton,
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
      await deleteShopeeLivestream(id)
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
        title="Filter Livestream Shopee"
        description="Filter data livestream Shopee berdasarkan rentang tanggal."
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
        title={editingId ? "Edit Livestream Shopee" : "Input Livestream Shopee"}
        description={
          editingId
            ? "Ubah data sesi livestream Shopee."
            : "Isi data sesi livestream Shopee untuk dicatat."
        }
        submitLabel={editingId ? "Simpan Perubahan" : "Simpan"}
        onSubmit={handleSubmit}
        isSubmitting={saving}
      >
        <ShopeeLivestreamForm form={form} errors={errors} onChange={handleChange} />
      </ModalFormShell>

      {/* ── Table ── */}
      <WorkspacePanel
        title="Tabel Livestream Shopee"
        description="Data sesi livestream Shopee."
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
                <TableHead className="text-right">Pengunjung</TableHead>
                <TableHead className="text-right">Penonton Terbanyak</TableHead>
                <TableHead className="text-right">Rata-rata Durasi</TableHead>
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
                    <TableCell className="text-right">{formatNum(Number(d.pengunjung))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.penonton_terbanyak))}</TableCell>
                    <TableCell className="text-right">{d.rata_durasi_menonton}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.pesanan))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.penjualan))}</TableCell>
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
              <label className="text-xs text-slate-500" htmlFor="slive_page_size">Baris</label>
              <select
                id="slive_page_size"
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

function ShopeeLivestreamForm({
  form,
  errors,
  onChange,
}: {
  form: ShopeeLivestreamFormData;
  errors: FormErrors;
  onChange: <K extends keyof ShopeeLivestreamFormData>(key: K, value: ShopeeLivestreamFormData[K]) => void;
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
        <FormField label="Pengunjung" htmlFor="pengunjung" error={errors.pengunjung}>
          <Input
            id="pengunjung"
            type="number"
            min={0}
            value={form.pengunjung}
            onChange={(e) => onChange("pengunjung", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Penonton Terbanyak" htmlFor="penonton_terbanyak" error={errors.penonton_terbanyak}>
          <Input
            id="penonton_terbanyak"
            type="number"
            min={0}
            value={form.penonton_terbanyak}
            onChange={(e) => onChange("penonton_terbanyak", e.target.valueAsNumber || 0)}
          />
        </FormField>
        <FormField label="Rata-rata Durasi" htmlFor="rata_durasi_menonton">
          <Input
            id="rata_durasi_menonton"
            placeholder="HH:MM:SS"
            value={form.rata_durasi_menonton}
            onChange={(e) => onChange("rata_durasi_menonton", e.target.value)}
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