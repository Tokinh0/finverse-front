// Example data and explanations for the Suggestions page guide. Everything here is made up:
// the guide never shows the owner's real transactions.
import { messages } from "../i18n/locale";
import type { CategorizationProgressMonth, CategorySuggestion, RuleSuggestion, SuggestionsSummary, Transaction } from "../types";

export interface GuideStep {
  /** matches a data-guide attribute in the example UI */
  target: string;
  title: string;
  text: string;
}

const month = (key: string, keyword: number, accepted: number, manual: number, open: number): CategorizationProgressMonth => {
  const total = keyword + accepted + manual + open;
  return { month: key, total, counts: { keyword, ai_accepted: accepted, manual, uncategorized: open }, keyword_share: keyword / total };
};

export const GUIDE_PROGRESS = [month("2025-01", 60, 5, 10, 25), month("2025-02", 70, 8, 7, 15), month("2025-03", 82, 9, 6, 3)];

export const GUIDE_SUMMARY: SuggestionsSummary = {
  pending_count: 4,
  pending_category_count: 3,
  pending_rule_count: 1,
  claude_configured: true,
  latest_run: {
    id: 1,
    monthly_statement_id: 1,
    status: "succeeded",
    error_code: null,
    error_message: null,
    model: "claude-haiku-5-5",
    history_suggestions_count: 2,
    ai_suggestions_count: 3,
    rule_suggestions_count: 1,
    ai_requests_count: 1,
    input_tokens: 1800,
    output_tokens: 300,
    started_at: "2025-03-10T10:00:00Z",
    finished_at: "2025-03-10T10:00:04Z",
    created_at: "2025-03-10T10:00:00Z",
  },
};

const transport = { id: 2, name: "Aplicativo", category: "Transporte" };

const GUIDE_RULE: RuleSuggestion = {
  id: 1,
  action: "create",
  origin: "ai",
  status: "pending",
  confidence: 0.93,
  reason: null, // filled in the current language by guideRule()
  keyword: null,
  proposed: { name: "CORRIDA APP", subcategory: transport },
  preview: { counts: { uncategorized: 4, keyword: 0, kept: 2 }, total: 4, matched: 6, transactions: [] },
  created_at: "2025-03-10T10:00:04Z",
};

const transaction = (id: number, name: string, date: string, amount: number): Transaction => ({
  id,
  name,
  parsed_name: name.toUpperCase().replace(/\s+/g, "_"),
  amount,
  transaction_date: date,
  transaction_type: "debit",
  monthly_statement_id: 1,
  subcategory: { id: 99, name: "Outros" },
  category: { id: 9, name: "Outros" },
});

const suggestion = (id: number, t: Transaction): CategorySuggestion => ({
  id,
  origin: "ai",
  status: "pending",
  confidence: 0.91,
  reason: null, // filled in the current language by guideCategorySuggestions()
  subcategory: { id: 3, name: "Padaria", color_code: "#f2a600" },
  category: { id: 1, name: "Alimentação" },
  merchant_key: "PADARIA_EXEMPLO",
  transaction: t,
});

const GUIDE_CATEGORY_SUGGESTIONS: CategorySuggestion[] = [
  suggestion(1, transaction(1, "PADARIA EXEMPLO", "2025-03-14", 18.5)),
  suggestion(2, transaction(2, "PADARIA EXEMPLO", "2025-03-07", 23.9)),
  suggestion(3, transaction(3, "PADARIA EXEMPLO", "2025-03-02", 12)),
];

/** The guide's steps in the current language. */
export const rulesSteps = (): GuideStep[] => messages().suggestions.guide.rulesSteps;
export const transactionsSteps = (): GuideStep[] => messages().suggestions.guide.transactionsSteps;

export const guideRule = (): RuleSuggestion => ({ ...GUIDE_RULE, reason: messages().suggestions.guide.example.ruleReason });

export const guideCategorySuggestions = (): CategorySuggestion[] =>
  GUIDE_CATEGORY_SUGGESTIONS.map((s) => ({ ...s, reason: messages().suggestions.guide.example.suggestionReason }));

