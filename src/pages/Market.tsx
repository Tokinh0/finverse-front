import { useCallback, useEffect, useState } from "react";
import { Button, Card, Col, Container, Row } from "react-bootstrap";
import { marketApi } from "../api";
import { ErrorMessage, Loading } from "../components/LoadingState";
import TradingViewWidget from "../components/TradingViewWidget";
import AssetPrices from "../components/market/AssetPrices";
import QuoteTile from "../components/market/QuoteTile";
import TradingViewMarketQuotes from "../components/market/TradingViewMarketQuotes";
import { useI18n } from "../i18n/context";
import type { MarketOverview } from "../types";
import { CHART_SYMBOLS, DEFAULT_CHART_SYMBOL, formatAsOf } from "../utils/market";

/**
 * The Market page: currencies, crypto and Brazilian indicators from the API, a TradingView chart
 * of the chosen one, world markets from TradingView, and the profile's assets at today's prices.
 */
export default function Market({ showTotals }: { showTotals: boolean }) {
  const { t, locale } = useI18n();
  const m = t.market;
  const [overview, setOverview] = useState<MarketOverview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [chartSymbol, setChartSymbol] = useState(DEFAULT_CHART_SYMBOL);

  const load = useCallback(() => {
    setRefreshing(true);
    setLoadError(null);
    marketApi
      .overview()
      .then(setOverview)
      .catch((err) => {
        console.error(err);
        setLoadError(m.loadError);
      })
      .finally(() => setRefreshing(false));
  }, [m.loadError]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = () => {
    load();
    setRefreshKey((key) => key + 1);
  };

  return (
    <Container className="mt-5 text-start">
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
        <div>
          <h1 className="mb-1">{m.title}</h1>
          <p className="text-muted mb-0">
            {m.subtitle}
            {overview && <span className="ms-1">· {m.updatedAt(formatAsOf(overview.generated_at))}</span>}
          </p>
        </div>
        <Button variant="outline-primary" onClick={refresh} disabled={refreshing}>
          {refreshing ? m.refreshing : m.refresh}
        </Button>
      </div>

      {loadError && <ErrorMessage message={loadError} />}
      {!overview && !loadError && <Loading />}

      {overview?.groups.map((group) => (
        <section key={group.key} className="mb-4" aria-labelledby={`market-group-${group.key}`}>
          <h2 id={`market-group-${group.key}`} className="h5">
            {m.groups[group.key]}
          </h2>
          <Row xs={1} sm={2} lg={4} className="g-3">
            {group.quotes.map((quote) => {
              const symbol = CHART_SYMBOLS[quote.key];
              return (
                <Col key={quote.key}>
                  <QuoteTile
                    quote={quote}
                    chartSelected={symbol === chartSymbol}
                    onShowChart={symbol ? () => setChartSymbol(symbol) : undefined}
                  />
                </Col>
              );
            })}
          </Row>
        </section>
      ))}

      <Row className="g-3 mb-4">
        <Col lg={7}>
          <Card className="h-100">
            <Card.Body>
              <h2 className="h5">
                {m.chartTitle} <span className="small text-muted">{chartSymbol}</span>
              </h2>
              <div style={{ height: 460 }}>
                <TradingViewWidget symbol={chartSymbol} locale={locale === "en" ? "en" : "br"} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={5}>
          <Card className="h-100">
            <Card.Body>
              <h2 className="h5 mb-1">{m.globalTitle}</h2>
              <p className="small text-muted">{m.globalHelp}</p>
              <TradingViewMarketQuotes height={420} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <AssetPrices showTotals={showTotals} refreshKey={refreshKey} />
    </Container>
  );
}
