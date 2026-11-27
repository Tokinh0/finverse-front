import { Container } from "react-bootstrap";
import { reportsApi } from "../../api";
import { ErrorMessage, Loading } from "../../components/LoadingState";
import SubcategoryChart from "../../components/SubcategoryChart";
import { useCreditDebitReport } from "../../hooks/useCreditDebitReport";
import { useI18n } from "../../i18n/context";
import type { SubcategoryMonth } from "../../types";
import "./Report.css";

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

const TOTAL_KEYS: (keyof Omit<SubcategoryMonth, "subcategories">)[] = ["total", "total_invested", "total_transfered", "total_expended", "total_received"];
function Panel({ title, data, color, showTotals }: { title: string; data: SubcategoryMonth; color: string; showTotals: boolean }) {
  const { t } = useI18n();
  return (
    <div className="panel">
      <h5>{title}</h5>
      <div className="chart-wrapper">
        <SubcategoryChart data={data.subcategories} showTotals={showTotals} />
      </div>
      {showTotals && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {TOTAL_KEYS.filter((key) => data[key] > 0).map((key) => (
            <p key={key} className="total" style={{ color }}>
              {t.reports.totals[key]}: R$ {data[key].toFixed(2)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MonthlyBySubcategory({ showTotals }: Props) {
  const { credit, debit, months, loading, error } = useCreditDebitReport(reportsApi.monthlyBySubcategory);
  const { t } = useI18n();

  if (loading) return <Loading message={t.reports.loadingBySubcategory} />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <Container className="monthly-report-container">
      <h1>{t.reports.bySubcategoryTitle}</h1>
      <div className="month-cards">
        {months.map((month) => (
          <div key={month} className="month-card">
            <h4>{month}</h4>
            <div className="panels">
              <Panel title={t.reports.gains} data={credit[month] || EMPTY_MONTH} color="green" showTotals={showTotals} />
              <Panel title={t.reports.expenses} data={debit[month] || EMPTY_MONTH} color="red" showTotals={showTotals} />
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
