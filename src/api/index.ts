import { apiRequest } from "./client";
import { clearSessionToken, currentSessionToken, setSessionToken } from "./session";
import type {
  CategorizationProgressMonth,
  CategorySuggestion,
  AssetValuation,
  ClaudeSettings,
  MarketOverview,
  MarketSettings,
  KeywordHealth,
  Reapply,
  RuleDecisionResult,
  RuleSuggestion,
  SuggestionRun,
  SuggestionsSummary,
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
  Profile,
  RecategorizeParams,
  RecategorizeResult,
  Subcategory,
  Transaction,
  TransactionFilters,
  TransactionsPage,
} from "../types";
import type { RawMonthlyStatement } from "../presenters/MonthlyStatementPresenter";
import type { RawSummaryLine } from "../presenters/SummaryLinePresenter";

export { ApiError, API_BASE_URL } from "./client";

export interface ProfileUpdate {
  name?: string;
  locale?: string;
  password?: string;
  remove_password?: boolean;
  current_password?: string;
}

/** The profile picker (no sign-in needed) and the signed-in profile. */
export const profilesApi = {
  list: () => apiRequest<Profile[]>("/profiles"),
  create: (profile: { name: string; password?: string; locale?: string }) =>
    apiRequest<Profile>("/profiles", { method: "POST", json: { profile } }),
  current: () => apiRequest<Profile>("/profile"),
  update: (profile: ProfileUpdate) => apiRequest<Profile>("/profile", { method: "PATCH", json: { profile } }),
};

/** Signing in keeps the session token in this browser; signing out drops it. */
export const sessionApi = {
  current: () => apiRequest<{ profile: Profile }>("/session"),
  signIn: async (profileId: number, password?: string) => {
    const result = await apiRequest<{ token: string; profile: Profile }>("/session", {
      method: "POST",
      json: { profile_id: profileId, ...(password ? { password } : {}) },
    });
    setSessionToken(result.token);
    return result.profile;
  },
  signOut: async () => {
    try {
      await apiRequest("/session", { method: "DELETE" });
    } finally {
      clearSessionToken();
    }
  },
  hasToken: () => currentSessionToken() !== null,
};

