import type { SubcategoryType } from "../types";

/** Subcategory types the API accepts, with their labels. */
export const SUBCATEGORY_TYPES: readonly (readonly [SubcategoryType, string])[] = [
  ["gain", "Gain"],
  ["expense", "Expense"],
  ["investment", "Investment"],
  ["transfer", "Transfer"],
  ["other", "Other"],
] as const;
