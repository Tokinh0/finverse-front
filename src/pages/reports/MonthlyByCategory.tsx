import { useEffect, useState } from "react";
import { Container, Spinner } from "react-bootstrap";
import CategoryChart from "@/components/CategoryChart";

interface Transaction {
  name: string;
  amount: number;
  transaction_date: string;
  transaction_type: string;
}

interface SubcategoryData {
  total: number;
  transactions: Transaction[];
}

interface CategoryData {
  color_code: string;
  subcategories: {
    [subcategory: string]: SubcategoryData;
  };
}

type MonthlyReportData = {
  [month: string]: {
    [category: string]: CategoryData;
  };
};

export default function MonthlyByCategory() {
  const [creditReport, setCreditReport] = useState<MonthlyReportData>({});
  const [debitReport, setDebitReport] = useState<MonthlyReportData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/api/v1/reports/monthly_by_category")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load report");
        return res.json();
      })
      .then((data) => {
        setCreditReport(data.credit);
        setDebitReport(data.debit);
      })
      .catch((err) => {
        console.error("Failed to fetch report:", err);
        alert("Erro ao carregar o relatório");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
        <p>Carregando relatório...</p>
      </Container>
    );
  }

  const allMonths = Array.from(
    new Set([...Object.keys(creditReport), ...Object.keys(debitReport)])
  ).sort((a, b) => new Date(`${a}-01`).getTime() - new Date(`${b}-01`).getTime());

  return (
    <Container>
      <h1>Monthly Report by Category</h1>
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
              <div style={{ marginBottom: "2rem", width: "45%" }}>
                <h5>Gains (Money In)</h5>
                <CategoryChart data={creditReport[month] || {}} />
              </div>

              <div style={{ width: "45%" }}>
                <h5>Expenses (Money Out)</h5>
                <CategoryChart data={debitReport[month] || {}} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
