import { messages } from "../i18n/locale";
import type { CategorizationProgressMonth, CategorizationSource, CategorySuggestion, RuleSuggestion } from "../types";
import { OTHER_COLOR, SERIES_COLORS, formatPct, shortMonth } from "./health";

/** 0.874 -> "87%" */
export const confidenceLabel = (confidence: number) => `${Math.round(confidence * 100)}%`;

/** "Your rules", "Manual"... in the current language. */
export const sourceLabel = (source: CategorizationSource) => messages().suggestions.sources[source];

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
export const originHelp = (origin: CategorySuggestion["origin"] | RuleSuggestion["origin"]) => messages().suggestions.originHelp[origin];

export const originLabel = (origin: CategorySuggestion["origin"] | RuleSuggestion["origin"]) => messages().suggestions.origins[origin];

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

export const ruleTitle = (action: RuleSuggestion["action"]) => messages().suggestions.ruleTitles[action];

/** "Run failed" text for the banner, or null. */
export function runProblem(run: { status: string; error_message: string | null } | null | undefined) {
  if (!run) return null;
  if (run.status === "failed") return run.error_message ?? messages().suggestions.run.failed;
  if (run.status === "queued" && run.error_message) return messages().suggestions.run.retrying(run.error_message);
  return null;
}

/** The headline: how much of the latest month the rules handled, and the change vs the month before. */
export function progressHeadline(months: CategorizationProgressMonth[]) {
  const withData = months.filter((m) => m.total > 0);
  const latest = withData[withData.length - 1];
  if (!latest || latest.keyword_share === null) return null;
  const previous = withData[withData.length - 2];
  const change = previous?.keyword_share != null ? Math.round((latest.keyword_share - previous.keyword_share) * 100) : null;
  const t = messages().suggestions.progressChart;
  return {
    text: t.headline(formatPct(latest.keyword_share), shortMonth(latest.month)),
    change: change === null ? null : change === 0 ? t.same : t.change(change > 0 ? "↑" : "↓", Math.abs(change), shortMonth(previous!.month)),
  };
}
