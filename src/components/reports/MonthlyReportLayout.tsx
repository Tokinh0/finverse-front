import type { ReactNode } from "react";
import { Container } from "react-bootstrap";
import { useI18n } from "../../i18n/context";
import { formatCurrency } from "../../utils/formatter";
import "./MonthlyReport.css";

/** Page shell of the monthly reports: title, subtitle and one card per month. */
export function ReportPage({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <Container className="report-page">
      <header className="report-page-head">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </header>
      {children}
    </Container>
  );
}

interface MonthProps {
  label: string;
  moneyIn: number;
  moneyOut: number;
  showTotals: boolean;
  children: ReactNode;
}

/** One month: its name, money in / out and the balance (arrow and text, not color alone), then the panels. */
export function ReportMonth({ label, moneyIn, moneyOut, showTotals, children }: MonthProps) {
  const s = useI18n().t.reports.breakdown;
  const balance = moneyIn - moneyOut;

  return (
    <article className="report-month">
      <header className="report-month-head">
        <h2>{label}</h2>
        {showTotals && (
          <div className="report-month-summary">
            <div className="report-chip report-chip-in">
              <span>{s.moneyIn}</span>
              <strong>{formatCurrency(moneyIn)}</strong>
            </div>
            <div className="report-chip report-chip-out">
              <span>{s.moneyOut}</span>
              <strong>{formatCurrency(moneyOut)}</strong>
            </div>
            <div className={`report-chip report-chip-balance ${balance >= 0 ? "is-positive" : "is-negative"}`}>
              <span>{s.balance}</span>
              <strong>{formatCurrency(balance)}</strong>
              <small>{balance >= 0 ? s.positive : s.negative}</small>
            </div>
          </div>
        )}
      </header>
      <div className="report-panels">{children}</div>
    </article>
  );
}

interface PanelProps {
  kind: "in" | "out";
  title: string;
  total: number;
  showTotals: boolean;
  /** Optional chips under the title, e.g. the subcategory report's non-zero totals. */
  breakdown?: { label: string; value: number }[];
  children: ReactNode;
}

export function ReportPanel({ kind, title, total, showTotals, breakdown = [], children }: PanelProps) {
  return (
    <section className={`report-panel report-panel-${kind}`}>
      <header className="report-panel-head">
        <h3>{title}</h3>
        {showTotals && <span className="report-panel-total">{formatCurrency(total)}</span>}
      </header>
      {showTotals && breakdown.length > 0 && (
        <dl className="report-breakdown">
          {breakdown.map(({ label, value }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{formatCurrency(value)}</dd>
            </div>
          ))}
        </dl>
      )}
      {children}
    </section>
  );
}
