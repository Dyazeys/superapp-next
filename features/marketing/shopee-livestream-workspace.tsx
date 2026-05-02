"use client";

import { useState, useReducer, useEffect } from "react";
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

  const visible = items.filter((d) => {
    if (filterDateFrom && d.date < filterDateFrom) return false;
    if (filterDateTo && d.date > filterDateTo) return false;
    return true;
  });

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
    } catch {
      // error handled by api-error
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(d: ShopeeLivestream) {
    setForm({
      date: d.date,
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

  async function handleDelete(id: string) {
    try {
      await deleteShopeeLivestream(id);
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Sesi</TableHead>
                <TableHead className="text-right">Pengunjung</TableHead>
                <TableHead className="text-right">Penonton Terbanyak</TableHead>
                <TableHead className="text-right">Rata-rata Durasi</TableHead>
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
                    <TableCell className="text-right">{formatNum(Number(d.pengunjung))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.penonton_terbanyak))}</TableCell>
                    <TableCell className="text-right">{d.rata_durasi_menonton}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.pesanan))}</TableCell>
                    <TableCell className="text-right">{formatNum(Number(d.penjualan))}</TableCell>
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