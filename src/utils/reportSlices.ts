import { getLocale } from "../i18n/locale";
import type { CategoryReportEntry, SubcategoryReportEntry } from "../types";
import { colorAt } from "./colors";
import { numberLocale } from "./dates";

/** One transaction in a report breakdown. Dates are "dd/mm/yyyy"; `subcategory` is set in the category report. */
export interface ReportTransaction {
  name: string;
  transaction_date: string;
  amount: number;
  subcategory?: string;
}

/** A category or subcategory ready to chart: its total, color, share of the panel and transactions. */
export interface ReportSlice {
  name: string;
  total: number;
  color: string;
  percent: number;
  transactions: ReportTransaction[];
  /** Category report only: the subcategories that make up this slice, biggest first. */
  parts?: { name: string; total: number }[];
}

/** "dd/mm/yyyy" -> sortable timestamp */
export const parseBrDate = (date: string) => {
  const [day, month, year] = date.split("/").map(Number);
  return new Date(year, month - 1, day).getTime();
};

/** "dd/mm/yyyy" -> "mm/dd/yyyy" in English, unchanged in Portuguese */
export const displayDate = (date: string) => {
  const [day, month, year] = date.split("/");
  return getLocale() === "en" && year ? `${month}/${day}/${year}` : date;
};

/** "2026-10-09 00:00:00 UTC" (category report) -> "09/10/2026" */
export const isoToBrDate = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
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

/** Shares and biggest-first order; colors stay tied to the entry (its color_code), not to the rank. */
function finish(entries: Omit<ReportSlice, "percent">[]): ReportSlice[] {
  const sum = entries.reduce((acc, entry) => acc + entry.total, 0);
  return entries.map((entry) => ({ ...entry, percent: sum > 0 ? entry.total / sum : 0 })).sort((a, b) => b.total - a.total);
}

export function toSlices(data: SubcategoryReportEntry[]): ReportSlice[] {
  return finish(
    data.map((entry, index) => ({
      name: entry.name,
      total: Number(entry.total),
      color: colorAt(index, entry.color_code),
      transactions: entry.transactions.map((tx) => ({ ...tx, amount: Number(tx.amount) })),
    })),
  );
}

/** Category report: each category is the sum of its subcategories; transactions remember their subcategory. */
export function toCategorySlices(data: Record<string, CategoryReportEntry>): ReportSlice[] {
  return finish(
    Object.entries(data).map(([name, info], index) => {
      const subcategories = Object.entries(info.subcategories);
      return {
        name,
        total: subcategories.reduce((sum, [, sub]) => sum + Number(sub.total), 0),
        color: colorAt(index, info.color_code),
        parts: subcategories.map(([sub, value]) => ({ name: sub, total: Number(value.total) })).sort((a, b) => b.total - a.total),
        transactions: subcategories.flatMap(([sub, value]) =>
          value.transactions.map((tx) => ({
            name: tx.name,
            amount: Number(tx.amount),
            transaction_date: isoToBrDate(tx.transaction_date),
            subcategory: sub,
          })),
        ),
      };
    }),
  );
}

export const sumTotals = (slices: ReportSlice[]) => slices.reduce((acc, slice) => acc + slice.total, 0);

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
