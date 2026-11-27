import { messages } from "../i18n/locale";
import type { HealthCategoryRef } from "../types";
import { numberLocale } from "./dates";

/**
 * Validated categorical palette (light surface), in its fixed, CVD-safe slot order.
 * Slots 2-5 sit under 3:1 contrast on white, so every chart using them also has a legend and a table.
 */
export const SERIES_COLORS = ["#257de0", "#f47230", "#00b894", "#f2a600", "#ee7fac", "#6a4ce2"];
export const OTHER_COLOR = "#9a9a9a";

export const INK = {
  primary: "#191919",
  secondary: "#666666",
  grid: "#e7e7e7",
  axis: "#c2c2c2",
  surface: "#ffffff",
  good: "#006c10",
  bad: "#b42324",
};

/**
 * Color follows the category, never its rank: slots are assigned by category id, so a category
 * keeps its color across sections and when the period changes. Past the palette, categories share gray.
 */
export function categoryColors(categories: HealthCategoryRef[]) {
  const ids = [...new Set(categories.map((c) => c.id))].sort((a, b) => a - b);
  return new Map(ids.map((id, index) => [id, SERIES_COLORS[index] ?? OTHER_COLOR]));
}

/** Short month names in the current language ("Jan".."Dec" / "jan".."dez"). */
export const monthNames = () => messages().months;

/** "2025-09" -> "Sep 25" */
export const shortMonth = (key: string) => {
  const [year, month] = key.split("-");
  return `${monthNames()[Number(month) - 1]} ${year.slice(2)}`;
};

/** 12345 -> "R$ 12,3 mil", 950 -> "R$ 950" (axis ticks) */
export const compactBRL = (value: number) =>
  Math.abs(value) >= 1000
    ? `R$ ${(value / 1000).toLocaleString(numberLocale(), { maximumFractionDigits: 1 })}${messages().health.thousand}`
    : `R$ ${Math.round(value)}`;

/** 0.1234 -> "12%", null -> "—" */
export const formatPct = (value: number | null | undefined, digits = 0) =>
  value === null || value === undefined ? "—" : `${(value * 100).toLocaleString(numberLocale(), { maximumFractionDigits: digits })}%`;

export interface Delta {
  /** "↑ 12%" / "↓ 3%" / "New" / "—" */
  text: string;
  /** visually good, bad or neutral given whether up is good for this measure */
  tone: "good" | "bad" | "neutral";
  label: string;
}

/** Relative change; up is good for income/net/invested, bad for spending. */
export function delta(change: number | null, upIsGood: boolean, hadPrevious = true): Delta {
  const words = messages().health.delta;
  if (change === null) {
    return { text: hadPrevious ? words.new : "—", tone: "neutral", label: hadPrevious ? words.noSpendingBefore : words.noPreviousData };
  }
  const rounded = Math.round(change * 100);
  if (rounded === 0) return { text: "→ 0%", tone: "neutral", label: words.unchanged };
  const up = rounded > 0;
  return {
    text: `${up ? "↑" : "↓"} ${Math.abs(rounded)}%`,
    tone: up === upIsGood ? "good" : "bad",
    label: up ? words.up : words.down,
  };
}

export const relativeChange = (current: number, previous: number) => (previous > 0 ? (current - previous) / previous : null);

/** "2026-05-01".."2026-07-31" -> "May–Jul 26"; a single month -> "Jul 26" */
export function periodLabel(from: string, to: string) {
  const start = shortMonth(from.slice(0, 7));
  const end = shortMonth(to.slice(0, 7));
  if (start === end) return end;
  return start.slice(-2) === end.slice(-2) ? `${start.slice(0, 3)}–${end}` : `${start} – ${end}`;
}
