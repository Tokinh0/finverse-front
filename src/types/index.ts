// Shapes of the JSON returned by the Finverse API (see finverse/app/presenters).

export type SubcategoryType = "gain" | "expense" | "investment" | "transfer" | "other";

export interface CategorySummary {
  id: number;
  name: string;
  color_code?: string | null;
}

export interface Subcategory {
  id: number;
  name: string;
  color_code?: string | null;
  subcategory_type?: SubcategoryType | "" | null;
  category?: CategorySummary | null;
}

export interface Category extends CategorySummary {
  subcategories: Subcategory[];
}

export interface Keyword {
  id: number;
  name: string;
  parsed_name?: string;
  subcategory_id: number;
  description?: string | null;
  color_code?: string | null;
  keyword_type?: string | null;
  /** optional amount range (BRL, inclusive); the rule only applies inside it */
  min_amount?: number | null;
  max_amount?: number | null;
  subcategory?: Subcategory | null;
}

/** Asset type enum key => display label, e.g. { reserva: "Reserva" }. */
export type AssetTypes = Record<string, string>;

export interface Asset {
  id: number;
  asset_type: string;
  ticker: string;
  description: string;
  current_value: number;
  rating: number;
  quantity: number;
  percent_by_type: number;
  color_code?: string | null;
}

export interface PortfolioSlice {
  name: string;
  value: number;
  percentage: string;
  color?: string | null;
}

export interface PortfolioDashboardData {
  assets: Asset[];
  asset_types: AssetTypes;
  portfolioData: PortfolioSlice[];
}

// GET /reports/monthly_by_category
export interface CategoryReportTransaction {
  name: string;
  amount: number;
  transaction_date: string;
  transaction_type: string;
}

export interface CategoryReportEntry {
  color_code?: string | null;
  subcategories: Record<string, { total: number; transactions: CategoryReportTransaction[] }>;
}

/** month ("YYYY-MM") => category parsed_name => entry */
export type MonthlyByCategoryReport = Record<string, Record<string, CategoryReportEntry>>;

// GET /reports/monthly_by_subcategory
export interface SubcategoryReportEntry {
  name: string;
  total: number;
  color_code?: string | null;
  transactions: { name: string; transaction_date: string; amount: number }[];
}

export interface SubcategoryMonth {
  subcategories: SubcategoryReportEntry[];
  total: number;
  total_invested: number;
  total_transfered: number;
  total_expended: number;
  total_received: number;
}

/** month ("YYYY-MM") => totals */
export type MonthlyBySubcategoryReport = Record<string, SubcategoryMonth>;

export interface CreditDebitReport<T> {
  credit: T;
  debit: T;
}

// GET /transactions
export type TransactionType = "credit" | "debit" | "unknown";

/** How a transaction got its subcategory. "uncategorized" = still in the Outros fallback. */
export type CategorizationSource = "keyword" | "ai_accepted" | "manual" | "uncategorized";

export interface Transaction {
  id: number;
  name: string;
  parsed_name: string;
  description?: string | null;
  amount: number;
  /** "YYYY-MM-DD" */
  transaction_date: string;
  transaction_type: TransactionType;
  monthly_statement_id: number;
  subcategory: { id: number; name: string; color_code?: string | null } | null;
  category: { id: number; name: string; color_code?: string | null } | null;
  categorization_source?: CategorizationSource;
  keyword_id?: number | null;
  /** the owner said "no idea": stays in Outros, gets no more suggestions */
  unknown_marked?: boolean;
  pending_suggestion?: CategorySuggestion | null;
}

export interface TransactionsPage {
  transactions: Transaction[];
  meta: {
    total_count: number;
    total_amount: number;
    page: number;
    per_page: number;
    /** months that have transactions, "YYYY-MM", newest first */
    months: string[];
  };
}

export interface TransactionFilters {
  month?: string;
  category_id?: string;
  subcategory_id?: string;
  transaction_type?: string;
  q?: string;
  /** "true": only transactions marked "no idea" */
  unknown?: string;
  page?: number;
  per_page?: number;
}

export interface RecategorizeParams {
  subcategory_id?: number;
  transaction_type?: TransactionType;
  /** create this keyword for the new subcategory */
  keyword?: string;
  /** re-run matching on other transactions containing the keyword */
  apply_to_matching?: boolean;
  /** why the owner made this change; Claude reads it when suggesting for similar transactions */
  reason?: string;
  /** amount range for the new keyword (null = no bound) */
  min_amount?: number | null;
  max_amount?: number | null;
}

