import { messages } from "../i18n/locale";
import type { SubcategoryType } from "../types";

const TYPES: SubcategoryType[] = ["gain", "expense", "investment", "transfer", "other"];

/** Subcategory types the API accepts, with their labels in the current language. */
export const subcategoryTypes = (): [SubcategoryType, string][] => TYPES.map((type) => [type, messages().subcategoryTypes[type]]);
