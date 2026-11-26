import type { CategoryReportEntry } from "../types";

/** One chart point per category (sum of its subcategory totals), largest first. */
export function toCategoryChartData(data: Record<string, CategoryReportEntry>) {
  return Object.entries(data)
    .map(([category, info]) => ({
      name: category,
      total: Object.values(info.subcategories).reduce((sum, sub) => sum + Number(sub.total), 0),
      color: info.color_code,
    }))
    .sort((a, b) => b.total - a.total);
}
