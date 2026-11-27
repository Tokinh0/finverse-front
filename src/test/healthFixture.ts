import type { FinancialHealthReport, HealthTotals } from "../types";

const totals = (overrides: Partial<HealthTotals> = {}): HealthTotals => ({
  income: 2000,
  expenses: 500,
  invested: 400,
  net: 1500,
  savings_rate: 0.75,
  ...overrides,
});

export const healthReport = (overrides: Partial<FinancialHealthReport> = {}): FinancialHealthReport => ({
  as_of: "2025-09",
  period_months: 3,
  months_available: ["2025-09", "2025-08"],
  years_available: [2025, 2024],
  range: { from: "2025-07-01", to: "2025-09-30" },
  previous_range: { from: "2025-04-01", to: "2025-06-30" },
  summary: { current: totals(), previous: totals({ income: 1000, expenses: 100, net: 900, savings_rate: 0.9, invested: 0 }) },
  categories: [
    { id: 2, name: "Outros", color_code: null, total: 300, share: 0.6, previous_total: 100, change_pct: 2, subcategories: [{ id: 20, name: "Outros", total: 300 }] },
    { id: 1, name: "Conforto", color_code: null, total: 200, share: 0.4, previous_total: 0, change_pct: null, subcategories: [{ id: 10, name: "Food", total: 150 }, { id: 11, name: "Uber", total: 50 }] },
  ],
  trends: {
    months: ["2025-08", "2025-09"],
    totals: [100, 500],
    categories: [
      { id: 1, name: "Conforto", values: [100, 200], last_month: 200, previous_month: 100, average: 50, change_vs_previous_pct: 1, change_vs_average_pct: 3 },
      { id: 2, name: "Outros", values: [0, 300], last_month: 300, previous_month: 0, average: 0, change_vs_previous_pct: null, change_vs_average_pct: null },
    ],
  },
  year: {
    year: 2025,
    previous_year: 2024,
    months_with_data: 2,
    compared_through_month: 9,
    totals: totals(),
    previous_totals: totals({ expenses: 1000, income: 1000, savings_rate: 0 }),
    monthly: Array.from({ length: 12 }, (_, i) => ({
      ...totals({ expenses: i === 8 ? 450 : 50 }),
      month: i + 1,
      has_data: i === 7 || i === 8,
      previous_year_expenses: i === 8 ? 80 : null,
    })),
    best_month: { month: 9, net: 1750, income: 2000, expenses: 250 },
    worst_month: { month: 8, net: -250, income: 0, expenses: 250 },
    categories: [{ id: 1, name: "Conforto", total: 350, previous_total: 80, change_pct: 3.375 }],
    top_merchants: [{ name: "IFOOD 123", total: 300, count: 2, subcategory: "Food" }],
  },
  ...overrides,
});
