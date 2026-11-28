import { getLocale } from "../i18n/locale";

/** TradingView symbols for the quotes that have a chart. */
export const CHART_SYMBOLS: Record<string, string> = {
  usd: "FX_IDC:USDBRL",
  eur: "FX_IDC:EURBRL",
  btc: "BITSTAMP:BTCUSD",
  eth: "BITSTAMP:ETHUSD",
  xrp: "BITSTAMP:XRPUSD",
  sol: "COINBASE:SOLUSD",
  ibovespa: "BMFBOVESPA:IBOV",
};

export const DEFAULT_CHART_SYMBOL = CHART_SYMBOLS.btc;

/**
 * Money in any currency, with more decimals for small prices (R$ 0,3168 rather than R$ 0,32).
 * Always in the Brazilian format, like `formatCurrency` everywhere else.
 */
export function formatPrice(value: number, currency = "BRL"): string {
  const abs = Math.abs(value);
  // R$ 331.996,00 · R$ 5,5582 · R$ 0,3168 · R$ 0,000012
  const [min, max] = abs >= 100 || abs === 0 ? [2, 2] : abs >= 1 ? [2, 4] : abs >= 0.01 ? [4, 4] : [6, 6];
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  }).format(value);
}

/** Index points, no currency: "128.456" (pt-BR) / "128,456" (en). */
export const formatPoints = (value: number) =>
  new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 0 }).format(value);

/** "13.75%" / "13,75%". */
export const formatPercent = (value: number) =>
  `${new Intl.NumberFormat(getLocale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}%`;

export type Direction = "up" | "down" | "flat";

export const direction = (change: number): Direction => (change > 0.005 ? "up" : change < -0.005 ? "down" : "flat");

/** "▲ +1.20%", "▼ −0.80%", "■ 0.00%": the arrow and the sign carry the direction, not color alone. */
export function formatChange(change: number): string {
  const dir = direction(change);
  const arrow = dir === "up" ? "▲" : dir === "down" ? "▼" : "■";
  const sign = dir === "up" ? "+" : dir === "down" ? "−" : "";
  return `${arrow} ${sign}${formatPercent(Math.abs(change))}`;
}

export const changeClass = (change: number) =>
  ({ up: "text-success", down: "text-danger", flat: "text-muted" })[direction(change)];

/** "27/11/2026 18:35" or "11/27/2026 6:35 PM"; a date-only value ("2026-11-26") has no time. */
export function formatAsOf(value: string): string {
  const locale = getLocale();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(new Date(y, m - 1, d));
  }
  return new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

/** Change between two values in percent, or null when there's nothing to compare against. */
export function percentChange(from: number | null, to: number | null): number | null {
  if (from === null || to === null || from === 0) return null;
  return ((to - from) / Math.abs(from)) * 100;
}

/** The world indices, commodities and dollar index shown by TradingView's market quotes widget. */
export const GLOBAL_SYMBOL_GROUPS = [
  {
    key: "indices",
    symbols: [
      { name: "FOREXCOM:SPXUSD", displayName: "S&P 500" },
      { name: "FOREXCOM:NSXUSD", displayName: "Nasdaq 100" },
      { name: "FOREXCOM:DJI", displayName: "Dow Jones" },
      { name: "INDEX:DEU40", displayName: "DAX" },
      { name: "INDEX:NKY", displayName: "Nikkei 225" },
    ],
  },
  {
    key: "commodities",
    symbols: [
      { name: "OANDA:XAUUSD", displayName: "Gold" },
      { name: "TVC:UKOIL", displayName: "Brent" },
      { name: "TVC:USOIL", displayName: "WTI" },
    ],
  },
  { key: "dollar", symbols: [{ name: "TVC:DXY", displayName: "DXY" }] },
] as const;
