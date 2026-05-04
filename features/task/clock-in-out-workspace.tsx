"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Clock, ClockIcon } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import { PageShell } from "@/components/foundation/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTaskAttendance } from "@/features/task/use-task-module";
import type { TaskAttendance } from "@/types/task";

const columnHelper = createColumnHelper<TaskAttendance>();

const statusColors: Record<string, string> = {
  present: "bg-emerald-100 text-emerald-700",
  late: "bg-amber-100 text-amber-700",
  early_leave: "bg-orange-100 text-orange-700",
  absent: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  present: "Hadir",
  late: "Terlambat",
  early_leave: "Pulang Cepat",
  absent: "Absen",
};

function formatTime(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(clockIn: string | null, clockOut: string | null) {
  if (!clockIn || !clockOut) return "-";
  const start = new Date(clockIn);
  const end = new Date(clockOut);
  const hours = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60));
  const mins = Math.floor(((end.getTime() - start.getTime()) / (1000 * 60)) % 60);
  return `${hours}h ${mins}m`;
}

export function TaskClockInOutWorkspace() {
  const { todayQuery, historyQuery, clockIn, clockOut, clockingIn, clockingOut } = useTaskAttendance();
  
  const today = todayQuery.data;
  const history = historyQuery.data ?? [];
  
  const hasClockedIn = !!today?.clock_in;
  const hasClockedOut = !!today?.clock_out;

  const columns = [
    columnHelper.accessor("date", {
      header: "Tanggal",
      cell: (info) => new Date(info.getValue()).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" }),
    }),
    columnHelper.accessor("clock_in", {
      header: "Masuk",
      cell: (info) => formatTime(info.getValue()),
    }),
    columnHelper.accessor("clock_out", {
      header: "Pulang",
      cell: (info) => formatTime(info.getValue()),
    }),
    columnHelper.display({
      id: "duration",
      header: "Durasi",
      cell: ({ row }) => formatDuration(row.original.clock_in, row.original.clock_out),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => (
        <Badge className={statusColors[info.getValue()]}>{statusLabels[info.getValue()]}</Badge>
      ),
    }),
  ];

  const currentTime = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <PageShell
      eyebrow="Absensi"
      title="Clock In / Out"
      description="Catat kehadiran harian dengan clock in dan clock out."
    >
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="text-center">
              <p className="text-sm text-slate-500">Jam Saat Ini</p>
              <p className="text-4xl font-bold text-slate-900 font-mono">{currentTime}</p>
            </div>
            
            {today && (
              <div className="text-center">
                <p className="text-sm text-slate-500">Status Hari Ini</p>
                <Badge className={`${statusColors[today.status]} text-base px-3 py-1`}>
                  {statusLabels[today.status]}
                </Badge>
                <p className="text-sm text-slate-600 mt-1">
                  {today.clock_in && `Masuk: ${formatTime(today.clock_in)}`}
                  {today.clock_out && ` | Pulang: ${formatTime(today.clock_out)}`}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              {!hasClockedIn ? (
                <Button size="lg" onClick={() => void clockIn()} disabled={clockingIn}>
                  <ClockIcon className="size-5 mr-2" />
                  {clockingIn ? "Mencatat..." : "Clock In"}
                </Button>
              ) : !hasClockedOut ? (
                <Button size="lg" onClick={() => void clockOut()} disabled={clockingOut}>
                  <ClockIcon className="size-5 mr-2" />
                  {clockingOut ? "Mencatat..." : "Clock Out"}
                </Button>
              ) : (
                <Button size="lg" disabled>
                  <Clock className="size-5 mr-2" />
                  Selesai
                </Button>
              )}
            </div>
          </div>
        </Card>

        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Riwayat Absensi</h3>
          <DataTable 
            columns={columns} 
            data={history} 
            emptyMessage="Belum ada riwayat absensi." 
            pagination={{ enabled: true, pageSize: 10 }} 
          />
        </div>
      </div>
    </PageShell>
  );
}