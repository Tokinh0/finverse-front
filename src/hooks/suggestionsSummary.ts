import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { suggestionsApi } from "../api";
import type { SuggestionsSummary } from "../types";

/** Poll quickly while suggestions are being generated, slowly otherwise. */
export const POLL_ACTIVE_MS = 5_000;
export const POLL_IDLE_MS = 60_000;

export interface SuggestionsSummaryState {
  summary: SuggestionsSummary | null;
  /** Re-fetch now, e.g. after accepting or rejecting a suggestion. */
  refresh: () => Promise<void>;
}

export const SuggestionsSummaryContext = createContext<SuggestionsSummaryState>({
  summary: null,
  refresh: async () => {},
});

export const isRunActive = (summary: SuggestionsSummary | null) =>
  summary?.latest_run?.status === "queued" || summary?.latest_run?.status === "running";

/** Owns the summary for the whole app (App provides it through SuggestionsSummaryContext). */
export function useSuggestionsSummaryState(): SuggestionsSummaryState {
  const [summary, setSummary] = useState<SuggestionsSummary | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const refresh = useCallback(async () => {
    clearTimeout(timer.current);
    let next: SuggestionsSummary | null = null;
    try {
      next = await suggestionsApi.summary();
      setSummary(next);
    } catch (err) {
      console.error(err);
    }
    timer.current = setTimeout(refresh, isRunActive(next) ? POLL_ACTIVE_MS : POLL_IDLE_MS);
  }, []);

  useEffect(() => {
    refresh();
    return () => clearTimeout(timer.current);
  }, [refresh]);

  return { summary, refresh };
}

/** The app-wide suggestions summary and a refresh function. */
export const useSuggestionsSummary = () => useContext(SuggestionsSummaryContext);
