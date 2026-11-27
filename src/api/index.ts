import { apiRequest } from "./client";
import type {
  AlertKind,
  AlertsResponse,
  Asset,
  Category,
  CreditDebitReport,
  FinancialHealthReport,
  Keyword,
  MonthlyByCategoryReport,
  MonthlyBySubcategoryReport,
  PortfolioDashboardData,
  RecategorizeParams,
  RecategorizeResult,
  Subcategory,
  TransactionFilters,
  TransactionsPage,
} from "../types";
import type { RawMonthlyStatement } from "../presenters/MonthlyStatementPresenter";
import type { RawSummaryLine } from "../presenters/SummaryLinePresenter";

export { ApiError, API_BASE_URL } from "./client";

export const statementsApi = {
  list: () => apiRequest<RawMonthlyStatement[]>("/monthly_statements"),
  upload: (file: File) => {
    const body = new FormData();
    body.append("monthly_statement[file]", file);
    return apiRequest<{ statement: RawMonthlyStatement; summary_lines: RawSummaryLine[] }>("/monthly_statements", {
      method: "POST",
      body,
    });
  },
  remove: (id: number) => apiRequest(`/monthly_statements/${id}`, { method: "DELETE" }),
};

type CategoryParams = Pick<Category, "name" | "color_code">;
type SubcategoryParams = Pick<Subcategory, "name" | "color_code" | "subcategory_type"> & { category_id: number };

export const categoriesApi = {
  list: () => apiRequest<Category[]>("/categories"),
  create: (category: CategoryParams) => apiRequest<Category>("/categories", { method: "POST", json: { category } }),
  update: (id: number, category: CategoryParams) =>
    apiRequest<Category>(`/categories/${id}`, { method: "PATCH", json: { category } }),
};

export const subcategoriesApi = {
  list: () => apiRequest<Subcategory[]>("/subcategories"),
  create: (subcategory: SubcategoryParams) =>
    apiRequest<Subcategory>("/subcategories", { method: "POST", json: { subcategory } }),
  update: (id: number, subcategory: SubcategoryParams) =>
    apiRequest<Subcategory>(`/subcategories/${id}`, { method: "PATCH", json: { subcategory } }),
};

type KeywordParams = { name: string; subcategory_id: number };

export const keywordsApi = {
  list: () => apiRequest<Keyword[]>("/keywords"),
  create: (keyword: KeywordParams) => apiRequest<Keyword>("/keywords", { method: "POST", json: { keyword } }),
  update: (id: number, keyword: KeywordParams) =>
    apiRequest<Keyword>(`/keywords/${id}`, { method: "PATCH", json: { keyword } }),
  remove: (id: number) => apiRequest(`/keywords/${id}`, { method: "DELETE" }),
};

export type AssetParams = Pick<Asset, "asset_type" | "ticker" | "description" | "rating" | "quantity"> & {
  current_value: number;
};

export const assetsApi = {
  dashboard: () => apiRequest<PortfolioDashboardData>("/portfolio_dashboard"),
  create: (asset: AssetParams) => apiRequest<Asset>("/assets", { method: "POST", json: { asset } }),
  update: (id: number, asset: AssetParams) => apiRequest<Asset>(`/assets/${id}`, { method: "PATCH", json: { asset } }),
  remove: (id: number) => apiRequest(`/assets/${id}`, { method: "DELETE" }),
};

export const reportsApi = {
  financialHealth: (params: { period?: number; as_of?: string; year?: number } = {}) =>
    apiRequest<FinancialHealthReport>(`/reports/financial_health${toQuery(params)}`),
  monthlyByCategory: () => apiRequest<CreditDebitReport<MonthlyByCategoryReport>>("/reports/monthly_by_category"),
  monthlyBySubcategory: () =>
    apiRequest<CreditDebitReport<MonthlyBySubcategoryReport>>("/reports/monthly_by_subcategory"),
};

/** Builds "?a=1&b=2" from the non-empty values. */
export function toQuery(params: object) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

export const transactionsApi = {
  list: (filters: TransactionFilters = {}) => apiRequest<TransactionsPage>(`/transactions${toQuery(filters)}`),
  recategorize: (id: number, transaction: RecategorizeParams) =>
    apiRequest<RecategorizeResult>(`/transactions/${id}`, { method: "PATCH", json: { transaction } }),
};

export const alertsApi = {
  list: (params: { month?: string; include_dismissed?: boolean } = {}) => apiRequest<AlertsResponse>(`/alerts${toQuery(params)}`),
  dismiss: (transactionId: number, kind: AlertKind) =>
    apiRequest("/alerts/dismiss", { method: "POST", json: { transaction_id: transactionId, kind } }),
  restore: (transactionId: number, kind: AlertKind) =>
    apiRequest("/alerts/dismiss", { method: "DELETE", json: { transaction_id: transactionId, kind } }),
};
