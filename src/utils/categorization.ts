import { ApiError } from "../api";
import type { Category, Keyword, KeywordHealth, Subcategory } from "../types";
import { shadesOf } from "./colorThemes";
import { apiErrorText } from "./profiles";

export type CategorizationTab = "organize" | "rules" | "colors";

export const CATEGORIZATION_TABS: CategorizationTab[] = ["organize", "rules", "colors"];

/** What the Organize tab shows on the right, read from the URL (`?c=`, `?s=`, `?new=category`). */
export type Selection =
  | { kind: "category"; id: number }
  | { kind: "subcategory"; id: number }
  | { kind: "newCategory" }
  | { kind: "none" };

export function readSelection(params: URLSearchParams): Selection {
  if (params.get("new") === "category") return { kind: "newCategory" };
  const sub = Number(params.get("s"));
  if (sub) return { kind: "subcategory", id: sub };
  const cat = Number(params.get("c"));
  if (cat) return { kind: "category", id: cat };
  return { kind: "none" };
}

export function readTab(params: URLSearchParams): CategorizationTab {
  const tab = params.get("tab") as CategorizationTab | null;
  return tab && CATEGORIZATION_TABS.includes(tab) ? tab : "organize";
}

/** Lowercase without accents, so "agua" finds "ÁGUA". */
export const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

export function rulesBySubcategory(keywords: Keyword[]) {
  const map = new Map<number, Keyword[]>();
  for (const keyword of keywords) {
    const list = map.get(keyword.subcategory_id) ?? [];
    list.push(keyword);
    map.set(keyword.subcategory_id, list);
  }
  for (const list of map.values()) list.sort((a, b) => a.name.localeCompare(b.name));
  return map;
}

export const needsAttention = (keyword: Keyword, health: Map<number, KeywordHealth>) =>
  (health.get(keyword.id)?.flags.length ?? 0) > 0;

/**
 * The categories and subcategories that match a search. A category whose name matches keeps every
 * subcategory; otherwise it keeps the subcategories whose name or one of whose rules matches.
 */
export function filterCategories(categories: Category[], rules: Map<number, Keyword[]>, query: string): Category[] {
  const q = normalize(query);
  if (!q) return categories;
  const matches = (text: string | null | undefined) => normalize(text ?? "").includes(q);
  return categories.flatMap((category) => {
    if (matches(category.name)) return [category];
    const subcategories = category.subcategories.filter(
      (sub) => matches(sub.name) || (rules.get(sub.id) ?? []).some((rule) => matches(rule.name))
    );
    return subcategories.length > 0 ? [{ ...category, subcategories }] : [];
  });
}

export function findSubcategory(categories: Category[], id: number): { category: Category; subcategory: Subcategory } | null {
  for (const category of categories) {
    const subcategory = category.subcategories.find((sub) => sub.id === id);
    if (subcategory) return { category, subcategory };
  }
  return null;
}

/** A color for a new subcategory: the next shade of its category's color. */
export function nextSubcategoryColor(category: Category) {
  const count = category.subcategories.length + 1;
  return shadesOf(category.color_code || "#6b7280", count)[count - 1] ?? "#cccccc";
}

/** `<input type="color">` only takes #rrggbb. */
export function colorInputValue(color: string | null | undefined, fallback = "#cccccc") {
  if (!color) return fallback;
  if (/^#[0-9a-f]{6}$/i.test(color)) return color.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(color)) return `#${[...color.slice(1)].map((c) => c + c).join("")}`.toLowerCase();
  return fallback;
}

/** The API's validation message when there is one (`{ errors: [...] }` or `{ field: [...] }`). */
export function errorText(error: unknown, fallback: string) {
  if (!(error instanceof ApiError)) return fallback;
  const body = error.body as Record<string, unknown> | undefined;
  if (body && !("errors" in body)) {
    const fields = Object.entries(body)
      .filter(([, value]) => Array.isArray(value) && value.length > 0)
      .map(([field, value]) => `${field.replace(/_/g, " ")} ${(value as string[]).join(", ")}`);
    if (fields.length > 0) return fields.join("; ");
  }
  return apiErrorText(body, fallback);
}