export interface RecategorizeResult {
  transaction: Transaction;
  keyword: Keyword | null;
  updated_count: number;
  /** a pre-filled rule suggestion when this fix made the merchant reach the correction threshold */
  rule_nudge?: RuleSuggestion | null;
}

// GET /alerts
export type AlertKind = "duplicate" | "new_merchant" | "amount_changed" | "unusual_amount";

export interface ChargeAlert {
  kind: AlertKind;
  message: string;
  details: { related_transaction_id?: number; expected_amount?: number };
  dismissed: boolean;
  transaction: Transaction;
}

export interface AlertsResponse {
  /** "YYYY-MM", or null when there are no transactions */
  month: string | null;
  alerts: ChargeAlert[];
}

// GET /reports/financial_health
export interface HealthTotals {
  income: number;
  expenses: number;
  invested: number;
  net: number;
  /** net / income, null without income */
  savings_rate: number | null;
}

export interface HealthCategoryRef {
  id: number;
  name: string;
  color_code?: string | null;
}

export interface HealthCategory extends HealthCategoryRef {
  total: number;
  share: number;
  previous_total: number;
  change_pct: number | null;
  subcategories: { id: number; name: string; total: number }[];
}

export interface HealthTrendCategory extends HealthCategoryRef {
  values: number[];
  last_month: number;
  previous_month: number;
  average: number;
  change_vs_previous_pct: number | null;
  change_vs_average_pct: number | null;
}

export interface HealthYearMonth extends HealthTotals {
  month: number;
  has_data: boolean;
  previous_year_expenses: number | null;
}

export interface HealthYear {
  year: number;
  previous_year: number;
  months_with_data: number;
  /** previous-year figures cover January through this month */
  compared_through_month: number;
  totals: HealthTotals;
  previous_totals: HealthTotals | null;
  monthly: HealthYearMonth[];
  best_month: { month: number; net: number; income: number; expenses: number } | null;
  worst_month: { month: number; net: number; income: number; expenses: number } | null;
  categories: (HealthCategoryRef & { total: number; previous_total: number; change_pct: number | null })[];
  top_merchants: { name: string; total: number; count: number; subcategory: string }[];
}

export interface FinancialHealthReport {
  as_of: string | null;
  period_months: number;
  months_available: string[];
  years_available: number[];
  range?: { from: string; to: string };
  previous_range?: { from: string; to: string };
  summary?: { current: HealthTotals; previous: HealthTotals };
  categories?: HealthCategory[];
  trends?: { months: string[]; totals: number[]; categories: HealthTrendCategory[] };
  year?: HealthYear;
}

// Categorization suggestions (see finverse/app/presenters/*suggestion*_presenter.rb)
/** "dismissed": the owner answered "no idea" (not a rejection of the subcategory) */
export type SuggestionStatus = "pending" | "accepted" | "rejected" | "dismissed" | "superseded";

export interface CategorySuggestion {
  id: number;
  /** "history": the owner already categorized this merchant; "ai": Claude */
  origin: "history" | "ai";
  status: SuggestionStatus;
  /** 0..1 */
  confidence: number;
  reason: string | null;
  subcategory: { id: number; name: string; color_code?: string | null };
  category: { id: number; name: string; color_code?: string | null };
  merchant_key: string;
  /** present in GET /category_suggestions, absent when nested in a transaction */
  transaction?: Transaction;
}

export type SuggestionRunStatus = "queued" | "running" | "succeeded" | "failed";

