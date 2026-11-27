import { useId, useState } from "react";
import { Bar, BarChart, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useI18n } from "../i18n/context";
import type { CategoryReportEntry } from "../types";
import { renderCustomPieLabel } from "../utils/chartHelper";
import { colorAt, formatBRL } from "../utils/colors";
import { toCategoryChartData } from "../utils/reports";
import ChartTypeSelect, { type ChartType } from "./ChartTypeSelect";

interface Props {
  /** category name => entry, for one month */
  data: Record<string, CategoryReportEntry>;
}

export default function CategoryChart({ data }: Props) {
  const [chartType, setChartType] = useState<ChartType>("pie");
  const selectId = useId();
  const { t } = useI18n();

  if (!data || typeof data !== "object") return <p>{t.charts.invalidData}</p>;

  const chartData = toCategoryChartData(data);
  if (!chartData.length) return <p>{t.charts.noData}</p>;

  return (
    <div>
      <ChartTypeSelect id={selectId} value={chartType} onChange={setChartType} />

      <div style={{ width: "100%", height: 550 }}>
        <ResponsiveContainer>
          {chartType === "bar" ? (
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={formatBRL} />
              <Legend />
              <Bar dataKey="total" fill="#8884d8" />
            </BarChart>
          ) : chartType === "line" ? (
            <LineChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={formatBRL} />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#82ca9d" />
            </LineChart>
          ) : (
            <PieChart>
              <Tooltip formatter={formatBRL} />
              <Legend />
              <Pie
                data={chartData}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={({ cx, cy, midAngle, outerRadius, percent, name, payload, index }) =>
                  renderCustomPieLabel({ cx, cy, midAngle, outerRadius, percent, name, fill: payload.fill, index })
                }
              >
                {chartData.map((entry, index) => (
                  <Cell key={entry.name} fill={colorAt(index, entry.color)} />
                ))}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
