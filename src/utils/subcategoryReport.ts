import { getLocale } from "../i18n/locale";
import type { SubcategoryReportEntry } from "../types";
import { colorAt } from "./colors";
import { numberLocale } from "./dates";

export type ReportTransaction = SubcategoryReportEntry["transactions"][number];

/** A subcategory ready to chart: numeric total, its color and its share of the panel total. */
export interface SubcategorySlice extends SubcategoryReportEntry {
  color: string;
  percent: number;
}

/** "dd/mm/yyyy" (as sent by the API) -> sortable timestamp */
export const parseBrDate = (date: string) => {
  const [day, month, year] = date.split("/").map(Number);
  return new Date(year, month - 1, day).getTime();
};

/** "dd/mm/yyyy" -> "mm/dd/yyyy" in English, unchanged in Portuguese */
export const displayDate = (date: string) => {
  const [day, month, year] = date.split("/");
  return getLocale() === "en" && year ? `${month}/${day}/${year}` : date;
};

/** Statement names come with underscores and repeated spaces; show them as plain words. */
export const cleanName = (name: string) => name.replace(/_/g, " ").replace(/\s+/g, " ").trim();

/** "2026-10" -> "October 2026" / "Outubro de 2026" */
export const longMonth = (month: string) => {
  const [year, m] = month.split("-").map(Number);
  if (!year || !m) return month;
  const label = new Date(year, m - 1, 1).toLocaleDateString(numberLocale(), { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

/** Biggest first; colors stay tied to the subcategory (its color_code), not to the rank. */
export function toSlices(data: SubcategoryReportEntry[]): SubcategorySlice[] {
  const withTotals = data.map((entry, index) => ({
    ...entry,
    total: Number(entry.total),
    color: colorAt(index, entry.color_code),
  }));
  const sum = withTotals.reduce((acc, entry) => acc + entry.total, 0);
  return withTotals
    .map((entry) => ({ ...entry, percent: sum > 0 ? entry.total / sum : 0 }))
    .sort((a, b) => b.total - a.total);
}

export type TransactionSort = "date" | "amount";

export function sortTransactions(transactions: ReportTransaction[], sort: TransactionSort) {
  return [...transactions].sort((a, b) =>
    sort === "amount" ? b.amount - a.amount : parseBrDate(a.transaction_date) - parseBrDate(b.transaction_date),
  );
}

/** Amount tiers used to flag the transactions worth a second look. */
export const amountTier = (amount: number): "high" | "medium" | "normal" =>
  amount > 300 ? "high" : amount > 100 ? "medium" : "normal";

export const formatPercent = (percent: number) =>
  `${(percent * 100).toLocaleString(numberLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
