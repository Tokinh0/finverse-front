import { useEffect, useState } from "react";
import { Container, Spinner } from "react-bootstrap";
import SubcategoryChart from "../../components/SubcategoryChart";
import "../reports/Report.css";

interface Props {
  showTotals: boolean;
}

export default function MonthlyBySubcategory({ showTotals }: Props) {
  const [creditReport, setCreditReport] = useState<MonthlyReportData>({});
  const [debitReport, setDebitReport] = useState<MonthlyReportData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/api/v1/reports/monthly_by_subcategory")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load report");
        return res.json();
      })
      .then((data: FullReport) => {
        setCreditReport(data.credit);
        setDebitReport(data.debit);
      })
      .catch((err) => {
        console.error("Failed to fetch subcategory report:", err);
        alert("Erro ao carregar o relatório por subcategoria");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
        <p>Carregando relatório por subcategoria...</p>
      </Container>
    );
  }

  const allMonths = Array.from(
    new Set([...Object.keys(creditReport), ...Object.keys(debitReport)])
  ).sort((a, b) => new Date(`${a}-01`).getTime() - new Date(`${b}-01`).getTime());

  return (
    <Container className="monthly-report-container">
      <h1>Monthly Report by Subcategory</h1>
      <div className="month-cards">
        {allMonths.sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(month => {
          const creditData = creditReport[month] || { subcategories: [], total: 0 };
          const debitData  = debitReport[month]  || { subcategories: [], total: 0 };

          return (
            <div key={month} className="month-card">
              <h4>{month}</h4>
              <div className="panels">
                <div className="panel">
                  <h5>Gains (Money In)</h5>
                  <div className="chart-wrapper">
                    <SubcategoryChart data={creditData.subcategories} showTotals={showTotals} />
                  </div>
                  {showTotals && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      {creditData.total > 0 && <p className="total" style={{ color: 'green' }}>Total: R$ {creditData.total.toFixed(2)}</p>}
                      {creditData.total_invested > 0 && <p className="total" style={{ color: 'green' }}>Total Invested: R$ {creditData.total_invested.toFixed(2)}</p>}
                      {creditData.total_transfered > 0 && <p className="total" style={{ color: 'green' }}>Total Transfered: R$ {creditData.total_transfered.toFixed(2)}</p>}
                      {creditData.total_expended > 0 && <p className="total" style={{ color: 'green' }}>Total Expended: R$ {creditData.total_expended.toFixed(2)}</p>}
                      {creditData.total_received > 0 && <p className="total" style={{ color: 'green' }}>Total Received: R$ {creditData.total_received.toFixed(2)}</p>}
                    </div>
                  )}
                </div>

                <div className="panel">
                  <h5>Expenses (Money Out)</h5>
                  <div className="chart-wrapper">
                    <SubcategoryChart data={debitData.subcategories} showTotals={showTotals}/>
                  </div>
                  {showTotals && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      {debitData.total > 0 && <p className="total" style={{ color: 'red' }}>Total: R$ {debitData.total.toFixed(2)}</p>}
                      {debitData.total_invested > 0 && <p className="total" style={{ color: 'red' }}>Total Invested: R$ {debitData.total_invested.toFixed(2)}</p>}
                      {debitData.total_transfered > 0 && <p className="total" style={{ color: 'red' }}>Total Transfered: R$ {debitData.total_transfered.toFixed(2)}</p>}
                      {debitData.total_expended > 0 && <p className="total" style={{ color: 'red' }}>Total Expended: R$ {debitData.total_expended.toFixed(2)}</p>}
                      {debitData.total_received > 0 && <p className="total" style={{ color: 'red' }}>Total Received: R$ {debitData.total_received.toFixed(2)}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Container>
  );
}
