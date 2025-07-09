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

export default function CategoryChart({ data }) {
  const [chartType, setChartType] = useState("pie"); // 🟢 default to pie chart

  if (!data || typeof data !== "object") return <p>Invalid data</p>;

  const chartData = Object.entries(data).map(([category, info]) => ({
    name: category,
    total: Object.values(info.subcategories).reduce(
      (sum, sub) => sum + parseFloat(sub.total),
      0
    ),
    color: info.color_code,
  }));   

  if (!chartData.length) return <p>No data to display.</p>;
  if (chartType !== "pie") resetLabelCollision();

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="chartType" style={{ marginRight: "0.5rem" }}>Choose chart type: </label>
        <select
          id="chartType"
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
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
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="total" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartType === "line" && (
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        )}

        {chartType === "pie" && (
          <ResponsiveContainer>
            <PieChart>
              <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
              <Legend />
              <Pie
                data={chartData}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
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
                {chartData.sort((a, b) => b.total - a.total).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
