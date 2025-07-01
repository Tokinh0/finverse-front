import { useEffect, useState } from 'react';
import CategoryChart from '../components/CategoryChart';
import { Container, Spinner } from 'react-bootstrap';

export default function Dashboard() {
  const [reportData, setReportData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/v1/reports/monthly_by_category')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load report');
        return res.json();
      })
      .then(data => {
        setReportData(data);
      })
      .catch(err => {
        console.error('Failed to fetch report:', err);
        alert('Erro ao carregar o relatório');
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

  return (
    <Container>
      <h1>Monthly Report</h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", justifyContent: 'center' }}>
        {Object.entries(reportData)
          .sort(([monthA], [monthB]) => new Date(`${monthA}-01`).getTime() - new Date(`${monthB}-01`).getTime())
          .map(([month, categories]) => (
            <div
              key={month}
              style={{
                flex: "1 1 400px",
                maxWidth: "600px",
                background: "#f9f9f9",
                padding: "1rem",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
              }}
            >
              <h4 style={{ marginTop: 0 }}>{month}</h4>
              <CategoryChart data={categories} />
            </div>
          ))}
      </div>
    </Container>
  );
}
