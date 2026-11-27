import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCreditDebitReport } from "./useCreditDebitReport";

describe("useCreditDebitReport", () => {
  it("loads the report and lists months newest first", async () => {
    const load = vi.fn().mockResolvedValue({ credit: { "2025-01": {} }, debit: { "2025-03": {}, "2024-12": {} } });

    const { result } = renderHook(() => useCreditDebitReport(load));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.months).toEqual(["2025-03", "2025-01", "2024-12"]);
    expect(result.current.error).toBeNull();
  });

  it("exposes an error when loading fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const load = vi.fn().mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useCreditDebitReport(load));

    await waitFor(() => expect(result.current.error).toBe("Could not load the report"));
    expect(result.current.months).toEqual([]);
  });
});
