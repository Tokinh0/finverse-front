import { useId, useState } from "react";
import { Bar, BarChart, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SubcategoryReportEntry } from "../types";
import { renderCustomPieLabel } from "../utils/chartHelper";
import { colorAt, formatBRL } from "../utils/colors";
import ChartTypeSelect, { type ChartType } from "./ChartTypeSelect";

interface Props {
  data: SubcategoryReportEntry[];
  showTotals: boolean;
}

interface TooltipProps {
  active?: boolean;
  payload?: { payload: SubcategoryReportEntry; percent?: number }[];
  showTotals: boolean;
}

/** Color transaction lines by size: > R$300 red, > R$100 brown. */
const amountColor = (amount: number) => (amount > 300 ? "red" : amount > 100 ? "brown" : "black");

// "dd/mm/yyyy" (as sent by the API) -> sortable timestamp
const parseBrDate = (date: string) => {
  const [day, month, year] = date.split("/").map(Number);
  return new Date(year, month - 1, day).getTime();
};

export function SubcategoryTooltip({ active, payload, showTotals }: TooltipProps) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  const percent = payload[0].percent;
  const transactions = [...data.transactions].sort((a, b) => parseBrDate(a.transaction_date) - parseBrDate(b.transaction_date));

  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        padding: "14px",
        textAlign: "left",
        width: "min(560px, 90vw)",
        maxHeight: "460px",
        fontSize: "15px",
        lineHeight: 1.4,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <p style={{ margin: "0 0 4px 0" }}>
        <strong>
          {data.name}
          {typeof percent === "number" ? ` (${(percent * 100).toFixed(1)}%)` : ""}
        </strong>
      </p>
      {showTotals && (
        <p style={{ margin: "0 0 8px 0" }}>
          <strong>R$ {data.total.toFixed(2)} - Total</strong>
        </p>
      )}
      <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", overflowY: "auto", flex: 1, minHeight: 0 }}>
        {transactions.map((t, idx) => (
          <li
            key={idx}
            style={{ overflowWrap: "anywhere", marginBottom: "4px", color: amountColor(t.amount) }}
          >
            {t.transaction_date} - R$ {showTotals ? t.amount.toFixed(2) : "-"} - {t.name.replace(/\s+/g, " ").trim()}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SubcategoryChart({ data, showTotals }: Props) {
  const [chartType, setChartType] = useState<ChartType>("pie");
  const selectId = useId();

  if (!Array.isArray(data)) return <p>Invalid data</p>;

  const chartData = data.map((entry) => ({ ...entry, total: Number(entry.total) }));
  if (!chartData.length) return <p style={{ marginTop: "50%" }}>No data to display.</p>;

  return (
    <div>
      <ChartTypeSelect id={selectId} value={chartType} onChange={setChartType} />

      <div style={{ width: "100%", height: 550 }}>
        <ResponsiveContainer>
          {chartType === "bar" ? (
            <BarChart data={chartData}>
              <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={100} />
              <YAxis />
              <Tooltip formatter={formatBRL} />
              <Legend />
              <Bar dataKey="total" fill="#8884d8" />
            </BarChart>
          ) : chartType === "line" ? (
            <LineChart data={chartData}>
              <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={100} />
              <YAxis />
              <Tooltip formatter={formatBRL} />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#82ca9d" />
            </LineChart>
          ) : (
            <PieChart>
              <Tooltip content={<SubcategoryTooltip showTotals={showTotals} />} />
              <Pie
                data={chartData}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ cx, cy, midAngle, outerRadius, percent, name, payload, index }) =>
                  renderCustomPieLabel({ cx, cy, midAngle, outerRadius, percent, name, fill: payload.fill, index })
                }
              >
                {chartData.map((entry, i) => (
                  <Cell key={entry.name} fill={colorAt(i, entry.color_code)} />
                ))}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
