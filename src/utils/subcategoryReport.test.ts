import { describe, expect, it } from "vitest";
import { setCurrentLocale } from "../i18n/locale";
import { CHART_COLORS } from "./colors";
import { amountTier, cleanName, displayDate, formatPercent, longMonth, sortTransactions, toSlices } from "./subcategoryReport";

const tx = (transaction_date: string, amount: number) => ({ name: "X", transaction_date, amount });

describe("subcategoryReport utils", () => {
  it("sorts slices biggest first, with shares and colors tied to the subcategory", () => {
    const slices = toSlices([
      { name: "A", total: 25, color_code: null, transactions: [] },
      { name: "B", total: 75, color_code: "#123456", transactions: [] },
    ]);

    expect(slices.map((s) => [s.name, s.percent, s.color])).toEqual([
      ["B", 0.75, "#123456"],
      ["A", 0.25, CHART_COLORS[0]],
    ]);
  });

  it("handles an all-zero panel", () => {
    expect(toSlices([{ name: "A", total: 0, transactions: [] }])[0].percent).toBe(0);
  });

  it("sorts transactions by date or amount", () => {
    const list = [tx("10/02/2025", 5), tx("31/01/2025", 50)];
    expect(sortTransactions(list, "date").map((t) => t.amount)).toEqual([50, 5]);
    expect(sortTransactions(list, "amount").map((t) => t.amount)).toEqual([50, 5]);
    expect(sortTransactions([tx("01/01/2025", 1), tx("02/01/2025", 9)], "amount").map((t) => t.amount)).toEqual([9, 1]);
  });

  it("formats names, dates, months and percents per language", () => {
    expect(cleanName("PAG_PIX  LOJA ")).toBe("PAG PIX LOJA");
    expect(displayDate("15/01/2025")).toBe("01/15/2025");
    expect(longMonth("2026-10")).toBe("October 2026");
    expect(longMonth("bad")).toBe("bad");
    expect(formatPercent(0.1234)).toBe("12.3%");

    setCurrentLocale("pt-BR");
    expect(displayDate("15/01/2025")).toBe("15/01/2025");
    expect(longMonth("2026-10")).toBe("Outubro de 2026");
    expect(formatPercent(0.1234)).toBe("12,3%");
  });

  it("tiers amounts", () => {
    expect([amountTier(301), amountTier(101), amountTier(100)]).toEqual(["high", "medium", "normal"]);
  });
});
