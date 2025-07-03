import { useEffect, useState } from "react";
import { Container, Spinner } from "react-bootstrap";
import SubcategoryChart from "../../components/SubcategoryChart";

interface SubcategoryData {
  name: string;
  total: number;
  color_code?: string;
}

type MonthlyReportData = {
  [month: string]: SubcategoryData[];
};

export default function MonthlyBySubcategory() {
  const [reportData, setReportData] = useState<MonthlyReportData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/api/v1/reports/monthly_by_subcategory")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load report");
        return res.json();
      })
      .then((data) => setReportData(data))
      .catch((err) => {
        console.error("Failed to fetch subcategory report:", err);
        alert("Erro ao carregar o relatório");
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
        {Object.entries(reportData)
          .sort(
            ([monthA], [monthB]) =>
              new Date(`${monthA}-01`).getTime() - new Date(`${monthB}-01`).getTime()
          )
          .map(([month, subcategories]) => (
            <div
              key={month}
              style={{
                flex: "1 1 800px",
                maxWidth: "1000px",
                background: "#f9f9f9",
                padding: "1rem",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
              }}
            >
              <h4 style={{ marginTop: 0 }}>{month}</h4>
              <SubcategoryChart data={subcategories} />
            </div>
          ))}
      </div>
    </Container>
  );
}
