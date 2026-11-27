import { useId, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useI18n } from "../i18n/context";
import type { SubcategoryReportEntry } from "../types";
import { formatCurrency } from "../utils/formatter";
import { compactBRL } from "../utils/health";
import { cleanName, formatPercent, sortTransactions, toSlices, type SubcategorySlice } from "../utils/subcategoryReport";
import ChartTypeSelect, { type ChartType } from "./ChartTypeSelect";
import SubcategoryDetailsModal from "./reports/SubcategoryDetailsModal";

interface Props {
  data: SubcategoryReportEntry[];
  showTotals: boolean;
  /** Shown above the subcategory name in the details modal, e.g. "Money out · October 2026". */
  context?: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: { payload: SubcategorySlice }[];
  showTotals: boolean;
}

const PREVIEW_COUNT = 3;
const MAX_TICK = 16;
const AXIS = { stroke: "#c2c2c2", tickLine: false, tick: { fill: "#666", fontSize: 12 } };

/** Hover preview, the same for every chart type: the full list lives in the modal (click). */
export function SubcategoryTooltip({ active, payload, showTotals }: TooltipProps) {
  const { t } = useI18n();
  const s = t.reports.subcategory;
  if (!active || !payload?.length) return null;

  const slice = payload[0].payload;
  const largest = sortTransactions(slice.transactions, "amount").slice(0, PREVIEW_COUNT);

  return (
    <div className="subcat-tooltip">
      <div className="subcat-tooltip-head">
        <span className="subcat-swatch" style={{ background: slice.color }} aria-hidden />
        <strong>{slice.name}</strong>
      </div>
      <div className="subcat-tooltip-meta">
        {showTotals && <span className="subcat-tooltip-total">{formatCurrency(slice.total)}</span>}
        <span>{s.ofTotal(formatPercent(slice.percent))}</span>
        <span>{s.transactions(slice.transactions.length)}</span>
      </div>
      {largest.length > 0 && (
        <>
          <div className="subcat-tooltip-label">{s.largest}</div>
          <ul>
            {largest.map((tx, index) => (
              <li key={index}>
                <span className="subcat-tooltip-name">{cleanName(tx.name)}</span>
                <span className="num">{showTotals ? formatCurrency(tx.amount) : s.hidden}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="subcat-tooltip-hint">{s.clickForDetails}</div>
    </div>
  );
}

export default function SubcategoryChart({ data, showTotals, context = "" }: Props) {
  const [chartType, setChartType] = useState<ChartType>("pie");
  const [selected, setSelected] = useState<SubcategorySlice | null>(null);
  const selectId = useId();
  const { t } = useI18n();
  const s = t.reports.subcategory;

  if (!Array.isArray(data)) return <p>{t.charts.invalidData}</p>;

  const slices = toSlices(data);
  if (!slices.length) return <p className="subcat-empty">{t.charts.noData}</p>;

  const tooltip = <Tooltip content={<SubcategoryTooltip showTotals={showTotals} />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />;
  // Bar and line charts: a click anywhere on a subcategory's column opens it.
  const selectFromChart = (state: { activeLabel?: string | number; activeTooltipIndex?: number | string | null } | null) => {
    const byLabel = slices.find((slice) => slice.name === state?.activeLabel);
    const byIndex = state?.activeTooltipIndex != null ? slices[Number(state.activeTooltipIndex)] : undefined;
    const slice = byLabel ?? byIndex;
    if (slice) setSelected(slice);
  };
  const moneyTick = (value: number) => (showTotals ? compactBRL(value) : "");
  const nameTick = (name: string) => (name.length > MAX_TICK ? `${name.slice(0, MAX_TICK - 1)}…` : name);

  return (
    <div className="subcat-chart">
      <ChartTypeSelect id={selectId} value={chartType} onChange={setChartType} />

      <div className="subcat-chart-area" style={{ height: chartType === "bar" ? Math.max(240, slices.length * 30 + 30) : 300 }}>
        <ResponsiveContainer>
          {chartType === "bar" ? (
            <BarChart data={slices} layout="vertical" margin={{ left: 8, right: 16 }} onClick={selectFromChart} style={{ cursor: "pointer" }}>
              <CartesianGrid horizontal={false} stroke="#eee" />
              <XAxis type="number" tickFormatter={moneyTick} {...AXIS} />
              <YAxis type="category" dataKey="name" width={130} interval={0} tickFormatter={nameTick} {...AXIS} />
              {tooltip}
              <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {slices.map((slice) => (
                  <Cell key={slice.name} fill={slice.color} />
                ))}
              </Bar>
            </BarChart>
          ) : chartType === "line" ? (
            <LineChart data={slices} margin={{ left: 8, right: 16, top: 12 }} onClick={selectFromChart} style={{ cursor: "pointer" }}>
              <CartesianGrid vertical={false} stroke="#eee" />
              <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} height={90} tickFormatter={nameTick} {...AXIS} />
              <YAxis tickFormatter={moneyTick} width={showTotals ? 76 : 8} {...AXIS} />
              {tooltip}
              <Line
                type="monotone"
                dataKey="total"
                stroke="#9a9a9a"
                strokeWidth={2}
                isAnimationActive={false}
                dot={(props: { cx?: number; cy?: number; index?: number }) => (
                  <circle key={props.index} cx={props.cx} cy={props.cy} r={6} fill={slices[props.index ?? 0]?.color} stroke="#fff" strokeWidth={2} />
                )}
                activeDot={(props: { cx?: number; cy?: number; index?: number }) => (
                  <circle key={props.index} cx={props.cx} cy={props.cy} r={8} fill={slices[props.index ?? 0]?.color} stroke="#fff" strokeWidth={2} />
                )}
              />
            </LineChart>
          ) : (
            <PieChart>
              {tooltip}
              <Pie
                data={slices}
                dataKey="total"
                nameKey="name"
                innerRadius="58%"
                outerRadius="92%"
                paddingAngle={slices.length > 1 ? 1 : 0}
                stroke="#fff"
                strokeWidth={2}
                onClick={(_, index) => setSelected(slices[index] ?? null)}
                style={{ cursor: "pointer" }}
              >
                {slices.map((slice) => (
                  <Cell key={slice.name} fill={slice.color} />
                ))}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
        {chartType === "pie" && (
          <div className="subcat-donut-center" aria-hidden>
            <span>{showTotals ? formatCurrency(slices.reduce((acc, slice) => acc + slice.total, 0)) : s.hidden}</span>
            <small>{s.subcategories(slices.length)}</small>
          </div>
        )}
      </div>

      {/* Legend and table in one: every subcategory, its share and amount; click for the details. */}
      <ul className="subcat-legend">
        {slices.map((slice) => (
          <li key={slice.name}>
            <button type="button" onClick={() => setSelected(slice)} aria-label={s.openDetails(slice.name)}>
              <span className="subcat-swatch" style={{ background: slice.color }} aria-hidden />
              <span className="subcat-legend-name">{slice.name}</span>
              <span className="subcat-legend-pct">{formatPercent(slice.percent)}</span>
              <span className="subcat-legend-amount">{showTotals ? formatCurrency(slice.total) : s.hidden}</span>
              <span className="subcat-legend-track" aria-hidden>
                <span style={{ width: `${Math.max(slice.percent * 100, 0.5)}%`, background: slice.color }} />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <SubcategoryDetailsModal slice={selected} context={context} showTotals={showTotals} onHide={() => setSelected(null)} />
    </div>
  );
}
