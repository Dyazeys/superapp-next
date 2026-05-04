"use client";

import { Plus, Pencil, Trash2, Calendar, CalendarDays } from "lucide-react";
import { PageShell } from "@/components/foundation/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/forms/form-field";
import { ModalFormShell } from "@/components/forms/modal-form-shell";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTaskEvents } from "@/features/task/use-task-module";
import type { TaskEvent } from "@/types/task";

function formatEventTime(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const date = startDate.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
  const time = `${startDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} - ${endDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
  return { date, time };
}

export function TeamCalendarWorkspace() {
  const hooks = useTaskEvents();
  const events = hooks.eventsQuery.data ?? [];

  const eventsByMonth = events.reduce((acc, event) => {
    const month = new Date(event.start_time).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    if (!acc[month]) acc[month] = [];
    acc[month].push(event);
    return acc;
  }, {} as Record<string, TaskEvent[]>);

  function openCreateModal() {
    hooks.openEventModal();
    hooks.eventForm.setValue("is_team_event", true);
  }

  function openEditModal(event: TaskEvent) {
    hooks.openEventModal(event);
  }

  function openDeleteModal(event: TaskEvent) {
    hooks.openEventDeleteModal(event);
  }

  return (
    <PageShell eyebrow="Team" title="Kalender Tim" description="Event tim yang melibatkan semua anggota.">
      <div className="space-y-5">
        <div className="flex justify-end">
          <Button size="sm" onClick={openCreateModal}>
            <Plus className="size-4" />
            Tambah Event
          </Button>
        </div>

        {Object.keys(eventsByMonth).length === 0 ? (
          <Card className="p-8 text-center">
            <CalendarDays className="size-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">Belum ada event.</p>
          </Card>
        ) : (
          Object.entries(eventsByMonth).map(([month, monthEvents]) => (
            <div key={month}>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">{month}</h3>
              <div className="space-y-2">
                {monthEvents.map((event) => {
                  const { date, time } = formatEventTime(event.start_time, event.end_time);
                  return (
                    <Card key={event.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={event.is_team_event ? "default" : "outline"} className="text-xs">
                                {event.is_team_event ? "Team" : "Personal"}
                              </Badge>
                              <span className="font-medium text-slate-900">{event.title}</span>
                            </div>
                            <p className="text-sm text-slate-500 flex items-center gap-1">
                              <Calendar className="size-3.5" />
                              {date} | {time}
                            </p>
                            {event.description && (
                              <p className="text-sm text-slate-600 mt-1 line-clamp-1">{event.description}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon-xs" variant="outline" onClick={() => openEditModal(event)}>
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button size="icon-xs" variant="destructive" onClick={() => openDeleteModal(event)}>
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <ModalFormShell
        open={hooks.eventModal.open}
        onOpenChange={hooks.eventModal.setOpen}
        title={hooks.editingEvent ? "Edit Event" : "Tambah Event"}
        description="Isi detail event."
        submitLabel={hooks.editingEvent ? "Simpan" : "Buat"}
        isSubmitting={hooks.eventsQuery.isPending}
        onSubmit={async () => {
          const isValid = await hooks.eventForm.trigger();
          if (isValid) {
            await hooks.saveEvent(hooks.eventForm.getValues());
          }
        }}
      >
        <FormField label="Judul" htmlFor="event_title" error={hooks.eventForm.formState.errors.title?.message}>
          <Input id="event_title" {...hooks.eventForm.register("title")} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Mulai" htmlFor="event_start" error={hooks.eventForm.formState.errors.start_time?.message}>
            <Input id="event_start" type="datetime-local" {...hooks.eventForm.register("start_time")} />
          </FormField>
          <FormField label="Selesai" htmlFor="event_end" error={hooks.eventForm.formState.errors.end_time?.message}>
            <Input id="event_end" type="datetime-local" {...hooks.eventForm.register("end_time")} />
          </FormField>
        </div>
        <FormField label="Deskripsi" htmlFor="event_desc">
          <Textarea id="event_desc" {...hooks.eventForm.register("description")} rows={2} />
        </FormField>
        <label className="flex items-center gap-2 cursor-pointer mt-1">
          <input
            type="checkbox"
            checked={hooks.eventForm.watch("is_team_event")}
            onChange={(e) => hooks.eventForm.setValue("is_team_event", e.target.checked)}
            className="size-4 rounded border-slate-300 accent-blue-600"
          />
          <span className="text-sm text-slate-700">Event Tim</span>
        </label>
      </ModalFormShell>

      <Dialog open={hooks.eventDeleteModal.open} onOpenChange={hooks.eventDeleteModal.setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Event</DialogTitle>
            <DialogDescription>
              {hooks.editingEvent ? `Hapus event "${hooks.editingEvent.title}"?` : "Hapus event ini?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button
              type="button"
              variant="destructive"
              disabled={hooks.deleteEventPending}
              onClick={() => void hooks.deleteEvent()}
            >
              {hooks.deleteEventPending ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
