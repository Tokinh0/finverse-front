import type {
  Asset,
  CategorizationProgressMonth,
  Category,
  CategorySuggestion,
  Keyword,
  KeywordHealth,
  RuleSuggestion,
  Subcategory,
  SuggestionRun,
  SuggestionsSummary,
  Transaction,
  TransactionsPage,
} from "../types";

export const subcategory = (overrides: Partial<Subcategory> = {}): Subcategory => ({
  id: 10,
  name: "Food",
  color_code: "#ff0000",
  subcategory_type: "expense",
  category: { id: 1, name: "Conforto" },
  ...overrides,
});

export const category = (overrides: Partial<Category> = {}): Category => ({
  id: 1,
  name: "Conforto",
  color_code: "#000000",
  subcategories: [subcategory({ category: undefined })],
  ...overrides,
});

export const keyword = (overrides: Partial<Keyword> = {}): Keyword => ({
  id: 100,
  name: "IFOOD",
  subcategory_id: 10,
  subcategory: subcategory(),
  ...overrides,
});

export const asset = (overrides: Partial<Asset> = {}): Asset => ({
  id: 1,
  asset_type: "reserva",
  ticker: "CDB",
  description: "Reserva de emergência",
  current_value: 1500,
  rating: 5,
  quantity: 1,
  percent_by_type: 100,
  color_code: "#00ff00",
  ...overrides,
});

export const transaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 1000,
  name: "LANCHONETE EXEMPLO",
  parsed_name: "LANCHONETE_EXEMPLO",
  amount: 60.28,
  transaction_date: "2025-03-02",
  transaction_type: "debit",
  monthly_statement_id: 1,
  subcategory: { id: 99, name: "Outros", color_code: "#999999" },
  category: { id: 9, name: "Outros" },
  ...overrides,
});

export const transactionsPage = (transactions: Transaction[], meta: Partial<TransactionsPage["meta"]> = {}): TransactionsPage => ({
  transactions,
  meta: { total_count: transactions.length, total_amount: 60.28, page: 1, per_page: 50, months: ["2025-03", "2025-02"], ...meta },
});

export const categorySuggestion = (overrides: Partial<CategorySuggestion> = {}): CategorySuggestion => ({
  id: 500,
  origin: "ai",
  status: "pending",
  confidence: 0.87,
  reason: "Looks like a bakery",
  subcategory: { id: 10, name: "Food", color_code: "#ff0000" },
  category: { id: 1, name: "Conforto" },
  merchant_key: "LANCHONETE_EXEMPLO",
  transaction: transaction(),
  ...overrides,
});

export const suggestionRun = (overrides: Partial<SuggestionRun> = {}): SuggestionRun => ({
  id: 7,
  monthly_statement_id: 1,
  status: "succeeded",
  error_code: null,
  error_message: null,
  model: "claude-haiku-5-5",
  history_suggestions_count: 2,
  ai_suggestions_count: 5,
  rule_suggestions_count: 1,
  ai_requests_count: 1,
  input_tokens: 1800,
  output_tokens: 400,
  started_at: "2025-03-10T10:00:00Z",
  finished_at: "2025-03-10T10:00:05Z",
  created_at: "2025-03-10T10:00:00Z",
  ...overrides,
});

export const suggestionsSummary = (overrides: Partial<SuggestionsSummary> = {}): SuggestionsSummary => ({
  pending_count: 3,
  pending_category_count: 2,
  pending_rule_count: 1,
  claude_configured: true,
  latest_run: suggestionRun(),
  ...overrides,
});

export const ruleSuggestion = (overrides: Partial<RuleSuggestion> = {}): RuleSuggestion => ({
  id: 800,
  action: "create",
  origin: "ai",
  status: "pending",
  confidence: 0.93,
  reason: "Matches 12 transactions you put in Transport",
  keyword: null,
  proposed: { name: "UBER TRIP", subcategory: { id: 20, name: "Uber", category: "Transporte" } },
  preview: {
    counts: { uncategorized: 2, keyword: 1, kept: 1 },
    total: 3,
    matched: 4,
    transactions: [
      {
        id: 1,
        name: "UBER TRIP SP",
        amount: 25.5,
        transaction_date: "2025-03-02",
        categorization_source: "uncategorized",
        kept: false,
        from: { id: 99, name: "Outros", category: "Outros" },
        to: { id: 20, name: "Uber", category: "Transporte" },
      },
      {
        id: 2,
        name: "UBER TRIP RJ",
        amount: 30,
        transaction_date: "2025-02-11",
        categorization_source: "manual",
        kept: true,
        from: { id: 10, name: "Food", category: "Conforto" },
        to: { id: 20, name: "Uber", category: "Transporte" },
      },
    ],
  },
  created_at: "2025-03-10T10:00:05Z",
  ...overrides,
});

export const keywordHealth = (overrides: Partial<KeywordHealth> = {}): KeywordHealth => ({
  keyword_id: 100,
  matches: 12,
  overrides: 0,
  top_override_subcategory_id: null,
  overlapping_keyword_ids: [],
  flags: [],
  pending_suggestion_ids: [],
  ...overrides,
});

export const progressMonth = (month: string, counts: Partial<CategorizationProgressMonth["counts"]> = {}): CategorizationProgressMonth => {
  const full = { keyword: 0, ai_accepted: 0, manual: 0, uncategorized: 0, ...counts };
  const total = Object.values(full).reduce((a, b) => a + b, 0);
  return { month, total, counts: full, keyword_share: total ? full.keyword / total : null };
};

