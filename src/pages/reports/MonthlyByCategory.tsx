import { Container } from "react-bootstrap";
import { reportsApi } from "../../api";
import CategoryChart from "../../components/CategoryChart";
import { ErrorMessage, Loading } from "../../components/LoadingState";
import { useCreditDebitReport } from "../../hooks/useCreditDebitReport";
import "./Report.css";

export default function MonthlyByCategory() {
  const { credit, debit, months, loading, error } = useCreditDebitReport(reportsApi.monthlyByCategory);

  if (loading) return <Loading message="Carregando relatório..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <Container className="monthly-report-container">
      <h1>Monthly Report by Category</h1>
      <div className="month-cards">
        {months.map((month) => (
          <div key={month} className="month-card">
            <h4>{month}</h4>
            <div className="panels">
              <div className="panel">
                <h5>Gains (Money In)</h5>
                <CategoryChart data={credit[month] || {}} />
              </div>
              <div className="panel">
                <h5>Expenses (Money Out)</h5>
                <CategoryChart data={debit[month] || {}} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
