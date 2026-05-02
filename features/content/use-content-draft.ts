"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import type { DailyUpload, DailyUploadCreate, DailyUploadUpdate } from "@/types/content";

/* ─── API helpers ─── */

const API_BASE = "/api/content/daily-upload";

async function apiFetchAll(): Promise<DailyUpload[]> {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error("Gagal memuat data daily upload");
  return res.json();
}

async function apiCreate(data: DailyUploadCreate): Promise<DailyUpload> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Gagal menyimpan daily upload");
  return res.json();
}

async function apiUpdate(id: string, data: DailyUploadUpdate): Promise<DailyUpload> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Gagal mengupdate daily upload");
  return res.json();
}

async function apiDelete(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Gagal menghapus daily upload");
}

/* ─── Reducer ─── */

type Action =
  | { type: "upsert"; payload: DailyUpload }
  | { type: "remove"; id: string }
  | { type: "set"; payload: DailyUpload[] };

function draftReducer(state: DailyUpload[], action: Action): DailyUpload[] {
  switch (action.type) {
    case "set":
      return action.payload;
    case "upsert": {
      const idx = state.findIndex((d) => d.id === action.payload.id);
      if (idx >= 0) {
        const next = [...state];
        next[idx] = action.payload;
        return next;
      }
      return [...state, action.payload];
    }
    case "remove":
      return state.filter((d) => d.id !== action.id);
    default:
      return state;
  }
}

/* ─── Hook ─── */

export function useContentDraft() {
  const [items, dispatch] = useReducer(draftReducer, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data dari API saat mount
  useEffect(() => {
    let cancelled = false;
    apiFetchAll()
      .then((data) => {
        if (!cancelled) {
          dispatch({ type: "set", payload: data });
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal load");
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const upsert = useCallback(async (data: DailyUploadCreate | (DailyUploadUpdate & { id: string })) => {
    if ("id" in data && data.id) {
      const { id, ...rest } = data as DailyUploadUpdate & { id: string };
      const updated = await apiUpdate(id, rest);
      dispatch({ type: "upsert", payload: updated });
      return updated;
    }
    const created = await apiCreate(data as DailyUploadCreate);
    dispatch({ type: "upsert", payload: created });
    return created;
  }, []);

  const remove = useCallback(async (id: string) => {
    await apiDelete(id);
    dispatch({ type: "remove", id });
  }, []);

  const refresh = useCallback(async () => {
    const data = await apiFetchAll();
    dispatch({ type: "set", payload: data });
  }, []);

  return { items, loading, error, upsert, remove, refresh };
}