import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { suggestionsApi } from "../api";
import { suggestionRun, suggestionsSummary } from "../test/fixtures";
import { POLL_ACTIVE_MS, POLL_IDLE_MS, isRunActive, useSuggestionsSummaryState } from "./suggestionsSummary";

vi.mock("../api", async () => (await import("../test/mockApi")).mockApiModule());

describe("useSuggestionsSummaryState", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const flush = () => act(async () => {});

  it("loads the summary and polls quickly while a run is active", async () => {
    vi.mocked(suggestionsApi.summary).mockResolvedValue(suggestionsSummary({ latest_run: suggestionRun({ status: "running" }) }));

    const { result } = renderHook(() => useSuggestionsSummaryState());
    await flush();
    expect(result.current.summary?.pending_count).toBe(3);
    expect(suggestionsApi.summary).toHaveBeenCalledTimes(1);

    await act(async () => vi.advanceTimersByTime(POLL_ACTIVE_MS));
    expect(suggestionsApi.summary).toHaveBeenCalledTimes(2);
  });

  it("polls slowly when idle, and refresh fetches right away", async () => {
    vi.mocked(suggestionsApi.summary).mockResolvedValue(suggestionsSummary());

    const { result } = renderHook(() => useSuggestionsSummaryState());
    await flush();
    await act(async () => vi.advanceTimersByTime(POLL_ACTIVE_MS));
    expect(suggestionsApi.summary).toHaveBeenCalledTimes(1);

    await act(() => result.current.refresh());
    expect(suggestionsApi.summary).toHaveBeenCalledTimes(2);
    await act(async () => vi.advanceTimersByTime(POLL_IDLE_MS));
    expect(suggestionsApi.summary).toHaveBeenCalledTimes(3);
  });

  it("knows when a run is active", () => {
    expect(isRunActive(null)).toBe(false);
    expect(isRunActive(suggestionsSummary({ latest_run: suggestionRun({ status: "queued" }) }))).toBe(true);
    expect(isRunActive(suggestionsSummary())).toBe(false);
  });
});
