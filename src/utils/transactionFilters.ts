import type { TransactionSort } from "../types";

/** Every sort, in the order the sort menu lists them. The first is the API's default. */
export const TRANSACTION_SORTS: TransactionSort[] = [
  "date_desc",
  "date_asc",
  "amount_desc",
  "amount_asc",
  "name_asc",
  "name_desc",
  "category_asc",
  "category_desc",
];

export const DEFAULT_SORT: TransactionSort = "date_desc";

export const isTransactionSort = (value: unknown): value is TransactionSort =>
  TRANSACTION_SORTS.includes(value as TransactionSort);

/** The columns that sort when their header is clicked, and the direction each starts with. */
export const SORTABLE_COLUMNS = {
  date: { asc: "date_asc", desc: "date_desc", first: "desc" },
  name: { asc: "name_asc", desc: "name_desc", first: "asc" },
  category: { asc: "category_asc", desc: "category_desc", first: "asc" },
  amount: { asc: "amount_asc", desc: "amount_desc", first: "desc" },
} as const satisfies Record<string, { asc: TransactionSort; desc: TransactionSort; first: "asc" | "desc" }>;

export type SortableColumn = keyof typeof SORTABLE_COLUMNS;

/** "ascending" / "descending" when the list is sorted by this column, else undefined. */
export function columnSortState(column: SortableColumn, sort: TransactionSort): "ascending" | "descending" | undefined {
  const { asc, desc } = SORTABLE_COLUMNS[column];
  if (sort === asc) return "ascending";
  if (sort === desc) return "descending";
  return undefined;
}

/** The sort after clicking a column header: its usual direction first, then the other one. */
export function nextColumnSort(column: SortableColumn, sort: TransactionSort): TransactionSort {
  const options = SORTABLE_COLUMNS[column];
  const state = columnSortState(column, sort);
  if (state === "ascending") return options.desc;
  if (state === "descending") return options.asc;
  return options[options.first];
}

// ---- date ranges ------------------------------------------------------------------------------

/** ISO dates ("2025-03-01"); "" leaves that end open. */
export interface DateRange {
  from: string;
  to: string;
}

export const DATE_PRESETS = ["thisMonth", "lastMonth", "last3Months", "last12Months", "thisYear", "lastYear"] as const;
export type DatePreset = (typeof DATE_PRESETS)[number];

/** A local date as "YYYY-MM-DD" (not toISOString, which would shift to UTC). */
export const isoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const monthStart = (year: number, month: number) => isoDate(new Date(year, month, 1));
const monthEnd = (year: number, month: number) => isoDate(new Date(year, month + 1, 0));

/** "2025-03" → 2025-03-01..2025-03-31 */
export function monthRange(month: string): DateRange | null {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return null;
  const year = Number(match[1]);
  const index = Number(match[2]) - 1;
  if (index < 0 || index > 11) return null;
  return { from: monthStart(year, index), to: monthEnd(year, index) };
}

export function presetRange(preset: DatePreset, today = new Date()): DateRange {
  const y = today.getFullYear();
  const m = today.getMonth();
  switch (preset) {
    case "thisMonth":
      return { from: monthStart(y, m), to: monthEnd(y, m) };
    case "lastMonth":
      return { from: monthStart(y, m - 1), to: monthEnd(y, m - 1) };
    case "last3Months":
      return { from: monthStart(y, m - 2), to: monthEnd(y, m) };
    case "last12Months":
      return { from: monthStart(y, m - 11), to: monthEnd(y, m) };
    case "thisYear":
      return { from: `${y}-01-01`, to: `${y}-12-31` };
    case "lastYear":
      return { from: `${y - 1}-01-01`, to: `${y - 1}-12-31` };
  }
}

/**
 * The quick-range menu value that matches a range: "" for all dates, a preset, "month:YYYY-MM"
 * for one of the listed months, or "custom".
 */
export function rangeChoice(range: DateRange, months: string[], today = new Date()): string {
  if (!range.from && !range.to) return "";
  const same = (other: DateRange | null) => other !== null && other.from === range.from && other.to === range.to;
  const preset = DATE_PRESETS.find((key) => same(presetRange(key, today)));
  if (preset) return preset;
  const month = months.find((value) => same(monthRange(value)));
  return month ? `month:${month}` : "custom";
}

/** The range a quick-range menu value stands for (null for "custom": keep what's there). */
export function rangeForChoice(choice: string, today = new Date()): DateRange | null {
  if (choice === "") return { from: "", to: "" };
  if (choice.startsWith("month:")) return monthRange(choice.slice(6));
  if ((DATE_PRESETS as readonly string[]).includes(choice)) return presetRange(choice as DatePreset, today);
  return null;
}
