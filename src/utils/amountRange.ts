import { formatCurrency, parseAmount } from "./formatter";

export interface AmountRange {
  min_amount: number | null;
  max_amount: number | null;
}

/** "up to R$ 99,99", "from R$ 100,00", "R$ 50,00 to R$ 80,00", or "" without a range. */
export function amountRangeLabel(min?: number | null, max?: number | null) {
  const hasMin = min !== null && min !== undefined;
  const hasMax = max !== null && max !== undefined;
  if (hasMin && hasMax) return `${formatCurrency(min)} to ${formatCurrency(max)}`;
  if (hasMin) return `from ${formatCurrency(min)}`;
  if (hasMax) return `up to ${formatCurrency(max)}`;
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
    return "Amounts must be positive numbers, like 99,90.";
  }
  if (min !== null && max !== null && min > max) return "The minimum amount can't be above the maximum.";
  return { min_amount: min, max_amount: max };
}
