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
