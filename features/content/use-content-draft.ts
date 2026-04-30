"use client";

import { useCallback, useReducer } from "react";
import type { ContentDailyDraft } from "@/types/content";

/* ─── API stubs (mock-ready, no fetch to DB) ─── */

export function apiFetchDrafts(): Promise<ContentDailyDraft[]> {
  return Promise.resolve([]);
}

export function apiSaveDraft(
  _draft: Omit<ContentDailyDraft, "id">
): Promise<ContentDailyDraft> {
  const id = crypto.randomUUID();
  return Promise.resolve({ id, ..._draft });
}

/* ─── Reducer ─── */

type Action =
  | { type: "upsert"; payload: ContentDailyDraft }
  | { type: "remove"; id: string }
  | { type: "set"; payload: ContentDailyDraft[] };

function draftReducer(state: ContentDailyDraft[], action: Action): ContentDailyDraft[] {
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

export function useContentDraft(initial: ContentDailyDraft[] = []) {
  const [drafts, dispatch] = useReducer(draftReducer, initial);

  const upsert = useCallback((d: ContentDailyDraft) => {
    dispatch({ type: "upsert", payload: d });
  }, []);

  const remove = useCallback((id: string) => {
    dispatch({ type: "remove", id });
  }, []);

  const setDrafts = useCallback((d: ContentDailyDraft[]) => {
    dispatch({ type: "set", payload: d });
  }, []);

  const filtered = useCallback(
    (platform?: string, dateFrom?: string, dateTo?: string) =>
      drafts.filter((d) => {
        if (platform && d.platform !== platform) return false;
        if (dateFrom && d.report_date < dateFrom) return false;
        if (dateTo && d.report_date > dateTo) return false;
        return true;
      }),
    [drafts]
  );

  return { drafts, upsert, remove, setDrafts, filtered };
}