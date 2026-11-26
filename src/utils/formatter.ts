export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Parses an amount typed by the user, accepting pt-BR ("1.234,56") and plain ("1234.56") formats.
 * Returns NaN when the input is not a number.
 */
export function parseAmount(input: string): number {
  const value = input.trim().replace(/^R\$\s*/, "");
  if (!value) return NaN;

  const normalized = value.includes(",") ? value.replace(/\./g, "").replace(",", ".") : value;
  return /^-?\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : NaN;
}
