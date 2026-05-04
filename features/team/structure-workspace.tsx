"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Users } from "lucide-react";
import { PageShell } from "@/components/foundation/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { teamApi } from "@/features/team/api";
import { departmentInputSchema } from "@/schemas/task-module";
import type { Department } from "@/types/task";

export function TeamStructureWorkspace() {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState({ name: "", parent_id: "" });
  const [validationError, setValidationError] = useState("");

  const { data: deptData, isLoading, isError, refetch } = useQuery({
    queryKey: ["departments"],
    queryFn: () => teamApi.departments.list(),
  });

  const { data: users } = useQuery({
    queryKey: ["team-users"],
    queryFn: () => teamApi.users.list(),
  });

  const usersById = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of users?.users ?? []) {
      map.set(u.id, u.full_name ?? u.username);
    }
    return map;
  }, [users]);

  const enrichedMembers = useMemo(() => {
    return (deptData?.members ?? []).map(m => ({
      ...m,
      full_name: usersById.get(m.user_id) ?? m.user_id,
    }));
  }, [deptData, usersById]);

  const departments = deptData?.departments ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; parent_id?: string | null }) =>
      teamApi.departments.create(payload),
    onSuccess: () => {
      toast.success("Departemen berhasil dibuat");
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setModalOpen(false);
      setForm({ name: "", parent_id: "" });
      setValidationError("");
    },
    onError: () => {
      toast.error("Gagal membuat departemen");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name: string; parent_id?: string | null } }) =>
      teamApi.departments.update(id, payload),
    onSuccess: () => {
      toast.success("Departemen berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setModalOpen(false);
      setEditingDept(null);
      setForm({ name: "", parent_id: "" });
      setValidationError("");
    },
    onError: () => {
      toast.error("Gagal memperbarui departemen");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teamApi.departments.remove(id),
    onSuccess: () => {
      toast.success("Departemen berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setDeleteOpen(false);
      setEditingDept(null);
    },
    onError: () => {
      toast.error("Gagal menghapus departemen");
    },
  });

  function toggleDept(id: string) {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpanded(next);
  }

  function getChildren(parentId: string | null) {
    return departments.filter(d => d.parent_id === parentId);
  }

  function getMembers(deptId: string) {
    return enrichedMembers.filter(m => m.department_id === deptId);
  }

  function openEdit(dept?: Department) {
    if (dept) {
      setEditingDept(dept);
      setForm({ name: dept.name, parent_id: dept.parent_id ?? "" });
    } else {
      setEditingDept(null);
      setForm({ name: "", parent_id: "" });
    }
    setValidationError("");
    setModalOpen(true);
  }

  function save() {
    setValidationError("");
    const payload = {
      name: form.name,
      parent_id: form.parent_id || null,
    };
    const parsed = departmentInputSchema.safeParse(payload);
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0].message);
      return;
    }
    if (editingDept) {
      updateMutation.mutate({ id: editingDept.id, payload: parsed.data });
    } else {
      createMutation.mutate(parsed.data);
    }
  }

  function confirmDelete() {
    if (!editingDept) return;
    deleteMutation.mutate(editingDept.id);
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  function renderDept(dept: Department, depth: number = 0) {
    const children = getChildren(dept.id);
    const members = getMembers(dept.id);
    const isExpanded = expanded.has(dept.id);
    const hasChildren = children.length > 0;

    return (
      <div key={dept.id}>
        <div className="flex items-center gap-2 py-2" style={{ marginLeft: `${depth * 24}px` }}>
          {hasChildren ? (
            <button onClick={() => toggleDept(dept.id)} className="p-1 hover:bg-slate-100 rounded">
              {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            </button>
          ) : (
            <div className="w-6" />
          )}
          <Card className="flex-1">
            <CardContent className="p-3 flex justify-between items-center">
              <div>
                <span className="font-medium text-slate-900">{dept.name}</span>
                {dept.head_user_id && <Badge variant="outline" className="ml-2 text-xs">Head</Badge>}
              </div>
              <div className="flex gap-1">
                <Button size="icon-xs" variant="outline" onClick={() => openEdit(dept)}><Pencil className="size-3.5" /></Button>
                <Button size="icon-xs" variant="destructive" onClick={() => { setEditingDept(dept); setDeleteOpen(true); }}><Trash2 className="size-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        </div>
        {isExpanded && (
          <div>
            {members.length > 0 && (
              <div className="space-y-1 mb-2" style={{ marginLeft: `${depth * 24 + 32}px` }}>
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-2 py-1 text-sm">
                    <Users className="size-4 text-slate-400" />
                    <span className="text-slate-600">{m.full_name ?? m.user_id}</span>
                    <Badge variant="outline" className="text-xs">{m.role_title}</Badge>
                  </div>
                ))}
              </div>
            )}
            {children.map(child => renderDept(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  const rootDepts = departments.filter(d => d.parent_id === null);

  return (
    <PageShell eyebrow="Team" title="Struktur Tim" description="Organisasi departemen dan hierarki tim.">
      <div className="space-y-5">
        <div className="flex justify-end"><Button size="sm" onClick={() => openEdit()}><Plus className="size-4" /> Tambah Dept</Button></div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-sm text-slate-500">Memuat...</div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-sm text-red-600">
            <span>Gagal memuat data</span>
            <Button size="sm" variant="outline" onClick={() => refetch()}>Muat Ulang</Button>
          </div>
        ) : rootDepts.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-slate-500">Belum ada departemen.</div>
        ) : (
          <div className="space-y-1">
            {rootDepts.map(dept => renderDept(dept))}
          </div>
        )}
      </div>
      <ModalFormShell
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingDept ? "Edit Departemen" : "Tambah Departemen"}
        description="Nama dan parent departemen."
        submitLabel={editingDept ? "Simpan" : "Buat"}
        isSubmitting={isSubmitting}
        onSubmit={save}
      >
        <FormField label="Nama" htmlFor="dept_name">
          <Input id="dept_name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </FormField>
        <FormField label="Parent Departemen" htmlFor="dept_parent">
          <select
            id="dept_parent"
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            value={form.parent_id}
            onChange={e => setForm({ ...form, parent_id: e.target.value })}
          >
            <option value="">Tidak ada (Root)</option>
            {departments.filter(d => d.id !== editingDept?.id).map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </FormField>
        {validationError && <p className="text-sm text-red-500">{validationError}</p>}
      </ModalFormShell>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Hapus Departemen</DialogTitle><DialogDescription>Hapus departemen ini?</DialogDescription></DialogHeader>
          <DialogFooter showCloseButton>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
