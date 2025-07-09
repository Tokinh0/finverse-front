import { useEffect, useState } from "react";
import { Container, Spinner } from "react-bootstrap";
import SubcategoryChart from "../../components/SubcategoryChart";

interface SubcategoryData {
  name: string;
  total: number;
  color_code?: string;
  transactions: {
    name: string;
    amount: number;
  }[];
}

type MonthlyReportData = {
  [month: string]: SubcategoryData[];
};

interface FullReport {
  credit: MonthlyReportData;
  debit: MonthlyReportData;
}

export default function MonthlyBySubcategory() {
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
    <Container>
      <h1>Monthly Report by Subcategory</h1>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "2rem",
          justifyContent: "center",
        }}
      >
        {allMonths.map((month) => (
          <div
            key={month}
            style={{
              flex: "1 1 800px",
              background: "#f9f9f9",
              padding: "1rem",
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
            }}
          >
            <h4 style={{ marginTop: 0 }}>{month}</h4>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div
                style={{
                  width: "49%",
                  background: "linear-gradient(to bottom right, #ffffff, #f7f7f7)",
                  borderRadius: "10px",
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)",
                  padding: "1rem",
                  border: "1px solid rgba(0, 0, 0, 0.05)",
                }}
              >
                <h5>Gains (Money In)</h5>
                <SubcategoryChart data={creditReport[month] || []} />
              </div>

              <div
                style={{
                  width: "49%",
                  background: "linear-gradient(to bottom right, #ffffff, #f7f7f7)",
                  borderRadius: "10px",
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)",
                  padding: "1rem",
                  border: "1px solid rgba(0, 0, 0, 0.05)",
                }}
              >
                <h5>Expenses (Money Out)</h5>
                <SubcategoryChart data={debitReport[month] || []} />
              </div>
            </div>

          </div>
        ))}
      </div>
    </Container>
  );
}
