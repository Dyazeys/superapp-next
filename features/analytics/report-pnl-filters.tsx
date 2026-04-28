"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SelectNative } from "@/components/ui/select-native";
import { cn } from "@/lib/utils";

type MonthOption = {
  value: string;
  label: string;
};

type ChannelOption = {
  value: string;
  label: string;
};

export function ReportPnlFilters({
  monthOptions,
  channelOptions,
  defaultMonth,
  defaultChannelId,
}: {
  monthOptions: MonthOption[];
  channelOptions: ChannelOption[];
  defaultMonth: string;
  defaultChannelId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const [month, setMonth] = useState(defaultMonth);
  const [channelId, setChannelId] = useState(defaultChannelId);
  const [openMonthPicker, setOpenMonthPicker] = useState(false);

  useEffect(() => {
    setMonth(defaultMonth);
  }, [defaultMonth]);

  useEffect(() => {
    setChannelId(defaultChannelId);
  }, [defaultChannelId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setOpenMonthPicker(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeMonthLabel = useMemo(
    () => monthOptions.find((option) => option.value === month)?.label ?? "Pilih bulan",
    [month, monthOptions]
  );

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", month);
    if (channelId) {
      params.set("channelId", channelId);
    } else {
      params.delete("channelId");
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)_auto]">
        <div ref={pickerRef} className="relative">
          <button
            type="button"
            onClick={() => setOpenMonthPicker((current) => !current)}
            className={cn(
              "flex h-11 w-full items-center justify-between rounded-2xl border px-4 text-left text-sm shadow-sm transition-all",
              openMonthPicker
                ? "border-sky-300 bg-sky-50/70 ring-4 ring-sky-100"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Bulan</p>
              <p className="truncate text-sm font-medium text-slate-900">{activeMonthLabel}</p>
            </div>
            <ChevronsUpDown className="size-4 shrink-0 text-slate-500" />
          </button>

          {openMonthPicker ? (
            <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-full rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
              <div className="mb-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Pilih bulan
              </div>
              <div className="max-h-72 space-y-1 overflow-y-auto">
                {monthOptions.map((option) => {
                  const active = option.value === month;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setMonth(option.value);
                        setOpenMonthPicker(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors",
                        active
                          ? "bg-sky-50 text-sky-700"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <span className="font-medium">{option.label}</span>
                      {active ? <Check className="size-4" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-1.5 py-1.5 shadow-sm">
          <SelectNative
            value={channelId}
            onChange={(event) => setChannelId(event.target.value)}
            className="h-8 rounded-xl border-0 bg-transparent px-3 pr-10 text-sm shadow-none focus-visible:ring-0"
          >
            {channelOptions.map((channel) => (
              <option key={channel.value} value={channel.value}>
                {channel.label}
              </option>
            ))}
          </SelectNative>
        </div>

        <button
          type="button"
          onClick={applyFilters}
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-900 bg-slate-900 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
        >
          Tampilkan report
        </button>
      </div>
    </div>
  );
}
