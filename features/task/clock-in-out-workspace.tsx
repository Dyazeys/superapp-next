"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { createColumnHelper } from "@tanstack/react-table";
import { Clock, MapPin } from "lucide-react";
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

function getCardStyle(hasClockedIn: boolean, hasClockedOut: boolean) {
  if (!hasClockedIn) return "border-t-slate-300";
  if (!hasClockedOut) return "border-t-blue-400";
  return "border-t-emerald-400";
}

function LocationBadge({ lat, lng }: { lat: number | null; lng: number | null }) {
  if (lat == null || lng == null) return null;
  return (
    <a
      href={`https://www.google.com/maps?q=${lat},${lng}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-blue-500 underline decoration-dotted"
    >
      <MapPin className="size-3" />
      {lat.toFixed(4)},{lng.toFixed(4)}
    </a>
  );
}

export function TaskClockInOutWorkspace() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { todayQuery, historyQuery, clockIn, clockOut, clockingIn, clockingOut } = useTaskAttendance(userId);

  const today = todayQuery.data;
  const history = historyQuery.data ?? [];

  const hasClockedIn = !!today?.clock_in;
  const hasClockedOut = !!today?.clock_out;

  const [liveTime, setLiveTime] = useState(() =>
    new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );

  useEffect(() => {
    const id = setInterval(() => {
      setLiveTime(
        new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

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
    columnHelper.display({
      id: "location",
      header: "Lokasi",
      cell: ({ row }) => <LocationBadge lat={row.original.clock_in_lat} lng={row.original.clock_in_lng} />,
    }),
  ];

  return (
    <PageShell
      eyebrow="Absensi"
      title="Clock In / Out"
      description="Catat kehadiran harian dengan clock in dan clock out."
    >
      <div className="space-y-6">
        <Card className={`border-t-4 ${getCardStyle(hasClockedIn, hasClockedOut)} p-6`}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <div className="text-center sm:text-left">
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Jam Saat Ini</p>
                <p className="text-4xl font-bold text-slate-900 font-mono tabular-nums">{liveTime}</p>
              </div>

              {today && (
                <div className="text-center sm:text-left">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Status</p>
                  <Badge className={`${statusColors[today.status]} text-base px-3 py-1 mt-0.5`}>
                    {statusLabels[today.status]}
                  </Badge>
                  <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                    {today.clock_in && <p>Masuk: {formatTime(today.clock_in)}</p>}
                    {today.clock_out && <p>Pulang: {formatTime(today.clock_out)}</p>}
                    {today.clock_out && today.clock_in && (
                      <p>Durasi: {formatDuration(today.clock_in, today.clock_out)}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-2 sm:items-end">
              <div className="flex gap-2">
                {!hasClockedIn ? (
                  <Button size="lg" className="min-w-[140px]" onClick={() => void clockIn()} disabled={clockingIn}>
                    <Clock className="size-5 mr-2" />
                    {clockingIn ? "Mencatat..." : "Clock In"}
                  </Button>
                ) : !hasClockedOut ? (
                  <Button size="lg" className="min-w-[140px]" onClick={() => void clockOut()} disabled={clockingOut}>
                    <Clock className="size-5 mr-2" />
                    {clockingOut ? "Mencatat..." : "Clock Out"}
                  </Button>
                ) : (
                  <Button size="lg" className="min-w-[140px]" disabled>
                    <Clock className="size-5 mr-2" />
                    Selesai
                  </Button>
                )}
              </div>
              {today && <LocationBadge lat={today.clock_in_lat} lng={today.clock_in_lng} />}
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