"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, RefreshCw, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormField } from "@/components/forms/form-field";
import { FieldError } from "@/components/forms/field-error";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import {
  AKUN_OPTIONS,
  PLATFORM_OPTIONS,
  CONTENT_TYPE_OPTIONS_BY_PLATFORM,
  ACTIVITY_TYPE_OPTIONS,
  STATUS_OPTIONS,
  type DailyUpload,
} from "@/types/content";
import { useContentDraft } from "./use-content-draft";

const emptyForm: Omit<DailyUpload, "id" | "created_at" | "updated_at"> = {
  tanggal_aktivitas: new Date().toISOString().slice(0, 10),
  akun: "Official",
  platform: "TikTok",
  jenis_konten: "Video TikTok",
  tipe_aktivitas: "Upload",
  produk: "",
  link_konten: "",
  pic: "",
  status: "Draft",
};

type FormKeys = keyof typeof emptyForm;
type FormErrors = Partial<Record<FormKeys, string>>;
type PicOption = { value: string; label: string };

function validateForm(
  d: typeof emptyForm
): FormErrors {
  const errors: FormErrors = {};
  if (!d.tanggal_aktivitas) errors.tanggal_aktivitas = "Tanggal wajib diisi.";
  if (!d.akun) errors.akun = "Akun wajib dipilih.";
  if (!d.platform) errors.platform = "Platform wajib dipilih.";
  if (!d.jenis_konten) errors.jenis_konten = "Jenis konten wajib dipilih.";
  if (!d.tipe_aktivitas) errors.tipe_aktivitas = "Tipe aktivitas wajib dipilih.";
  if (!d.pic) errors.pic = "PIC wajib dipilih.";
  return errors;
}

