import { Container } from "react-bootstrap";
import { reportsApi } from "../../api";
import { ErrorMessage, Loading } from "../../components/LoadingState";
import SubcategoryChart from "../../components/SubcategoryChart";
import { useCreditDebitReport } from "../../hooks/useCreditDebitReport";
import { useI18n } from "../../i18n/context";
import type { SubcategoryMonth } from "../../types";
import { formatCurrency } from "../../utils/formatter";
import { longMonth } from "../../utils/subcategoryReport";
import "./SubcategoryReport.css";

interface Props {
  showTotals: boolean;
}

const EMPTY_MONTH: SubcategoryMonth = {
  subcategories: [],
  total: 0,
  total_invested: 0,
  total_transfered: 0,
  total_expended: 0,
  total_received: 0,
};

type TotalKey = keyof Omit<SubcategoryMonth, "subcategories">;
// "total" is the panel's headline; the others break it down, shown only when non-zero.
const BREAKDOWN_KEYS: TotalKey[] = ["total_received", "total_expended", "total_invested", "total_transfered"];

function Panel({ kind, title, data, showTotals, context }: { kind: "in" | "out"; title: string; data: SubcategoryMonth; showTotals: boolean; context: string }) {
  const { t } = useI18n();
  const breakdown = BREAKDOWN_KEYS.filter((key) => data[key] > 0);

  return (
    <section className={`subcat-panel subcat-panel-${kind}`}>
      <header className="subcat-panel-head">
        <h3>{title}</h3>
        {showTotals && <span className="subcat-panel-total">{formatCurrency(data.total)}</span>}
      </header>
      {showTotals && breakdown.length > 0 && (
        <dl className="subcat-breakdown">
          {breakdown.map((key) => (
            <div key={key}>
              <dt>{t.reports.totals[key]}</dt>
              <dd>{formatCurrency(data[key])}</dd>
            </div>
          ))}
        </dl>
      )}
      <SubcategoryChart data={data.subcategories} showTotals={showTotals} context={context} />
    </section>
  );
}

export default function MonthlyBySubcategory({ showTotals }: Props) {
  const { credit, debit, months, loading, error } = useCreditDebitReport(reportsApi.monthlyBySubcategory);
  const { t } = useI18n();
  const s = t.reports.subcategory;

  if (loading) return <Loading message={t.reports.loadingBySubcategory} />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <Container className="subcat-report">
      <header className="subcat-report-head">
        <h1>{t.reports.bySubcategoryTitle}</h1>
        <p>{s.subtitle}</p>
      </header>

      {months.map((month) => {
        const moneyIn = credit[month] || EMPTY_MONTH;
        const moneyOut = debit[month] || EMPTY_MONTH;
        const balance = moneyIn.total - moneyOut.total;
        const label = longMonth(month);

        return (
          <article key={month} className="subcat-month">
            <header className="subcat-month-head">
              <h2>{label}</h2>
              {showTotals && (
                <div className="subcat-month-summary">
                  <div className="subcat-chip subcat-chip-in">
                    <span>{s.moneyIn}</span>
                    <strong>{formatCurrency(moneyIn.total)}</strong>
                  </div>
                  <div className="subcat-chip subcat-chip-out">
                    <span>{s.moneyOut}</span>
                    <strong>{formatCurrency(moneyOut.total)}</strong>
                  </div>
                  <div className={`subcat-chip subcat-chip-balance ${balance >= 0 ? "is-positive" : "is-negative"}`}>
                    <span>{s.balance}</span>
                    <strong>{formatCurrency(balance)}</strong>
                    <small>{balance >= 0 ? s.positive : s.negative}</small>
                  </div>
                </div>
              )}
            </header>
            <div className="subcat-panels">
              <Panel kind="in" title={t.reports.gains} data={moneyIn} showTotals={showTotals} context={`${t.reports.gains} · ${label}`} />
              <Panel kind="out" title={t.reports.expenses} data={moneyOut} showTotals={showTotals} context={`${t.reports.expenses} · ${label}`} />
            </div>
          </article>
        );
      })}
    </Container>
  );
}
