import type { CategorizationProgressMonth, CategorizationSource, CategorySuggestion, RuleSuggestion } from "../types";
import { OTHER_COLOR, SERIES_COLORS, formatPct, shortMonth } from "./health";

/** 0.874 -> "87%" */
export const confidenceLabel = (confidence: number) => `${Math.round(confidence * 100)}%`;

export const SOURCE_LABELS: Record<CategorizationSource, string> = {
  keyword: "Your rules",
  ai_accepted: "Accepted suggestions",
  manual: "Manual",
  uncategorized: "Not categorized yet",
};

/**
 * Colors follow the source (fixed slots of the validated palette); "not categorized yet" is the
 * neutral gray. STACK_ORDER keeps the CVD-validated adjacency: rules, manual, accepted, gray.
 */
export const SOURCE_COLORS: Record<CategorizationSource, string> = {
  keyword: SERIES_COLORS[0],
  ai_accepted: SERIES_COLORS[1],
  manual: SERIES_COLORS[2],
  uncategorized: OTHER_COLOR,
};
export const STACK_ORDER: CategorizationSource[] = ["keyword", "manual", "ai_accepted", "uncategorized"];

/** What each origin means, for tooltips. */
export const ORIGIN_HELP: Record<"ai" | "history" | "local", string> = {
  ai: "Claude suggested this from your categories, rules and past choices.",
  history: "You already put this merchant in this subcategory before. No API call was needed.",
  local: "Finverse noticed this from your own corrections. No API call was needed.",
};

export const originLabel = (origin: CategorySuggestion["origin"] | RuleSuggestion["origin"]) =>
  origin === "ai" ? "Claude" : "Your history";

export interface MerchantGroup {
  merchantKey: string;
  /** suggestions in this group all propose the same subcategory */
  suggestions: CategorySuggestion[];
}

/** Groups pending suggestions by merchant and suggested subcategory, highest confidence first. */
export function groupByMerchant(suggestions: CategorySuggestion[]): MerchantGroup[] {
  const groups = new Map<string, MerchantGroup>();
  suggestions.forEach((suggestion) => {
    const key = `${suggestion.merchant_key}|${suggestion.subcategory.id}`;
    const group = groups.get(key) ?? { merchantKey: suggestion.merchant_key, suggestions: [] };
    group.suggestions.push(suggestion);
    groups.set(key, group);
  });
  return [...groups.values()].sort(
    (a, b) => b.suggestions[0].confidence - a.suggestions[0].confidence || b.suggestions.length - a.suggestions.length
  );
}

export const RULE_TITLES: Record<RuleSuggestion["action"], string> = {
  create: "New rule",
  update: "Change rule",
  delete: "Remove rule",
};

/** "Run failed" text for the banner, or null. */
export function runProblem(run: { status: string; error_message: string | null } | null | undefined) {
  if (!run) return null;
  if (run.status === "failed") return run.error_message ?? "Generating suggestions failed.";
  if (run.status === "queued" && run.error_message) return `${run.error_message} (retrying)`;
  return null;
}

/** The headline: how much of the latest month the rules handled, and the change vs the month before. */
export function progressHeadline(months: CategorizationProgressMonth[]) {
  const withData = months.filter((m) => m.total > 0);
  const latest = withData[withData.length - 1];
  if (!latest || latest.keyword_share === null) return null;
  const previous = withData[withData.length - 2];
  const change = previous?.keyword_share != null ? Math.round((latest.keyword_share - previous.keyword_share) * 100) : null;
  return {
    text: `${formatPct(latest.keyword_share)} of ${shortMonth(latest.month)}'s transactions were categorized by your rules`,
    change:
      change === null ? null : change === 0 ? "same as the month before" : `${change > 0 ? "↑" : "↓"} ${Math.abs(change)} points vs ${shortMonth(previous!.month)}`,
  };
}
