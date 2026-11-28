import { describe, expect, it } from "vitest";
import { setCurrentLocale } from "../i18n/locale";
import { changeClass, direction, formatAsOf, formatChange, formatPercent, formatPoints, formatPrice, percentChange } from "./market";

describe("market utils", () => {
  it("formats prices in the Brazilian format, with more decimals when they're small", () => {
    const nb = "\u00a0";
    expect(formatPrice(331996)).toBe(`R$${nb}331.996,00`);
    expect(formatPrice(5.5582)).toBe(`R$${nb}5,5582`);
    expect(formatPrice(5.5)).toBe(`R$${nb}5,50`);
    expect(formatPrice(0.316848)).toBe(`R$${nb}0,3168`);
    expect(formatPrice(0.0000123)).toBe(`R$${nb}0,000012`);
    expect(formatPrice(59727, "USD")).toBe(`US$${nb}59.727,00`);
  });

  it("formats percentages and points in the app's language", () => {
    expect(formatPercent(13.75)).toBe("13.75%");
    setCurrentLocale("pt-BR");
    expect(formatPercent(13.75)).toBe("13,75%");
    expect(formatPoints(128456.7)).toBe("128.457");
  });

  it("shows the direction of a change with an arrow and a sign", () => {
    expect(formatChange(1.2)).toBe("▲ +1.20%");
    expect(formatChange(-0.8)).toBe("▼ −0.80%");
    expect(formatChange(0)).toBe("■ 0.00%");
    expect(direction(0.001)).toBe("flat");
    expect(changeClass(-3)).toBe("text-danger");
    expect(changeClass(3)).toBe("text-success");
  });

  it("formats date-only values without a time", () => {
    expect(formatAsOf("2026-11-26")).toBe("11/26/26");
    expect(formatAsOf("2026-11-27T21:35:00Z")).toMatch(/^11\/27\/26, /);
  });

  it("computes the change between two values", () => {
    expect(percentChange(100, 150)).toBe(50);
    expect(percentChange(0, 10)).toBeNull();
    expect(percentChange(null, 10)).toBeNull();
  });
});
