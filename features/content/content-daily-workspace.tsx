"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import {
  CONTENT_TYPE_OPTIONS,
  type ContentDailyDraft,
} from "@/types/content";
import { useContentDraft, apiSaveDraft } from "./use-content-draft";

type Props = {
  platform: "TIKTOK" | "INSTAGRAM";
  platformLabel: string;
};

const emptyForm: Omit<ContentDailyDraft, "id"> = {
  report_date: new Date().toISOString().slice(0, 10),
  platform: "TIKTOK",
  account_name: "",
  content_type: "Video",
  target: 0,
  actual_posted: 0,
  notes: "",
};

type FormErrors = Partial<Record<keyof ContentDailyDraft, string>>;

function validateForm(
  d: Omit<ContentDailyDraft, "id">
): FormErrors {
  const errors: FormErrors = {};
  if (!d.report_date) errors.report_date = "Tanggal wajib diisi.";
  if (!d.account_name?.trim()) errors.account_name = "Nama akun wajib diisi.";
  if (d.target < 0) errors.target = "Target tidak boleh negatif.";
  if (d.actual_posted < 0) errors.actual_posted = "Actual tidak boleh negatif.";
  return errors;
}

export function ContentDailyWorkspace({ platform, platformLabel }: Props) {
  const { drafts, upsert, remove } = useContentDraft();
  const [form, setForm] = useState<Omit<ContentDailyDraft, "id">>({
    ...emptyForm,
    platform,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showForm, setShowForm] = useState(false);

  const visible = drafts.filter((d) => d.platform === platform).filter((d) => {
    if (filterDateFrom && d.report_date < filterDateFrom) return false;
    if (filterDateTo && d.report_date > filterDateTo) return false;
    return true;
  });

  function handleFormChange<K extends keyof Omit<ContentDailyDraft, "id">>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit() {
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const saved = await apiSaveDraft(form);
    upsert(saved);
    setForm({ ...emptyForm, platform });
    setErrors({});
    setShowForm(false);
  }

  return (
    <div className="space-y-6">
      {/* ── Filter bar ── */}
      <WorkspacePanel
        title={`Filter ${platformLabel}`}
        description="Filter laporan konten harian berdasarkan rentang tanggal."
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
          <Button variant="outline" size="sm" onClick={() => { setFilterDateFrom(""); setFilterDateTo(""); }}>
            Reset
          </Button>
          <Button size="sm" className="ml-auto" onClick={() => setShowForm((v) => !v)}>
            <Plus className="mr-1 size-4" />
            Input Baru
          </Button>
        </div>
      </WorkspacePanel>

      {/* ── Input form (collapsible) ── */}
      {showForm ? (
        <WorkspacePanel
          title="Input Konten Harian"
          description="Isi data konten harian untuk dicatat."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Tanggal" htmlFor="draft_date" error={errors.report_date}>
              <Input
                id="draft_date"
                type="date"
                value={form.report_date}
                onChange={(e) => handleFormChange("report_date", e.target.value)}
              />
            </FormField>
            <FormField label="Nama Akun" htmlFor="draft_account" error={errors.account_name}>
              <Input
                id="draft_account"
                placeholder="cth: tiktok_utama"
                value={form.account_name}
                onChange={(e) => handleFormChange("account_name", e.target.value)}
              />
            </FormField>
            <FormField label="Jenis Konten" htmlFor="draft_type">
              <select
                id="draft_type"
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={form.content_type}
                onChange={(e) => handleFormChange("content_type", e.target.value)}
              >
                {CONTENT_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Target" htmlFor="draft_target" error={errors.target}>
              <Input
                id="draft_target"
                type="number"
                min={0}
                value={form.target}
                onChange={(e) => handleFormChange("target", Number(e.target.value))}
              />
            </FormField>
            <FormField label="Actual Posted" htmlFor="draft_actual" error={errors.actual_posted}>
              <Input
                id="draft_actual"
                type="number"
                min={0}
                value={form.actual_posted}
                onChange={(e) => handleFormChange("actual_posted", Number(e.target.value))}
              />
            </FormField>
            <FormField label="Catatan" htmlFor="draft_notes">
              <Input
                id="draft_notes"
                placeholder="Opsional"
                value={form.notes}
                onChange={(e) => handleFormChange("notes", e.target.value)}
              />
            </FormField>
          </div>
          <FieldError message={errors.target || errors.actual_posted ? "Periksa kembali nilai numerik." : undefined} />
          <div className="mt-4 flex gap-2">
            <Button onClick={handleSubmit}>Simpan Draft</Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setErrors({}); }}>
              Batal
            </Button>
          </div>
        </WorkspacePanel>
      ) : null}

      {/* ── Table ── */}
      <WorkspacePanel
        title={`Rekap Konten ${platformLabel}`}
        description={`Daftar input konten harian untuk ${platformLabel}.`}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Akun</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead className="text-right">Target</TableHead>
              <TableHead className="text-right">Posted</TableHead>
              <TableHead>Catatan</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Belum ada data. Klik &ldquo;Input Baru&rdquo; untuk menambahkan.
                </TableCell>
              </TableRow>
            ) : (
              visible.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.report_date}</TableCell>
                  <TableCell>{d.account_name}</TableCell>
                  <TableCell>{d.content_type}</TableCell>
                  <TableCell className="text-right">{d.target}</TableCell>
                  <TableCell className="text-right">{d.actual_posted}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {d.notes || "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(d.id)}
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
      </WorkspacePanel>
    </div>
  );
}