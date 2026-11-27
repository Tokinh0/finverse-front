import { messages } from "../i18n/locale";
import { formatCurrency, parseAmount } from "./formatter";

export interface AmountRange {
  min_amount: number | null;
  max_amount: number | null;
}

/** "up to R$ 99,99", "from R$ 100,00", "R$ 50,00 to R$ 80,00", or "" without a range. */
export function amountRangeLabel(min?: number | null, max?: number | null) {
  const t = messages().amountRange;
  const hasMin = min !== null && min !== undefined;
  const hasMax = max !== null && max !== undefined;
  if (hasMin && hasMax) return t.between(formatCurrency(min), formatCurrency(max));
  if (hasMin) return t.fromAmount(formatCurrency(min));
  if (hasMax) return t.upTo(formatCurrency(max));
  return "";
}

/** Number → text for an input ("" when there's no bound). */
export const amountInputValue = (value?: number | null) =>
  value === null || value === undefined ? "" : value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Parses the two inputs (pt-BR "1.234,56" accepted; blank = no bound).
 * @returns the range, or an error message to show
 */
export function parseAmountRange(minText: string, maxText: string): AmountRange | string {
  const parse = (text: string) => (text.trim() ? parseAmount(text) : null);
  const min = parse(minText);
  const max = parse(maxText);
  if ((min !== null && (Number.isNaN(min) || min < 0)) || (max !== null && (Number.isNaN(max) || max < 0))) {
    return messages().amountRange.invalid;
  }
  if (min !== null && max !== null && min > max) return messages().amountRange.inverted;
  return { min_amount: min, max_amount: max };
}
