import { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { renderCustomPieLabel } from "../utils/chartHelper";

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042",
  "#AA336A", "#33AADD", "#FF6666", "#66CC66"
];

interface SubcategoryData {
  name: string;
  total: number;
  color_code?: string;
  transactions: {
    name: string;
    amount: number;
  }[];
}

interface Props {
  data: SubcategoryData[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    const percent = payload[0].percent; // ← correct place

    return (
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 1)",
          border: "1px solid #ccc",
          padding: "10px",
          opacity: 1,
          zIndex: 9999,
          textAlign: "left",
          maxWidth: "400px",
          overflowX: "auto",
        }}
      >
        <p>
          <strong>
            {data.name}
            {typeof percent === "number" ? ` (${(percent * 100).toFixed(1)}%)` : ""}
          </strong>
        </p>
        <ul style={{ margin: 0, paddingLeft: "0", listStyle: "none" }}>
          {data.transactions?.map((t: any, idx: number) => (
            <li
              key={idx}
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              R$ {t.amount.toFixed(2)} - {t.name.replace(/\s+/g, " ").trim()}
            </li>
          ))}
        </ul>
        <p><strong>R$ {data.total.toFixed(2)} - Total</strong></p>
      </div>
    );
  }

  return null;
};

export default function SubcategoryChart({ data }: Props) {
  const [chartType, setChartType] = useState<"bar" | "line" | "pie">("pie");

  if (!Array.isArray(data)) return <p>Invalid data</p>;

  const chartData: SubcategoryData[] = data.map((entry) => ({
    ...entry,
    total: typeof entry.total === "string" ? parseFloat(entry.total) : entry.total,
  }));

  if (!chartData.length) return <p style={{ marginTop: '50%' }}>No data to display.</p>;

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="chartType" style={{ marginRight: "0.5rem" }}>
          Choose chart type:
        </label>
        <select
          id="chartType"
          value={chartType}
          onChange={(e) => setChartType(e.target.value as "bar" | "line" | "pie")}
        >
          <option value="bar">Bar</option>
          <option value="line">Line</option>
          <option value="pie">Pie</option>
        </select>
      </div>

      <div style={{ width: "100%", height: 550 }}>
        {chartType === "bar" && (
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={100} />
              <YAxis />
              <Tooltip formatter={(value) => {
                if (typeof value === "number") {
                  return `R$ ${value.toFixed(2)}`;
                }
                return `R$ ${value}`;
              }} />
              <Legend />
              <Bar dataKey="total" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartType === "line" && (
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={100} />
              <YAxis />
              <Tooltip formatter={(value) => {
                if (typeof value === "number") {
                  return `R$ ${value.toFixed(2)}`;
                }
                return `R$ ${value}`;
              }} />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        )}
        
        {chartType === "pie" && (
          <ResponsiveContainer>
            <PieChart>
            <Tooltip content={<CustomTooltip />} />
              <Pie
                data={chartData}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ cx, cy, midAngle, outerRadius, percent, name, payload, index }) =>
                  renderCustomPieLabel({
                    cx,
                    cy,
                    midAngle,
                    outerRadius,
                    percent,
                    name,
                    fill: payload.fill,
                    index, // ← pass index here
                  })
                }
              >
                {chartData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color_code || COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