export function ContentDailyWorkspace() {
  const { items, loading, error, upsert, remove, refresh } = useContentDraft();
  const [form, setForm] = useState<typeof emptyForm>({ ...emptyForm });
  const [errors, setErrors] = useState<FormErrors>({});
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [picOptions, setPicOptions] = useState<PicOption[]>([]);
  const [picLoading, setPicLoading] = useState(true);
  const [productOptions, setProductOptions] = useState<PicOption[]>([]);
  const [productLoading, setProductLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    let cancelled = false;

    async function loadPicOptions() {
      setPicLoading(true);

      try {
        const response = await fetch("/api/content/daily-upload/pic-options");
        if (!response.ok) {
          throw new Error("Gagal memuat opsi PIC");
        }

        const payload = (await response.json()) as PicOption[];
        if (!cancelled) {
          setPicOptions(payload);
        }
      } catch {
        if (!cancelled) {
          setPicOptions([]);
        }
      } finally {
        if (!cancelled) {
          setPicLoading(false);
        }
      }
    }

    void loadPicOptions();
    void loadProductOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadProductOptions() {
    setProductLoading(true);
    try {
      const response = await fetch("/api/content/daily-upload/product-options");
      if (!response.ok) throw new Error("Gagal memuat opsi produk");
      const payload = (await response.json()) as PicOption[];
      setProductOptions(payload);
    } catch {
      setProductOptions([]);
    } finally {
      setProductLoading(false);
    }
  }

  const visible = items.filter((d) => {
    if (filterDateFrom && d.tanggal_aktivitas < filterDateFrom) return false;
    if (filterDateTo && d.tanggal_aktivitas > filterDateTo) return false;
    if (filterPlatform && d.platform !== filterPlatform) return false;
    return true;
  });
  const contentTypeOptions = CONTENT_TYPE_OPTIONS_BY_PLATFORM[form.platform];

  useEffect(() => {
    setPageIndex(0);
  }, [filterDateFrom, filterDateTo, filterPlatform]);

  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const paginated = visible.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  useEffect(() => {
    if (pageIndex >= pageCount) {
      setPageIndex(Math.max(0, pageCount - 1));
    }
  }, [pageIndex, pageCount]);

  function handleFormChange<K extends FormKeys>(
    key: K,
    value: string
  ) {
    setForm((prev) => {
      const next = { ...prev, [key]: value as (typeof prev)[K] };

      if (key === "platform") {
        const nextPlatform = value as DailyUpload["platform"];
        const nextJenisKontenOptions = CONTENT_TYPE_OPTIONS_BY_PLATFORM[nextPlatform];

        if (!nextJenisKontenOptions.includes(next.jenis_konten as never)) {
          next.jenis_konten = nextJenisKontenOptions[0];
        }
      }

      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit() {
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await upsert({ ...form, id: editingId });
      } else {
        await upsert(form);
      }
      setForm({ ...emptyForm });
      setErrors({});
      setEditingId(null);
      setOpen(false);
    } catch {
      // error surfaced by the hook
    } finally {
      setSubmitting(false);
    }
  }

  function openCreate() {
    setForm({ ...emptyForm });
    setEditingId(null);
    setErrors({});
    setOpen(true);
  }

  function handleEdit(item: DailyUpload) {
    setForm({
      tanggal_aktivitas: item.tanggal_aktivitas?.slice(0, 10) ?? "",
      akun: item.akun as (typeof emptyForm)["akun"],
      platform: item.platform as (typeof emptyForm)["platform"],
      jenis_konten: item.jenis_konten as (typeof emptyForm)["jenis_konten"],
      tipe_aktivitas: item.tipe_aktivitas as (typeof emptyForm)["tipe_aktivitas"],
      produk: item.produk ?? "",
      link_konten: item.link_konten ?? "",
      pic: item.pic,
      status: item.status as (typeof emptyForm)["status"],
    });
    setEditingId(item.id ?? null);
    setErrors({});
    setOpen(true);
  }

  function resetFilters() {
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterPlatform("");
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
    const first = visible.find((d) => selectedIds.has(d.id!));
    if (first) handleEdit(first);
  }

  async function handleToolbarDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Yakin ingin menghapus ${ids.length} data?`)) return;
    for (const id of ids) {
      await remove(id).catch(() => {});
    }
    setSelectedIds(new Set());
  }

  const isAllSelected = visible.length > 0 && selectedIds.size === visible.length;
  const someSelected = selectedIds.size > 0;

  return (
    <div className="space-y-6">
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); setErrors({}); } }}>
        {/* ── Filter bar ── */}
        <WorkspacePanel
        title="Filter Daily Upload"
        description="Filter laporan konten harian berdasarkan rentang tanggal dan platform."
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
          <FormField label="Platform" htmlFor="filter_platform">
            <select
              id="filter_platform"
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
            >
              <option value="">Semua Platform</option>
              {PLATFORM_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </FormField>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Reset Filter
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={refresh}
              title="Refresh data"
              disabled={loading}
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button size="sm" className="ml-2" onClick={openCreate}>
              <Plus className="mr-1 size-4" />
              Input Baru
            </Button>
          </div>
        </div>
      </WorkspacePanel>

        {/* ── Input form (dialog) ── */}
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Konten Harian" : "Input Konten Harian"}</DialogTitle>
            <DialogDescription>{editingId ? "Ubah data konten harian yang sudah ada." : "Isi data konten harian untuk dicatat."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Tanggal" htmlFor="draft_date" error={errors.tanggal_aktivitas}>
              <Input
                id="draft_date"
                type="date"
                value={form.tanggal_aktivitas}
                onChange={(e) => handleFormChange("tanggal_aktivitas", e.target.value)}
              />
            </FormField>
            <FormField label="Akun" htmlFor="draft_akun" error={errors.akun}>
              <select
                id="draft_akun"
                value={form.akun}
                onChange={(e) => handleFormChange("akun", e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {AKUN_OPTIONS.map((akun) => (
                  <option key={akun} value={akun}>{akun}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Platform" htmlFor="draft_platform" error={errors.platform}>
              <select
                id="draft_platform"
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={form.platform}
                onChange={(e) => handleFormChange("platform", e.target.value)}
              >
                {PLATFORM_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Jenis Konten" htmlFor="draft_jenis" error={errors.jenis_konten}>
              <select
                id="draft_jenis"
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={form.jenis_konten}
                onChange={(e) => handleFormChange("jenis_konten", e.target.value)}
              >
                {contentTypeOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Tipe Aktivitas" htmlFor="draft_tipe" error={errors.tipe_aktivitas}>
              <select
                id="draft_tipe"
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={form.tipe_aktivitas}
                onChange={(e) => handleFormChange("tipe_aktivitas", e.target.value)}
              >
                {ACTIVITY_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Produk" htmlFor="draft_produk">
              <SearchableSelect
                id="draft_produk"
                options={productOptions}
                value={form.produk}
                onValueChange={(v) => handleFormChange("produk", v)}
                placeholder={productLoading ? "Memuat produk..." : "Cari produk..."}
                disabled={productLoading}
                emptyText="Produk tidak ditemukan."
              />
            </FormField>
            <FormField label="Link Konten" htmlFor="draft_link">
              <Input
                id="draft_link"
                placeholder="Opsional"
                value={form.link_konten}
                onChange={(e) => handleFormChange("link_konten", e.target.value)}
              />
            </FormField>
            <FormField label="PIC" htmlFor="draft_pic" error={errors.pic}>
              <select
                id="draft_pic"
                value={form.pic}
                onChange={(e) => handleFormChange("pic", e.target.value)}
                disabled={picLoading}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">{picLoading ? "Memuat PIC..." : "Pilih PIC"}</option>
                {picOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Status" htmlFor="draft_status">
              <select
                id="draft_status"
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={form.status}
                onChange={(e) => handleFormChange("status", e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </FormField>
          </div>
          <FieldError message={errors.jenis_konten || errors.tipe_aktivitas ? "Periksa kembali field yang wajib diisi." : undefined} />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); setEditingId(null); setErrors({}); }}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Menyimpan..." : editingId ? "Update" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Loading state ── */}
      {loading && items.length === 0 ? (
        <WorkspacePanel title="Daily Upload" description="Memuat data...">
          <p className="py-8 text-center text-muted-foreground">Memuat data...</p>
        </WorkspacePanel>
      ) : error ? (
        <WorkspacePanel title="Daily Upload" description="Terjadi kesalahan">
          <p className="py-8 text-center text-destructive">{error}</p>
        </WorkspacePanel>
      ) : (
        /* ── Table ── */
        <WorkspacePanel
          title="Rekap Daily Upload"
          description={`Total ${visible.length} data${filterPlatform ? ` — platform: ${filterPlatform}` : ""}.`}
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={isAllSelected} onCheckedChange={toggleSelectAll} />
                </TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Akun</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead>PIC</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                    Belum ada data. Klik &ldquo;Input Baru&rdquo; untuk menambahkan.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <Checkbox checked={selectedIds.has(d.id!)} onCheckedChange={() => toggleSelect(d.id!)} />
                    </TableCell>
                    <TableCell>{d.tanggal_aktivitas}</TableCell>
                    <TableCell>{d.platform}</TableCell>
                    <TableCell>{d.akun}</TableCell>
                    <TableCell>{d.jenis_konten}</TableCell>
                    <TableCell>{d.tipe_aktivitas}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{d.produk || "—"}</TableCell>
                    <TableCell>{d.pic}</TableCell>
                    <TableCell>{d.status}</TableCell>
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
                <label className="text-xs text-slate-500" htmlFor="daily_page_size">Baris</label>
                <select
                  id="daily_page_size"
                  className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700"
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPageIndex(0); }}
                >
                  {[5, 10, 20, 50].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2"
                  disabled={pageIndex === 0}
                  onClick={() => setPageIndex((p) => p - 1)}
                >
                  Prev
                </Button>
                <span className="px-1 text-xs text-slate-600">
                  {pageIndex + 1} / {pageCount}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2"
                  disabled={pageIndex >= pageCount - 1}
                  onClick={() => setPageIndex((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </WorkspacePanel>
      )}
    </div>
  );
}
