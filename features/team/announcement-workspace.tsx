"use client";

import { useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Megaphone, Pencil, Pin, PinOff, Plus, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageShell } from "@/components/foundation/page-shell";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SelectNative } from "@/components/ui/select-native";
import { teamApi } from "@/features/team/api";
import { announcementInputSchema } from "@/schemas/task-module";
import type { TeamAnnouncement, AnnouncementCategory } from "@/types/task";

const columnHelper = createColumnHelper<TeamAnnouncement>();

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  pending: "bg-amber-100 text-amber-700",
  published: "bg-emerald-100 text-emerald-700",
};

const categoryColors: Record<string, string> = {
  umum: "bg-blue-100 text-blue-700",
  operasional: "bg-orange-100 text-orange-700",
  kebijakan: "bg-purple-100 text-purple-700",
  event: "bg-pink-100 text-pink-700",
};

export function TeamAnnouncementWorkspace() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<TeamAnnouncement | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState<{ title: string; content: string; category: AnnouncementCategory; is_pinned: boolean }>({
    title: "", content: "", category: "umum", is_pinned: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const query = useQuery({
    queryKey: ["team-announcements"],
    queryFn: teamApi.announcements.list,
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; content: string; category: AnnouncementCategory; is_pinned: boolean }) =>
      teamApi.announcements.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-announcements"] });
      setModalOpen(false);
      toast.success("Pengumuman berhasil dibuat");
    },
    onError: () => toast.error("Gagal membuat pengumuman"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ title: string; content: string; category: AnnouncementCategory; is_pinned: boolean }> }) =>
      teamApi.announcements.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-announcements"] });
      setModalOpen(false);
      toast.success("Pengumuman berhasil diupdate");
    },
    onError: () => toast.error("Gagal mengupdate pengumuman"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teamApi.announcements.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-announcements"] });
      setDeleteModalOpen(false);
      setEditing(null);
      toast.success("Pengumuman berhasil dihapus");
    },
    onError: () => toast.error("Gagal menghapus pengumuman"),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => teamApi.announcements.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-announcements"] });
      toast.success("Pengumuman berhasil dipublish");
    },
    onError: () => toast.error("Gagal mempublish pengumuman"),
  });

  const pinMutation = useMutation({
    mutationFn: (id: string) => teamApi.announcements.togglePin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-announcements"] });
    },
    onError: () => toast.error("Gagal mengubah pin"),
  });

  function openEdit(announcement?: TeamAnnouncement) {
    setErrors({});
    if (announcement) {
      setEditing(announcement);
      setFormData({
        title: announcement.title,
        content: announcement.content,
        category: announcement.category,
        is_pinned: announcement.is_pinned,
      });
    } else {
      setEditing(null);
      setFormData({ title: "", content: "", category: "umum", is_pinned: false });
    }
    setModalOpen(true);
  }

  function save() {
    const parsed = announcementInputSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: parsed.data });
    } else {
      createMutation.mutate(parsed.data);
    }
  }

  function confirmDelete() {
    if (!editing) return;
    deleteMutation.mutate(editing.id);
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  const columns = [
    columnHelper.accessor("title", {
      header: "Judul",
      cell: (info) => (
        <span className="font-medium text-slate-900 flex items-center gap-1">
          {info.row.original.is_pinned && <Pin className="size-3 text-amber-500" />}
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("category", {
      header: "Kategori",
      cell: (info) => <Badge className={categoryColors[info.getValue()]}>{info.getValue()}</Badge>,
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => <Badge className={statusColors[info.getValue()]}>{info.getValue()}</Badge>,
    }),
    columnHelper.accessor("created_at", {
      header: "Dibuat",
      cell: (info) => new Date(info.getValue()).toLocaleDateString("id-ID"),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const a = row.original;
        return (
          <div className="flex justify-end gap-1">
            {a.status === "draft" && (
              <Button size="icon-xs" variant="outline" onClick={() => publishMutation.mutate(a.id)}>
                <Megaphone className="size-3.5" />
              </Button>
            )}
            <Button size="icon-xs" variant="outline" onClick={() => pinMutation.mutate(a.id)}>
              {a.is_pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
            </Button>
            <Button size="icon-xs" variant="outline" onClick={() => openEdit(a)}>
              <Pencil className="size-3.5" />
            </Button>
            <Button size="icon-xs" variant="destructive" onClick={() => { setEditing(a); setDeleteModalOpen(true); }}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        );
      },
    }),
  ];

  return (
    <PageShell eyebrow="Team" title="Pengumuman" description="Kelola pengumuman internal tim.">
      <div className="space-y-5">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => openEdit()}>
            <Plus className="size-4" /> Buat Pengumuman
          </Button>
        </div>
        {query.isLoading ? (
          <EmptyState title="Memuat..." description="Mohon tunggu sebentar." />
        ) : query.isError ? (
          <EmptyState title="Gagal memuat" description="Terjadi kesalahan saat memuat data." />
        ) : (
          <DataTable
            columns={columns}
            data={query.data ?? []}
            emptyMessage="Belum ada pengumuman."
            pagination={{ enabled: true, pageSize: 10 }}
          />
        )}
      </div>

      <ModalFormShell
        open={modalOpen}
        onOpenChange={(v) => { setModalOpen(v); if (!v) setErrors({}); }}
        title={editing ? "Edit Pengumuman" : "Buat Pengumuman"}
        description={editing ? "Edit pengumuman yang sudah ada." : "Buat pengumuman baru."}
        submitLabel={editing ? "Simpan" : "Buat"}
        isSubmitting={isPending}
        onSubmit={save}
      >
        <FormField label="Judul" htmlFor="ann_title" error={errors.title}>
          <Input id="ann_title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
        </FormField>
        <FormField label="Kategori" htmlFor="ann_category" helperText="Umum = semua orang, penting = highlight di atas">
          <SelectNative id="ann_category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as AnnouncementCategory })}>
            <option value="umum">Umum</option>
            <option value="operasional">Operasional</option>
            <option value="kebijakan">Kebijakan</option>
            <option value="event">Event</option>
          </SelectNative>
        </FormField>
        <FormField label="Konten" htmlFor="ann_content" error={errors.content} helperText="Mendukung teks panjang.">
          <Textarea id="ann_content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={5} />
        </FormField>
      </ModalFormShell>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Pengumuman</DialogTitle>
            <DialogDescription>Hapus pengumuman ini?</DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
