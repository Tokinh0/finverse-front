import { describe, expect, it } from "vitest";
import {
  columnSortState,
  isTransactionSort,
  isoDate,
  monthRange,
  nextColumnSort,
  presetRange,
  rangeChoice,
  rangeForChoice,
} from "./transactionFilters";

const today = new Date(2026, 1, 14); // 14 Feb 2026

describe("transaction sorts", () => {
  it("recognizes the API's sorts", () => {
    expect(isTransactionSort("amount_desc")).toBe(true);
    expect(isTransactionSort("DROP TABLE")).toBe(false);
    expect(isTransactionSort(null)).toBe(false);
  });

  it("starts each column in its usual direction, then flips it", () => {
    expect(nextColumnSort("amount", "date_desc")).toBe("amount_desc");
    expect(nextColumnSort("amount", "amount_desc")).toBe("amount_asc");
    expect(nextColumnSort("amount", "amount_asc")).toBe("amount_desc");
    expect(nextColumnSort("name", "date_desc")).toBe("name_asc");
    expect(nextColumnSort("date", "date_desc")).toBe("date_asc");
  });

  it("says how a column is sorted", () => {
    expect(columnSortState("date", "date_desc")).toBe("descending");
    expect(columnSortState("category", "category_asc")).toBe("ascending");
    expect(columnSortState("name", "date_desc")).toBeUndefined();
  });
});

describe("date ranges", () => {
  it("formats local dates without shifting to UTC", () => {
    expect(isoDate(new Date(2026, 0, 1, 23, 30))).toBe("2026-01-01");
  });

  it("turns a month into its first and last day", () => {
    expect(monthRange("2024-02")).toEqual({ from: "2024-02-01", to: "2024-02-29" });
    expect(monthRange("2025-13")).toBeNull();
    expect(monthRange("feb")).toBeNull();
  });

  it("computes the presets from today", () => {
    expect(presetRange("thisMonth", today)).toEqual({ from: "2026-02-01", to: "2026-02-28" });
    expect(presetRange("lastMonth", today)).toEqual({ from: "2026-01-01", to: "2026-01-31" });
    expect(presetRange("last3Months", today)).toEqual({ from: "2025-12-01", to: "2026-02-28" });
    expect(presetRange("last12Months", today)).toEqual({ from: "2025-03-01", to: "2026-02-28" });
    expect(presetRange("thisYear", today)).toEqual({ from: "2026-01-01", to: "2026-12-31" });
    expect(presetRange("lastYear", today)).toEqual({ from: "2025-01-01", to: "2025-12-31" });
  });

  it("recognizes which quick choice a range is", () => {
    const months = ["2025-11", "2025-10"];
    expect(rangeChoice({ from: "", to: "" }, months, today)).toBe("");
    expect(rangeChoice({ from: "2026-01-01", to: "2026-01-31" }, months, today)).toBe("lastMonth");
    expect(rangeChoice({ from: "2025-10-01", to: "2025-10-31" }, months, today)).toBe("month:2025-10");
    expect(rangeChoice({ from: "2025-10-03", to: "" }, months, today)).toBe("custom");
  });

  it("turns a quick choice back into a range", () => {
    expect(rangeForChoice("", today)).toEqual({ from: "", to: "" });
    expect(rangeForChoice("month:2025-10", today)).toEqual({ from: "2025-10-01", to: "2025-10-31" });
    expect(rangeForChoice("thisYear", today)).toEqual({ from: "2026-01-01", to: "2026-12-31" });
    expect(rangeForChoice("custom", today)).toBeNull();
  });
});
