import { Container } from "react-bootstrap";
import { reportsApi } from "../../api";
import { ErrorMessage, Loading } from "../../components/LoadingState";
import SubcategoryChart from "../../components/SubcategoryChart";
import { useCreditDebitReport } from "../../hooks/useCreditDebitReport";
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

const TOTAL_LABELS: [keyof Omit<SubcategoryMonth, "subcategories">, string][] = [
  ["total", "Total"],
  ["total_invested", "Total Invested"],
  ["total_transfered", "Total Transfered"],
  ["total_expended", "Total Expended"],
  ["total_received", "Total Received"],
];

function Panel({ title, data, color, showTotals }: { title: string; data: SubcategoryMonth; color: string; showTotals: boolean }) {
  return (
    <div className="panel">
      <h5>{title}</h5>
      <div className="chart-wrapper">
        <SubcategoryChart data={data.subcategories} showTotals={showTotals} />
      </div>
      {showTotals && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {TOTAL_LABELS.filter(([key]) => data[key] > 0).map(([key, label]) => (
            <p key={key} className="total" style={{ color }}>
              {label}: R$ {data[key].toFixed(2)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MonthlyBySubcategory({ showTotals }: Props) {
  const { credit, debit, months, loading, error } = useCreditDebitReport(reportsApi.monthlyBySubcategory);

  if (loading) return <Loading message="Carregando relatório por subcategoria..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <Container className="monthly-report-container">
      <h1>Monthly Report by Subcategory</h1>
      <div className="month-cards">
        {months.map((month) => (
          <div key={month} className="month-card">
            <h4>{month}</h4>
            <div className="panels">
              <Panel title="Gains (Money In)" data={credit[month] || EMPTY_MONTH} color="green" showTotals={showTotals} />
              <Panel title="Expenses (Money Out)" data={debit[month] || EMPTY_MONTH} color="red" showTotals={showTotals} />
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