export interface SuggestionRun {
  id: number;
  monthly_statement_id: number | null;
  status: SuggestionRunStatus;
  error_code: string | null;
  error_message: string | null;
  model: string | null;
  history_suggestions_count: number;
  ai_suggestions_count: number;
  rule_suggestions_count: number;
  ai_requests_count: number;
  input_tokens: number;
  output_tokens: number;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface SuggestionsSummary {
  pending_count: number;
  pending_category_count: number;
  pending_rule_count: number;
  claude_configured: boolean;
  latest_run: SuggestionRun | null;
}

export interface SubcategoryRef {
  id: number;
  name: string;
  category: string;
  color_code?: string | null;
}

export interface RulePreviewRow {
  id: number;
  name: string;
  amount: number;
  transaction_date: string;
  categorization_source: CategorizationSource;
  /** the owner's own decision: the rule leaves it alone */
  kept: boolean;
  from: SubcategoryRef | null;
  to: SubcategoryRef | null;
}

export interface RulePreview {
  counts: { uncategorized: number; keyword: number; kept: number };
  /** transactions re-applying to "all" would move */
  total: number;
  /** transactions the rule would be the best match for */
  matched: number;
  transactions: RulePreviewRow[];
}

export type RuleAction = "create" | "update" | "delete";
export type Reapply = "none" | "uncategorized" | "all";

export interface RuleSuggestion {
  id: number;
  action: RuleAction;
  /** "local": the app's own heuristics; "ai": Claude */
  origin: "local" | "ai";
  status: SuggestionStatus;
  confidence: number;
  reason: string | null;
  /** the existing rule (update/delete) */
  keyword: { id: number; name: string; subcategory: SubcategoryRef | null; min_amount?: number | null; max_amount?: number | null } | null;
  /** the rule after the change (create/update) */
  proposed: { name: string; subcategory: SubcategoryRef | null; min_amount?: number | null; max_amount?: number | null } | null;
  /** only while pending */
  preview: RulePreview | null;
  created_at: string;
}

export interface RuleDecisionResult {
  suggestion: RuleSuggestion;
  keyword: Keyword | null;
  updated_count: number;
}

export type KeywordHealthFlag = "overridden" | "unused" | "overlapping";

export interface KeywordHealth {
  keyword_id: number;
  matches: number;
  overrides: number;
  top_override_subcategory_id: number | null;
  overlapping_keyword_ids: number[];
  flags: KeywordHealthFlag[];
  pending_suggestion_ids: number[];
}

export interface CategorizationProgressMonth {
  /** "YYYY-MM" */
  month: string;
  total: number;
  counts: Record<CategorizationSource, number>;
  /** share categorized by keyword rules, null without transactions */
  keyword_share: number | null;
}

export interface ClaudeSettings {
  configured: boolean;
  /** e.g. "sk-ant-…a1B2"; the key itself never leaves the API */
  masked_key: string | null;
  model: string;
  default_model: string;
  /** set when the key was saved but couldn't be checked */
  warning?: string | null;
}

/** A person using the account (ProfilePresenter). */
export interface Profile {
  id: number;
  name: string;
  color_code: string | null;
  locale: string;
  password_protected: boolean;
}

// Market (GET /market, GET /market/assets, /settings/market)
export type MarketQuoteError = "unavailable" | "needs_token";

export interface MarketQuote {
  key: string;
  price?: number;
  currency?: string | null;
  change_pct?: number | null;
  as_of?: string | null;
  source?: string;
  unit?: "currency" | "percent";
  /** Crypto only: the price in US dollars and its 24h change. */
  price_usd?: number | null;
  change_pct_usd?: number | null;
  error?: MarketQuoteError;
}

export interface MarketGroup {
  key: "currencies" | "crypto" | "brazil";
  quotes: MarketQuote[];
}

export interface MarketOverview {
  groups: MarketGroup[];
  brapi_configured: boolean;
  generated_at: string;
}

export type AssetPriceStatus =
  | "priced"
  | "not_found"
  | "manual"
  | "no_ticker"
  | "no_quantity"
  | "needs_token"
  | "unavailable";

export interface AssetValuationRow {
  id: number;
  ticker: string | null;
  description: string | null;
  asset_type: string | null;
  asset_type_label: string | null;
  quantity: number | null;
  saved_unit_price: number | null;
  saved_value: number | null;
  status: AssetPriceStatus;
  unit_price: number | null;
  live_value: number | null;
  quote_currency: string | null;
  change_pct: number | null;
  as_of: string | null;
  source: string | null;
}

export interface AssetValuation {
  assets: AssetValuationRow[];
  totals: { priced_count: number; saved_value: number; live_value: number };
  brapi_configured: boolean;
  usd_brl: number | null;
  updated_count?: number;
}

export interface MarketSettings {
  brapi_configured: boolean;
  masked_brapi_token: string | null;
  brapi_from_env: boolean;
}