export const statementsApi = {
  list: () => apiRequest<RawMonthlyStatement[]>("/monthly_statements"),
  upload: (file: File) => {
    const body = new FormData();
    body.append("monthly_statement[file]", file);
    return apiRequest<{ statement: RawMonthlyStatement; summary_lines: RawSummaryLine[]; suggestion_run?: SuggestionRun | null }>(
      "/monthly_statements",
      {
        method: "POST",
        body,
      }
    );
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
  /** Deletes its subcategories and their rules too; their transactions move to the fallback. */
  remove: (id: number) => apiRequest(`/categories/${id}`, { method: "DELETE" }),
};

export const subcategoriesApi = {
  list: () => apiRequest<Subcategory[]>("/subcategories"),
  create: (subcategory: SubcategoryParams) =>
    apiRequest<Subcategory>("/subcategories", { method: "POST", json: { subcategory } }),
  update: (id: number, subcategory: SubcategoryParams) =>
    apiRequest<Subcategory>(`/subcategories/${id}`, { method: "PATCH", json: { subcategory } }),
  /** Deletes its rules too; its transactions move to the fallback subcategory. */
  remove: (id: number) => apiRequest(`/subcategories/${id}`, { method: "DELETE" }),
};

type KeywordParams = { name: string; subcategory_id: number; min_amount?: number | null; max_amount?: number | null };

export const keywordsApi = {
  list: () => apiRequest<Keyword[]>("/keywords"),
  create: (keyword: KeywordParams) => apiRequest<Keyword>("/keywords", { method: "POST", json: { keyword } }),
  update: (id: number, keyword: KeywordParams) =>
    apiRequest<Keyword>(`/keywords/${id}`, { method: "PATCH", json: { keyword } }),
  remove: (id: number) => apiRequest(`/keywords/${id}`, { method: "DELETE" }),
  health: () => apiRequest<KeywordHealth[]>("/keywords/health"),
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
  categorizationProgress: (months = 6) =>
    apiRequest<CategorizationProgressMonth[]>(`/reports/categorization_progress?months=${months}`),
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
  /** "no idea": keep it in Outros and stop suggesting for it */
  markUnknown: (id: number) => apiRequest<Transaction>(`/transactions/${id}/unknown`, { method: "POST" }),
  unmarkUnknown: (id: number) => apiRequest<Transaction>(`/transactions/${id}/unknown`, { method: "DELETE" }),
};

export const alertsApi = {
  list: (params: { month?: string; include_dismissed?: boolean } = {}) => apiRequest<AlertsResponse>(`/alerts${toQuery(params)}`),
  dismiss: (transactionId: number, kind: AlertKind) =>
    apiRequest("/alerts/dismiss", { method: "POST", json: { transaction_id: transactionId, kind } }),
  restore: (transactionId: number, kind: AlertKind) =>
    apiRequest("/alerts/dismiss", { method: "DELETE", json: { transaction_id: transactionId, kind } }),
};

export interface Preferences {
  locale: string;
  available_locales: string[];
}

export const settingsApi = {
  preferences: () => apiRequest<Preferences>("/settings/preferences"),
  updatePreferences: (preferences: { locale: string }) =>
    apiRequest<Preferences>("/settings/preferences", { method: "PUT", json: { preferences } }),
  claude: () => apiRequest<ClaudeSettings>("/settings/claude"),
  updateClaude: (claude: { api_key?: string; model?: string }) =>
    apiRequest<ClaudeSettings>("/settings/claude", { method: "PUT", json: { claude } }),
  removeClaudeKey: () => apiRequest<ClaudeSettings>("/settings/claude", { method: "DELETE" }),
  market: () => apiRequest<MarketSettings>("/settings/market"),
  updateMarket: (market: { brapi_token: string }) =>
    apiRequest<MarketSettings>("/settings/market", { method: "PUT", json: { market } }),
  removeBrapiToken: () => apiRequest<MarketSettings>("/settings/market", { method: "DELETE" }),
};

export const marketApi = {
  overview: () => apiRequest<MarketOverview>("/market"),
  assets: () => apiRequest<AssetValuation>("/market/assets"),
  /** Saves today's prices on the assets (all priced ones, or only `assetIds`). */
  applyAssetPrices: (assetIds?: number[]) =>
    apiRequest<AssetValuation>("/market/assets/apply", { method: "POST", json: assetIds ? { asset_ids: assetIds } : {} }),
};

export const suggestionsApi = {
  summary: () => apiRequest<SuggestionsSummary>("/suggestions/summary"),
  startRun: () => apiRequest<SuggestionRun>("/suggestion_runs", { method: "POST" }),
  categories: (params: { month?: string; min_confidence?: number } = {}) =>
    apiRequest<CategorySuggestion[]>(`/category_suggestions${toQuery(params)}`),
  acceptCategory: (id: number, subcategoryId?: number) =>
    apiRequest<CategorySuggestion>(`/category_suggestions/${id}/accept`, {
      method: "POST",
      json: subcategoryId ? { subcategory_id: subcategoryId } : {},
    }),
  rejectCategory: (id: number) => apiRequest<CategorySuggestion>(`/category_suggestions/${id}/reject`, { method: "POST" }),
  dontKnow: (id: number) => apiRequest<CategorySuggestion>(`/category_suggestions/${id}/dont_know`, { method: "POST" }),
  bulkAccept: (params: { min_confidence?: number; merchant_key?: string }) =>
    apiRequest<{ accepted_count: number }>("/category_suggestions/bulk_accept", { method: "POST", json: params }),
  rules: () => apiRequest<RuleSuggestion[]>("/rule_suggestions"),
  acceptRule: (
    id: number,
    params: { name?: string; subcategory_id?: number; min_amount?: number | null; max_amount?: number | null; reapply: Reapply }
  ) =>
    apiRequest<RuleDecisionResult>(`/rule_suggestions/${id}/accept`, { method: "POST", json: params }),
  rejectRule: (id: number) => apiRequest<RuleDecisionResult>(`/rule_suggestions/${id}/reject`, { method: "POST" }),
};
