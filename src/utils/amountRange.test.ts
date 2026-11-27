import { describe, expect, it } from "vitest";
import { amountInputValue, amountRangeLabel, parseAmountRange } from "./amountRange";

describe("amountRange", () => {
  it("describes a range", () => {
    expect(amountRangeLabel(null, 99.99)).toMatch(/^up to R\$\s?99,99$/);
    expect(amountRangeLabel(100, null)).toMatch(/^from R\$\s?100,00$/);
    expect(amountRangeLabel(50, 80)).toMatch(/^R\$\s?50,00 to R\$\s?80,00$/);
    expect(amountRangeLabel(undefined, undefined)).toBe("");
  });

  it("parses pt-BR inputs, blank meaning no bound", () => {
    expect(parseAmountRange("1.000,50", "")).toEqual({ min_amount: 1000.5, max_amount: null });
    expect(parseAmountRange(" ", "80")).toEqual({ min_amount: null, max_amount: 80 });
    expect(parseAmountRange("x", "")).toBe("Amounts must be positive numbers, like 99,90.");
    expect(parseAmountRange("-5", "")).toBe("Amounts must be positive numbers, like 99,90.");
    expect(parseAmountRange("200", "100")).toBe("The minimum amount can't be above the maximum.");
  });

  it("formats a bound for an input", () => {
    expect(amountInputValue(99.9)).toBe("99,90");
    expect(amountInputValue(null)).toBe("");
  });
});
