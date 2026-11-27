import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderCustomPieLabel } from "./chartHelper";
import { colorAt, formatBRL } from "./colors";
import { formatIsoDate, formatMonth } from "./dates";
import { categoryColors, compactBRL, delta, formatPct, OTHER_COLOR, periodLabel, relativeChange, shortMonth } from "./health";
import { formatCurrency, parseAmount } from "./formatter";
import { toCategoryChartData } from "./reports";
import { setCurrentLocale } from "../i18n/locale";

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

describe("dates", () => {
  it("formats ISO dates month-first in English and day-first in Portuguese", () => {
    expect(formatIsoDate("2025-03-02")).toBe("03/02/2025");
    expect(formatMonth("2025-03")).toBe("03/2025");
    expect(formatIsoDate("bad")).toBe("bad");

    setCurrentLocale("pt-BR");
    expect(formatIsoDate("2025-03-02")).toBe("02/03/2025");
  });
});

describe("health helpers", () => {
  it("assigns colors by category id, falling back to gray past the palette", () => {
    const colors = categoryColors([3, 1, 2, 4, 5, 6, 7].map((id) => ({ id, name: `C${id}` })));

    expect(colors.get(1)).toBe("#257de0");
    expect(colors.get(3)).toBe("#00b894");
    expect(colors.get(7)).toBe(OTHER_COLOR);
  });

  it("describes changes with direction and whether up is good", () => {
    expect(delta(0.123, true)).toEqual({ text: "↑ 12%", tone: "good", label: "up" });
    expect(delta(0.123, false).tone).toBe("bad");
    expect(delta(-0.5, false)).toEqual({ text: "↓ 50%", tone: "good", label: "down" });
    expect(delta(0.001, true).text).toBe("→ 0%");
    expect(delta(null, true).text).toBe("New");
    expect(relativeChange(150, 100)).toBe(0.5);
    expect(relativeChange(1, 0)).toBeNull();
  });

  it("formats months, periods, percentages and axis amounts", () => {
    expect(shortMonth("2025-09")).toBe("Sep 25");
    expect(periodLabel("2025-04-01", "2025-06-30")).toBe("Apr–Jun 25");
    expect(periodLabel("2024-11-01", "2025-10-31")).toBe("Nov 24 – Oct 25");
    expect(periodLabel("2025-06-01", "2025-06-30")).toBe("Jun 25");
    expect(formatPct(0.756)).toBe("76%");
    expect(formatPct(null)).toBe("—");
    expect(compactBRL(12345)).toBe("R$ 12.3k");
    expect(compactBRL(950)).toBe("R$ 950");
  });

  it("uses Portuguese month names, separators and words in Portuguese", () => {
    setCurrentLocale("pt-BR");

    expect(shortMonth("2025-09")).toBe("set 25");
    expect(periodLabel("2025-04-01", "2025-06-30")).toBe("abr–jun 25");
    expect(formatPct(0.7563, 1)).toBe("75,6%");
    expect(compactBRL(12345)).toBe("R$ 12,3 mil");
    expect(delta(null, true).text).toBe("Novo");
    expect(delta(0.2, true).label).toBe("subiu");
  });
});

