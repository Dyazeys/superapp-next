"use client";

import { useState, useReducer, useEffect } from "react";
import type { MpAdsDraft } from "@/types/marketing";
import { fetchMpAds } from "@/features/marketing/mp-ads-service";
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
import { FieldError } from "@/components/forms/field-error";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { Plus, Trash2, Loader2 } from "lucide-react";

/* ─── Helpers ─── */

function pct(decimal: number): string {
  return (decimal * 100).toFixed(2) + "%";
}

function ratio(val: number): string {
  return val.toFixed(2) + "x";
}

function formatIDR(val: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

function formatNum(val: number): string {
  return new Intl.NumberFormat("id-ID").format(val);
}

/* ─── Reducer ─── */

type Action =
  | { type: "set"; payload: MpAdsDraft[] }
  | { type: "add"; payload: MpAdsDraft }
  | { type: "remove"; id: string };

function adsReducer(state: MpAdsDraft[], action: Action): MpAdsDraft[] {
  switch (action.type) {
    case "set":
      return action.payload;
    case "add":
      return [...state, action.payload];
    case "remove":
      return state.filter((d) => d.id !== action.id);
    default:
      return state;
  }
}

/* ─── Empty form state ─── */

const emptyForm: Omit<MpAdsDraft, "id"> = {
  date: new Date().toISOString().slice(0, 10),
  produk: "",
  impression: 0,
  click: 0,
  ctr: 0,
  qty_buyer: 0,
  qty_produk: 0,
  omset: 0,
  spent: 0,
  roas: 0,
  cancel_qty: 0,
  cancel_omset: 0,
  roas_fix: 0,
  target_roas: 0,
};

type FormErrors = Partial<Record<keyof MpAdsDraft, string>>;

function validateForm(d: Omit<MpAdsDraft, "id">): FormErrors {
  const errors: FormErrors = {};
  if (!d.date) errors.date = "Tanggal wajib diisi.";
  if (!d.produk.trim()) errors.produk = "Nama produk wajib diisi.";
  if (d.impression < 0) errors.impression = "Tidak boleh negatif.";
  if (d.click < 0) errors.click = "Tidak boleh negatif.";
  if (d.qty_buyer < 0) errors.qty_buyer = "Tidak boleh negatif.";
  if (d.qty_produk < 0) errors.qty_produk = "Tidak boleh negatif.";
  if (d.omset < 0) errors.omset = "Tidak boleh negatif.";
  if (d.spent < 0) errors.spent = "Tidak boleh negatif.";
  if (d.cancel_qty < 0) errors.cancel_qty = "Tidak boleh negatif.";
  if (d.cancel_omset < 0) errors.cancel_omset = "Tidak boleh negatif.";
  return errors;
}

/* ─── Main component ─── */

export function MpAdsWorkspace() {
  const [ads, dispatch] = useReducer(adsReducer, []);
  const [form, setForm] = useState<Omit<MpAdsDraft, "id">>({ ...emptyForm });
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchMpAds()
      .then((data) => dispatch({ type: "set", payload: data }))
      .catch(() => {});
  }, []);

  const [errors, setErrors] = useState<FormErrors>({});
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const visible = ads.filter((d) => {
    if (filterDateFrom && d.date < filterDateFrom) return false;
    if (filterDateTo && d.date > filterDateTo) return false;
    return true;
  });

  function handleChange<K extends keyof Omit<MpAdsDraft, "id">>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleSubmit() {
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    dispatch({
      type: "add",
      payload: { id: crypto.randomUUID(), ...form },
    });
    handleCloseModal();
  }

  function handleCloseModal() {
    setForm({ ...emptyForm });
    setErrors({});
    setModalOpen(false);
  }

  function handleOpenModal() {
    setForm({ ...emptyForm });
    setErrors({});
    setModalOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* ── Filter ── */}
      <WorkspacePanel
        title="Filter Iklan MP"
        description="Filter data iklan marketplace berdasarkan rentang tanggal."
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
          <Button
            size="sm"
            className="ml-auto"
            onClick={handleOpenModal}
          >
            <Plus className="mr-1 size-4" />
            Input Baru
          </Button>
        </div>
      </WorkspacePanel>

      {/* ── Input Modal ── */}
      <ModalFormShell
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseModal();
        }}
        title="Input Iklan MP"
        description="Isi data iklan marketplace untuk dicatat."
        submitLabel="Simpan"
        onSubmit={handleSubmit}
      >
        <MpAdsForm
          form={form}
          errors={errors}
          onChange={handleChange}
        />
      </ModalFormShell>

      {/* ── Table ── */}
      <WorkspacePanel
        title="Tabel Iklan MP"
        description="Data iklan marketplace harian."
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead className="text-right">Impression</TableHead>
                <TableHead className="text-right">Click</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">Qty Buyer</TableHead>
                <TableHead className="text-right">Qty Produk</TableHead>
                <TableHead className="text-right">Omset</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <TableHead className="text-right">ROAS</TableHead>
                <TableHead className="text-right">Cancel Qty</TableHead>
                <TableHead className="text-right">Cancel Omset</TableHead>
                <TableHead className="text-right">ROAS Fix</TableHead>
                <TableHead className="text-right">Target ROAS</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={15}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Belum ada data. Klik &ldquo;Input Baru&rdquo; untuk
                    menambahkan.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="whitespace-nowrap">
                      {d.date}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {d.produk}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNum(d.impression)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNum(d.click)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {pct(d.ctr)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNum(d.qty_buyer)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNum(d.qty_produk)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatIDR(d.omset)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatIDR(d.spent)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {ratio(d.roas)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNum(d.cancel_qty)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatIDR(d.cancel_omset)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {ratio(d.roas_fix)}
                    </TableCell>
                    <TableCell className="text-right">
                      {ratio(d.target_roas)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          dispatch({ type: "remove", id: d.id })
                        }
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
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

/* ─── Product options fetcher ─── */

function useProductOptions(): {
  options: SearchableOption[];
  loading: boolean;
  error: string | null;
} {
  const [options, setOptions] = useState<SearchableOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/product/products")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat produk.");
        return res.json();
      })
      .then((data: Array<{ product_name: string; sku: string }>) => {
        if (cancelled) return;
        // Tampilkan hanya nama produk unik (label-only), walau di master ada banyak SKU.
        const seen = new Set<string>();
        const mapped: SearchableOption[] = [];
        for (const p of data) {
          const productName = p.product_name?.trim() ?? "";
          if (!productName) continue;
          const normalized = productName.toLowerCase();
          if (seen.has(normalized)) continue;
          seen.add(normalized);
          mapped.push({
            label: productName,
            value: productName,
          });
        }
        setOptions(mapped);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { options, loading, error };
}

/* ─── Sub-form component ─── */

function MpAdsForm({
  form,
  errors,
  onChange,
}: {
  form: Omit<MpAdsDraft, "id">;
  errors: FormErrors;
  onChange: <K extends keyof Omit<MpAdsDraft, "id">>(
    key: K,
    value: (typeof form)[K]
  ) => void;
}) {
  const { options, loading, error } = useProductOptions();
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
        <FormField
          label="Nama Produk"
          htmlFor="produk"
          error={errors.produk}
        >
          {loading ? (
            <div className="flex h-9 items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Memuat produk...
            </div>
          ) : error ? (
            <div className="flex h-9 items-center text-sm text-destructive">
              {error}
            </div>
          ) : (
            <SearchableSelect
              id="produk"
              options={options}
              value={form.produk}
              onValueChange={(val) => onChange("produk", val)}
              placeholder="Cari produk..."
              emptyText="Produk tidak ditemukan"
            />
          )}
        </FormField>
        <FormField
          label="Impression"
          htmlFor="impression"
          error={errors.impression}
        >
          <Input
            id="impression"
            type="number"
            min={0}
            value={form.impression}
            onChange={(e) => onChange("impression", Number(e.target.value))}
          />
        </FormField>
        <FormField label="Click" htmlFor="click" error={errors.click}>
          <Input
            id="click"
            type="number"
            min={0}
            value={form.click}
            onChange={(e) => onChange("click", Number(e.target.value))}
          />
        </FormField>
        <FormField label="CTR (%)" htmlFor="ctr">
          <Input
            id="ctr"
            type="number"
            step="0.0001"
            placeholder="0.0304 = 3.04%"
            value={form.ctr}
            onChange={(e) => onChange("ctr", Number(e.target.value))}
          />
        </FormField>
        <FormField
          label="Qty Buyer"
          htmlFor="qty_buyer"
          error={errors.qty_buyer}
        >
          <Input
            id="qty_buyer"
            type="number"
            min={0}
            value={form.qty_buyer}
            onChange={(e) => onChange("qty_buyer", Number(e.target.value))}
          />
        </FormField>
        <FormField
          label="Qty Produk"
          htmlFor="qty_produk"
          error={errors.qty_produk}
        >
          <Input
            id="qty_produk"
            type="number"
            min={0}
            value={form.qty_produk}
            onChange={(e) => onChange("qty_produk", Number(e.target.value))}
          />
        </FormField>
        <FormField label="Omset (IDR)" htmlFor="omset" error={errors.omset}>
          <Input
            id="omset"
            type="number"
            min={0}
            value={form.omset}
            onChange={(e) => onChange("omset", Number(e.target.value))}
          />
        </FormField>
        <FormField label="Spent (IDR)" htmlFor="spent" error={errors.spent}>
          <Input
            id="spent"
            type="number"
            min={0}
            value={form.spent}
            onChange={(e) => onChange("spent", Number(e.target.value))}
          />
        </FormField>
        <FormField label="ROAS" htmlFor="roas">
          <Input
            id="roas"
            type="number"
            step="0.01"
            placeholder="cth: 7.29"
            value={form.roas}
            onChange={(e) => onChange("roas", Number(e.target.value))}
          />
        </FormField>
        <FormField
          label="Cancel Qty"
          htmlFor="cancel_qty"
          error={errors.cancel_qty}
        >
          <Input
            id="cancel_qty"
            type="number"
            min={0}
            value={form.cancel_qty}
            onChange={(e) => onChange("cancel_qty", Number(e.target.value))}
          />
        </FormField>
        <FormField
          label="Cancel Omset (IDR)"
          htmlFor="cancel_omset"
          error={errors.cancel_omset}
        >
          <Input
            id="cancel_omset"
            type="number"
            min={0}
            value={form.cancel_omset}
            onChange={(e) => onChange("cancel_omset", Number(e.target.value))}
          />
        </FormField>
        <FormField label="ROAS Fix" htmlFor="roas_fix">
          <Input
            id="roas_fix"
            type="number"
            step="0.01"
            placeholder="cth: 6.82"
            value={form.roas_fix}
            onChange={(e) => onChange("roas_fix", Number(e.target.value))}
          />
        </FormField>
        <FormField label="Target ROAS" htmlFor="target_roas">
          <Input
            id="target_roas"
            type="number"
            step="0.01"
            placeholder="cth: 5.0"
            value={form.target_roas}
            onChange={(e) => onChange("target_roas", Number(e.target.value))}
          />
        </FormField>
      </div>
      <FieldError
        message={
          errors.impression ||
          errors.click ||
          errors.qty_buyer ||
          errors.qty_produk ||
          errors.omset ||
          errors.spent ||
          errors.cancel_qty ||
          errors.cancel_omset
            ? "Periksa kembali nilai numerik."
            : undefined
        }
      />
    </div>
  );
}
