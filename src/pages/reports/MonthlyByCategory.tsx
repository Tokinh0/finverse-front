import { Container } from "react-bootstrap";
import { reportsApi } from "../../api";
import CategoryChart from "../../components/CategoryChart";
import { ErrorMessage, Loading } from "../../components/LoadingState";
import { useCreditDebitReport } from "../../hooks/useCreditDebitReport";
import { useI18n } from "../../i18n/context";
import "./Report.css";

export default function MonthlyByCategory() {
  const { credit, debit, months, loading, error } = useCreditDebitReport(reportsApi.monthlyByCategory);
  const { t } = useI18n();

  if (loading) return <Loading message={t.reports.loading} />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <Container className="monthly-report-container">
      <h1>{t.reports.byCategoryTitle}</h1>
      <div className="month-cards">
        {months.map((month) => (
          <div key={month} className="month-card">
            <h4>{month}</h4>
            <div className="panels">
              <div className="panel">
                <h5>{t.reports.gains}</h5>
                <CategoryChart data={credit[month] || {}} />
              </div>
              <div className="panel">
                <h5>{t.reports.expenses}</h5>
                <CategoryChart data={debit[month] || {}} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
