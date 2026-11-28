import { Button, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/context";
import type { MarketQuote } from "../../types";
import { changeClass, formatAsOf, formatChange, formatPercent, formatPoints, formatPrice } from "../../utils/market";

interface Props {
  quote: MarketQuote;
  /** When the quote has a chart: whether it's the one shown, and how to show it. */
  chartSelected?: boolean;
  onShowChart?: () => void;
}

/** One indicator: its price (or rate), the change with an arrow and sign, and when/where from. */
export default function QuoteTile({ quote, chartSelected = false, onShowChart }: Props) {
  const { t } = useI18n();
  const m = t.market;
  const label = m.quotes[quote.key] ?? { name: quote.key.toUpperCase(), symbol: "" };
  const isRate = quote.unit === "percent";
  const isIndex = quote.key === "ibovespa";

  const value = () => {
    if (quote.price === undefined) return null;
    if (isRate) return formatPercent(quote.price);
    if (isIndex) return formatPoints(quote.price);
    return formatPrice(quote.price, quote.currency ?? "BRL");
  };

  const suffix = isRate ? (quote.key === "ipca" ? m.in12Months : m.perYear) : isIndex ? m.points : null;
  const changeLabel = quote.key.match(/^(btc|eth|xrp|sol)$/) ? m.last24h : m.today;

  return (
    <Card className="h-100 market-tile" data-testid={`quote-${quote.key}`}>
      <Card.Body className="d-flex flex-column gap-1">
        <div className="d-flex justify-content-between align-items-start gap-2">
          <div>
            <h3 className="h6 mb-0">{label.name}</h3>
            <div className="small text-muted">{label.symbol}</div>
          </div>
          {onShowChart && !quote.error && (
            <Button
              size="sm"
              variant={chartSelected ? "primary" : "outline-secondary"}
              aria-pressed={chartSelected}
              aria-label={m.showChart(label.name)}
              title={m.showChart(label.name)}
              onClick={onShowChart}
            >
              {m.chartTitle}
            </Button>
          )}
        </div>

        {quote.error ? (
          <div className="text-muted small mt-2">
            {quote.error === "needs_token" ? (
              <>
                {m.needsToken} <Link to="/settings">{m.addToken}</Link>
              </>
            ) : (
              m.unavailable
            )}
          </div>
        ) : (
          <>
            <div className="fs-4 fw-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
              {value()}
              {suffix && <span className="fs-6 fw-normal text-muted"> {suffix}</span>}
            </div>
            {quote.change_pct !== null && quote.change_pct !== undefined && (
              <div className={`small ${changeClass(quote.change_pct)}`}>
                {formatChange(quote.change_pct)} <span className="text-muted">{changeLabel}</span>
              </div>
            )}
            {quote.price_usd !== null && quote.price_usd !== undefined && (
              <div className="small text-muted">{m.inUsd(formatPrice(quote.price_usd, "USD"))}</div>
            )}
            {quote.as_of && quote.source && (
              <div className="small text-muted mt-auto pt-1">{m.asOf(formatAsOf(quote.as_of), quote.source)}</div>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
}
