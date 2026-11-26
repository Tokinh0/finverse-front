import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderCustomPieLabel } from "./chartHelper";
import { colorAt, formatBRL } from "./colors";
import { formatCurrency, parseAmount } from "./formatter";
import { toCategoryChartData } from "./reports";

describe("formatCurrency", () => {
  it("formats BRL in pt-BR", () => {
    expect(formatCurrency(1234.5).replace(/\s/g, " ")).toBe("R$ 1.234,50");
  });
});

describe("parseAmount", () => {
  it.each([
    ["1.234,56", 1234.56],
    ["1234.56", 1234.56],
    ["R$ 60,28", 60.28],
    ["42", 42],
  ])("parses %s", (input, expected) => {
    expect(parseAmount(input)).toBe(expected);
  });

  it("returns NaN for invalid input", () => {
    expect(parseAmount("")).toBeNaN();
    expect(parseAmount("abc")).toBeNaN();
  });
});

describe("colors", () => {
  it("prefers the given color and falls back to the palette", () => {
    expect(colorAt(0, "#123456")).toBe("#123456");
    expect(colorAt(9, null)).toBe("#00C49F");
    expect(formatBRL(2)).toBe("R$ 2.00");
    expect(formatBRL("x")).toBe("R$ x");
  });
});

describe("toCategoryChartData", () => {
  it("sums subcategory totals per category, largest first", () => {
    const data = toCategoryChartData({
      LAZER: { color_code: "#1", subcategories: { CINEMA: { total: 10, transactions: [] } } },
      CONFORTO: { color_code: "#2", subcategories: { FOOD: { total: 30, transactions: [] }, UBER: { total: 5, transactions: [] } } },
    });

    expect(data).toEqual([
      { name: "CONFORTO", total: 35, color: "#2" },
      { name: "LAZER", total: 10, color: "#1" },
    ]);
  });
});

describe("renderCustomPieLabel", () => {
  it("renders the name and percentage", () => {
    const label = renderCustomPieLabel({ cx: 100, cy: 100, midAngle: 0, outerRadius: 50, percent: 0.25, name: "FOOD" });
    const { container } = render(<svg>{label}</svg>);

    expect(container.querySelector("text")).toHaveTextContent("FOOD (25%)");
  });

  it("skips tiny slices", () => {
    expect(renderCustomPieLabel({ percent: 0.001, name: "X" })).toBeNull();
  });
});
