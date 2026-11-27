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
}

export interface RecategorizeResult {
  transaction: Transaction;
  keyword: Keyword | null;
  updated_count: number;
}
