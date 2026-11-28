import type { FinancialHealthReport, HealthTotals, SavingsReport } from "../types";

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
  savings: savingsReport(),
  ...overrides,
});

/** Oct 2024..Sep 2025, oldest first */
const months12 = (values: number[]) =>
  values.map((total, i) => {
    const date = new Date(2024, 9 + i, 1);
    return { month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`, total };
  });

/** Where you can save: one opportunity of each kind and two subscriptions. */
export const savingsReport = (overrides: Partial<SavingsReport> = {}): SavingsReport => ({
  period_months: 3,
  baseline_months: 10,
  current_range: { from: "2025-07-01", to: "2025-09-30" },
  baseline_range: { from: "2024-07-01", to: "2025-06-30" },
  summary: { potential_monthly: 344.17, potential_yearly: 4130.04, spending_now: 2000, spending_before: 1500, lowest_month: { month: "2024-10", total: 1200 } },
  opportunities: [
    {
      kind: "growing_merchant",
      name: "IFOOD *RESTAURANTE",
      query: "IFOOD *RESTAURANTE",
      subcategory: { id: 10, name: "Food", category: "Conforto", color_code: "#154360" },
      monthly_now: 330,
      monthly_before: 80,
      count_now: 6,
      count_before: 2,
      ticket_now: 55,
      ticket_before: 40,
      potential_monthly: 250,
      first_seen: "2024-09",
      series: months12([80, 80, 80, 80, 80, 80, 80, 80, 80, 330, 330, 330]),
    },
    {
      kind: "growing_subcategory",
      name: "Mercado",
      subcategory: { id: 11, name: "Mercado", category: "Contas", color_code: "#424949" },
      monthly_now: 500,
      monthly_before: 300,
      potential_monthly: 40,
      series: months12([300, 300, 300, 300, 300, 300, 300, 300, 300, 500, 500, 500]),
      top_merchants: [{ name: "SUPERMERCADO A", monthly: 300 }, { name: "MERCADINHO B", monthly: 40 }],
    },
    {
      kind: "frequent_small",
      name: "CAFE DA ESQUINA",
      query: "CAFE DA ESQUINA",
      subcategory: { id: 10, name: "Food", category: "Conforto", color_code: "#154360" },
      monthly_now: 120,
      count_now: 8,
      ticket_now: 15,
      potential_monthly: 40,
      first_seen: "2024-09",
      series: months12(Array(12).fill(120)),
    },
    {
      kind: "fees",
      name: null,
      monthly_now: 14.17,
      potential_monthly: 14.17,
      count_now: 0.7,
      series: months12([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 30, 12.5]),
      items: [{ name: "TARIFA PACOTE", total: 30, count: 1 }, { name: "IOF COMPRA", total: 12.5, count: 1 }],
    },
  ],
  subscriptions: {
    monthly: 66.8,
    yearly: 801.6,
    items: [
      { name: "STREAMFLIX", subcategory: { id: 12, name: "Assinaturas", category: "Lazer", color_code: "#641E16" }, monthly: 44.9, months: 6, last_charge: "2025-09-20", price_change: { from: 39.9, to: 44.9 } },
      { name: "MUSICA APP", subcategory: { id: 12, name: "Assinaturas", category: "Lazer", color_code: "#641E16" }, monthly: 21.9, months: 6, last_charge: "2025-09-12", price_change: null },
    ],
  },
  ...overrides,
});
