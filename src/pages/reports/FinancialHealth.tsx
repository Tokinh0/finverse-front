import { useEffect, useMemo, useState } from "react";
import { Alert, Container, Form } from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
import { reportsApi } from "../../api";
import CategoryRanking from "../../components/health/CategoryRanking";
import CategoryTrendChart from "../../components/health/CategoryTrendChart";
import StatTile from "../../components/health/StatTile";
import YearSummary from "../../components/health/YearSummary";
import { ErrorMessage, Loading } from "../../components/LoadingState";
import type { FinancialHealthReport } from "../../types";
import { formatIsoDate } from "../../utils/dates";
import { formatCurrency } from "../../utils/formatter";
import { categoryColors, delta, formatPct, periodLabel, relativeChange, shortMonth } from "../../utils/health";
import "./FinancialHealth.css";
import { useI18n } from "../../i18n/context";
import { messages } from "../../i18n/locale";

interface Props {
  showTotals: boolean;
}

const PERIODS = [1, 3, 6, 12];
export default function FinancialHealth({ showTotals }: Props) {
  const { t } = useI18n();
  const h = t.health;
  const [searchParams, setSearchParams] = useSearchParams();
  const period = Number(searchParams.get("period")) || 3;
  const asOf = searchParams.get("as_of") ?? undefined;
  const year = Number(searchParams.get("year")) || undefined;

  const [report, setReport] = useState<FinancialHealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    reportsApi
      .financialHealth({ period, as_of: asOf, year })
      .then(setReport)
      .catch((err) => {
        console.error(err);
        setError(messages().health.loadError);
      })
      .finally(() => setLoading(false));
  }, [period, asOf, year]);

  const setParam = (key: string, value?: string) =>
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    });

  // One color per category for the whole page, assigned by id (never by rank).
  const colors = useMemo(() => categoryColors(report?.categories ?? []), [report?.categories]);

  if (error) return <ErrorMessage message={error} />;
  if (!report) return <Loading message={h.loading} />;
  if (!report.as_of || !report.summary || !report.trends || !report.year || !report.range || !report.previous_range) {
    return (
      <Container className="mt-4">
        <Alert variant="secondary">{h.noTransactions}</Alert>
      </Container>
    );
  }

  const { current, previous } = report.summary;
  const money = (value: number) => (showTotals ? formatCurrency(value) : t.common.hiddenAmount);
  const comparison = h.versus(periodLabel(report.previous_range.from, report.previous_range.to));
  const uncategorized = report.categories?.find((c) => c.name.trim().toUpperCase() === "OUTROS");

  return (
    <Container className="health mt-4 d-grid gap-4" style={{ opacity: loading ? 0.6 : 1 }}>
      <div className="d-flex flex-wrap align-items-end justify-content-between gap-3">
        <div>
          <h1>{h.title}</h1>
          <p className="health-sub">
            {formatIsoDate(report.range.from)} – {formatIsoDate(report.range.to)}
          </p>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <div className="health-period" role="group" aria-label={h.period}>
            {PERIODS.map((months) => (
              <button key={months} type="button" aria-pressed={report.period_months === months} onClick={() => setParam("period", String(months))}>
                {h.periods(months)}
              </button>
            ))}
          </div>
          <Form.Select aria-label={h.endingMonth} value={report.as_of} onChange={(e) => setParam("as_of", e.target.value)} style={{ width: "auto" }}>
            {report.months_available.map((m) => (
              <option key={m} value={m}>
                {h.ending(shortMonth(m))}
              </option>
            ))}
          </Form.Select>
        </div>
      </div>

      <section className="health-section" aria-labelledby="health-summary">
        <div className="health-section-head">
          <h2 id="health-summary">{h.summary}</h2>
          <p className="health-sub">{h.comparedWith(report.period_months)}</p>
        </div>
        <div className="health-tiles">
          <StatTile
            hero
            label={h.savingsRate}
            value={formatPct(current.savings_rate)}
            hint={h.savingsRateHint(formatPct(previous.savings_rate))}
          />
          <StatTile label={h.income} value={money(current.income)} delta={delta(relativeChange(current.income, previous.income), true)} comparison={comparison} />
          <StatTile label={h.spending} value={money(current.expenses)} delta={delta(relativeChange(current.expenses, previous.expenses), false)} comparison={comparison} />
          <StatTile label={h.invested} value={money(current.invested)} delta={delta(relativeChange(current.invested, previous.invested), true)} comparison={comparison} />
          <StatTile label={h.net} value={money(current.net)} />
        </div>
      </section>

      <section className="health-section" aria-labelledby="health-categories">
        <div className="health-section-head">
          <h2 id="health-categories">{h.whereMoneyWent}</h2>
          <p className="health-sub">{h.whereMoneyWentSub}</p>
        </div>
        {uncategorized && uncategorized.share >= 0.2 && (
          <Alert variant="light" className="mb-0 border">
            {h.uncategorizedShare(formatPct(uncategorized.share))}
            <Link to={`/transactions?${report.period_months === 1 ? `month=${report.as_of}&` : ""}category_id=${uncategorized.id}`}>{h.reviewThose}</Link>
            {h.sharper}
          </Alert>
        )}
        <CategoryRanking categories={report.categories ?? []} colors={colors} showTotals={showTotals} comparison={comparison} />
      </section>

      <section className="health-section" aria-labelledby="health-trends">
        <div className="health-section-head">
          <h2 id="health-trends">{h.trends}</h2>
          <p className="health-sub">{h.trendsSub}</p>
        </div>
        <CategoryTrendChart months={report.trends.months} totals={report.trends.totals} categories={report.trends.categories} colors={colors} showTotals={showTotals} />
      </section>

      <section className="health-section" aria-labelledby="health-year">
        <div className="health-section-head">
          <h2 id="health-year">{h.yearSummary(report.year.year)}</h2>
          <Form.Select aria-label={h.year} value={report.year.year} onChange={(e) => setParam("year", e.target.value)} style={{ width: "auto" }}>
            {report.years_available.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Form.Select>
        </div>
        <YearSummary year={report.year} colors={colors} showTotals={showTotals} />
      </section>
    </Container>
  );
}
