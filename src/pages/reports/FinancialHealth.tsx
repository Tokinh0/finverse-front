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

interface Props {
  showTotals: boolean;
}

const PERIODS = [
  { months: 1, label: "1 month" },
  { months: 3, label: "3 months" },
  { months: 6, label: "6 months" },
  { months: 12, label: "12 months" },
];
const HIDDEN = "R$ •••";

export default function FinancialHealth({ showTotals }: Props) {
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
        setError("Could not load the report.");
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
  if (!report) return <Loading message="Building your report..." />;
  if (!report.as_of || !report.summary || !report.trends || !report.year || !report.range || !report.previous_range) {
    return (
      <Container className="mt-4">
        <Alert variant="secondary">No transactions yet. Upload a statement to see your report.</Alert>
      </Container>
    );
  }

  const { current, previous } = report.summary;
  const money = (value: number) => (showTotals ? formatCurrency(value) : HIDDEN);
  const comparison = `vs ${periodLabel(report.previous_range.from, report.previous_range.to)}`;
  const uncategorized = report.categories?.find((c) => c.name.trim().toUpperCase() === "OUTROS");

  return (
    <Container className="health mt-4 d-grid gap-4" style={{ opacity: loading ? 0.6 : 1 }}>
      <div className="d-flex flex-wrap align-items-end justify-content-between gap-3">
        <div>
          <h1>Financial health</h1>
          <p className="health-sub">
            {formatIsoDate(report.range.from)} – {formatIsoDate(report.range.to)}
          </p>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <div className="health-period" role="group" aria-label="Period">
            {PERIODS.map((p) => (
              <button key={p.months} type="button" aria-pressed={report.period_months === p.months} onClick={() => setParam("period", String(p.months))}>
                {p.label}
              </button>
            ))}
          </div>
          <Form.Select aria-label="Ending month" value={report.as_of} onChange={(e) => setParam("as_of", e.target.value)} style={{ width: "auto" }}>
            {report.months_available.map((m) => (
              <option key={m} value={m}>
                Ending {shortMonth(m)}
              </option>
            ))}
          </Form.Select>
        </div>
      </div>

      <section className="health-section" aria-labelledby="health-summary">
        <div className="health-section-head">
          <h2 id="health-summary">Summary</h2>
          <p className="health-sub">Compared with the {report.period_months === 1 ? "previous month" : `previous ${report.period_months} months`}</p>
        </div>
        <div className="health-tiles">
          <StatTile
            hero
            label="Savings rate"
            value={formatPct(current.savings_rate)}
            hint={`${formatPct(previous.savings_rate)} before · share of income not spent`}
          />
          <StatTile label="Income" value={money(current.income)} delta={delta(relativeChange(current.income, previous.income), true)} comparison={comparison} />
          <StatTile label="Spending" value={money(current.expenses)} delta={delta(relativeChange(current.expenses, previous.expenses), false)} comparison={comparison} />
          <StatTile label="Invested" value={money(current.invested)} delta={delta(relativeChange(current.invested, previous.invested), true)} comparison={comparison} />
          <StatTile label="Net (income − spending)" value={money(current.net)} />
        </div>
      </section>

      <section className="health-section" aria-labelledby="health-categories">
        <div className="health-section-head">
          <h2 id="health-categories">Where the money went</h2>
          <p className="health-sub">Spending by category, refunds already subtracted</p>
        </div>
        {uncategorized && uncategorized.share >= 0.2 && (
          <Alert variant="light" className="mb-0 border">
            {formatPct(uncategorized.share)} of this period's spending is still uncategorized ("Outros").{" "}
            <Link to={`/transactions?${report.period_months === 1 ? `month=${report.as_of}&` : ""}category_id=${uncategorized.id}`}>Review those transactions</Link> to make this report sharper.
          </Alert>
        )}
        <CategoryRanking categories={report.categories ?? []} colors={colors} showTotals={showTotals} comparison={comparison} />
      </section>

      <section className="health-section" aria-labelledby="health-trends">
        <div className="health-section-head">
          <h2 id="health-trends">Category trends</h2>
          <p className="health-sub">Monthly spending, last 12 months</p>
        </div>
        <CategoryTrendChart months={report.trends.months} totals={report.trends.totals} categories={report.trends.categories} colors={colors} showTotals={showTotals} />
      </section>

      <section className="health-section" aria-labelledby="health-year">
        <div className="health-section-head">
          <h2 id="health-year">{report.year.year} summary</h2>
          <Form.Select aria-label="Year" value={report.year.year} onChange={(e) => setParam("year", e.target.value)} style={{ width: "auto" }}>
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
