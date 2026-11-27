// Example data and explanations for the Suggestions page guide. Everything here is made up:
// the guide never shows the owner's real transactions.
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

export const GUIDE_RULE: RuleSuggestion = {
  id: 1,
  action: "create",
  origin: "ai",
  status: "pending",
  confidence: 0.93,
  reason: "Recurring ride app you always put in Transporte",
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
  reason: "Bakery names usually go to Alimentação",
  subcategory: { id: 3, name: "Padaria", color_code: "#f2a600" },
  category: { id: 1, name: "Alimentação" },
  merchant_key: "PADARIA_EXEMPLO",
  transaction: t,
});

export const GUIDE_CATEGORY_SUGGESTIONS: CategorySuggestion[] = [
  suggestion(1, transaction(1, "PADARIA EXEMPLO", "2025-03-14", 18.5)),
  suggestion(2, transaction(2, "PADARIA EXEMPLO", "2025-03-07", 23.9)),
  suggestion(3, transaction(3, "PADARIA EXEMPLO", "2025-03-02", 12)),
];

export const RULES_STEPS: GuideStep[] = [
  { target: "progress", title: "Progress", text: "How each month's transactions got their category: by your rules, by accepting a suggestion, by hand, or not yet. The bigger the blue part, the less you have to review." },
  { target: "status", title: "Last run", text: "What the last suggestion run did and whether it failed. \"Suggest again\" runs it for everything still uncategorized." },
  { target: "tabs", title: "Rules and Transactions", text: "Rule suggestions make future imports automatic. Transaction suggestions fix what's already imported." },
  { target: "rule", title: "The proposed rule", text: "New, changed or removed keyword rule: descriptions containing the keyword go to the subcategory shown." },
  { target: "confidence", title: "Confidence and source", text: "How sure the suggestion is, and whether it came from Claude or from your own corrections." },
  { target: "reason", title: "Why", text: "A short reason for the suggestion." },
  { target: "impact", title: "Impact preview", text: "Which transactions the rule would match, computed with your real rules. \"Show affected transactions\" lists them with date, amount and where they'd move." },
  { target: "reapply", title: "Apply to", text: "What the rule should categorize right away. Transactions you categorized yourself are never moved." },
  { target: "rule-actions", title: "Decide", text: "Accept, edit the keyword or subcategory first, or reject. A rejected rule isn't suggested again unless your data changes a lot." },
];

export const TRANSACTIONS_STEPS: GuideStep[] = [
  { target: "bulk-bar", title: "Bulk accept", text: "Accept every suggestion at or above a confidence in one click." },
  { target: "merchant", title: "Merchant", text: "Suggestions are grouped by merchant, with how many transactions and their total." },
  { target: "suggested", title: "Suggested subcategory", text: "The dashed outline means it's only a suggestion: nothing changes until you accept." },
  { target: "confidence", title: "Confidence", text: "How likely it is that you'd pick this subcategory." },
  { target: "origin", title: "Source", text: "Claude, or your history (you already categorized this merchant before, no API call). Reasons you write when re-categorizing help both." },
  { target: "reason", title: "Why", text: "A short reason for the suggestion." },
  { target: "transactions", title: "Transactions", text: "Each transaction with its date and amount. Amounts follow the 👁 toggle in the navbar." },
  { target: "actions", title: "Decide", text: "Accept them all, move them to another subcategory, reject (that subcategory won't be suggested for this merchant again), or \"No idea\" when you can't remember: they stay in Outros with a mark and get no more suggestions." },
];
