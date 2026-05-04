"use client";

import { RotateCcw, Check, Plus, Pencil, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { PageShell } from "@/components/foundation/page-shell";
import { Button } from "@/components/ui/button";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { FormField } from "@/components/forms/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTaskRoutines } from "@/features/task/use-task-module";

export function TaskRoutineWorkspace() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "mock";
  const hooks = useTaskRoutines(userId);
  const routines = hooks.routinesQuery.data ?? [];

  const completed = routines.filter(r => r.is_completed);
  const uncompleted = routines.filter(r => !r.is_completed);

  return (
    <PageShell
      eyebrow="Tugas"
      title="Rutinitas Harian"
      description="Checklist kegiatan harian. Centang selesai, otomatis reset besok."
    >
      <div className="space-y-5">
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-500">
            {completed.length}/{routines.length} selesai
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => hooks.resetAllRoutines()}>
              <RotateCcw className="size-4" />
              Reset
            </Button>
            <Button size="sm" onClick={() => hooks.openRoutineModal()}>
              <Plus className="size-4" />
              Tambah
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {routines.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">Belum ada rutinitas harian.</p>
          ) : (
            [...uncompleted, ...completed].map((routine) => (
              <div
                key={routine.id}
                className={cn(
                  "group flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                  routine.is_completed
                    ? "border-emerald-200 bg-emerald-50/50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <button
                  type="button"
                  onClick={() => hooks.toggleRoutine(routine.id)}
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    routine.is_completed
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-300 hover:border-slate-400"
                  )}
                >
                  {routine.is_completed && <Check className="size-3.5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium truncate",
                      routine.is_completed ? "text-slate-400 line-through" : "text-slate-900"
                    )}
                  >
                    {routine.title}
                  </p>
                  {routine.description && (
                    <p className={cn(
                      "text-xs mt-0.5 truncate",
                      routine.is_completed ? "text-slate-300" : "text-slate-500"
                    )}>
                      {routine.description}
                    </p>
                  )}
                </div>
                {!routine.is_completed && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon-xs" variant="ghost" onClick={() => hooks.openRoutineModal(routine)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button size="icon-xs" variant="ghost" className="text-red-500" onClick={() => hooks.openRoutineDeleteModal(routine)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <ModalFormShell
        open={hooks.routineModal.open}
        onOpenChange={hooks.routineModal.setOpen}
        title={hooks.editingRoutine ? "Edit Rutinitas" : "Tambah Rutinitas"}
        description="Nama kegiatan harian."
        submitLabel={hooks.editingRoutine ? "Simpan" : "Tambah"}
        isSubmitting={hooks.routinesQuery.isPending}
        onSubmit={hooks.routineForm.handleSubmit((values) => hooks.saveRoutine(values))}
      >
        <FormField label="Judul" htmlFor="routine_title" error={hooks.routineForm.formState.errors.title?.message}>
          <Input id="routine_title" {...hooks.routineForm.register("title")} placeholder="Nama kegiatan..." />
        </FormField>
        <FormField label="Deskripsi" htmlFor="routine_desc" error={hooks.routineForm.formState.errors.description?.message}>
          <Textarea id="routine_desc" {...hooks.routineForm.register("description")} rows={2} placeholder="Deskripsi opsional..." />
        </FormField>
      </ModalFormShell>

      <Dialog open={hooks.routineDeleteModal.open} onOpenChange={hooks.routineDeleteModal.setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Rutinitas</DialogTitle>
            <DialogDescription>
              {hooks.editingRoutine ? `Hapus rutinitas "${hooks.editingRoutine.title}"?` : "Hapus rutinitas ini?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button type="button" variant="destructive" disabled={hooks.deleteRoutinePending} onClick={() => void hooks.deleteRoutine()}>
              {hooks.deleteRoutinePending ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
