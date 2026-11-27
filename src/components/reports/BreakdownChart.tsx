import { useId, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useI18n } from "../../i18n/context";
import { formatCurrency } from "../../utils/formatter";
import { compactBRL } from "../../utils/health";
import { cleanName, formatPercent, sortTransactions, sumTotals, type ReportSlice } from "../../utils/reportSlices";
import ChartTypeSelect, { type ChartType } from "../ChartTypeSelect";
import "./MonthlyReport.css";
import ReportDetailsModal from "./ReportDetailsModal";

interface Props {
  slices: ReportSlice[];
  showTotals: boolean;
  /** Under the total in the middle of the donut, e.g. "16 subcategories". */
  countLabel: (count: number) => string;
  /** Shown above the name in the details modal, e.g. "Money out · October 2026". */
  context?: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: { payload: ReportSlice }[];
  showTotals: boolean;
}

const PREVIEW_COUNT = 3;
const MAX_TICK = 16;
const AXIS = { stroke: "#c2c2c2", tickLine: false, tick: { fill: "#666", fontSize: 12 } };

/** Hover preview, the same for every chart type: the full list lives in the modal (click). */
export function BreakdownTooltip({ active, payload, showTotals }: TooltipProps) {
  const { t } = useI18n();
  const s = t.reports.breakdown;
  if (!active || !payload?.length) return null;

  const slice = payload[0].payload;
  // A category previews its biggest subcategories; a subcategory its biggest transactions.
  const preview = slice.parts
    ? slice.parts.slice(0, PREVIEW_COUNT).map((part) => ({ name: part.name, amount: part.total }))
    : sortTransactions(slice.transactions, "amount").slice(0, PREVIEW_COUNT).map((tx) => ({ name: cleanName(tx.name), amount: tx.amount }));

  return (
    <div className="report-tooltip">
      <div className="report-tooltip-head">
        <span className="report-swatch" style={{ background: slice.color }} aria-hidden />
        <strong>{slice.name}</strong>
      </div>
      <div className="report-tooltip-meta">
        {showTotals && <span className="report-tooltip-total">{formatCurrency(slice.total)}</span>}
        <span>{s.ofTotal(formatPercent(slice.percent))}</span>
        <span>{s.transactions(slice.transactions.length)}</span>
      </div>
      {preview.length > 0 && (
        <>
          <div className="report-tooltip-label">{slice.parts ? s.bySubcategory : s.largest}</div>
          <ul>
            {preview.map((item, index) => (
              <li key={index}>
                <span className="report-tooltip-name">{item.name}</span>
                <span className="num">{showTotals ? formatCurrency(item.amount) : s.hidden}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="report-tooltip-hint">{s.clickForDetails}</div>
    </div>
  );
}

/** One panel's breakdown (pie, bar or line) with its legend, hover preview and details modal. */
export default function BreakdownChart({ slices, showTotals, countLabel, context = "" }: Props) {
  const [chartType, setChartType] = useState<ChartType>("pie");
  const [selected, setSelected] = useState<ReportSlice | null>(null);
  const selectId = useId();
  const { t } = useI18n();
  const s = t.reports.breakdown;

  if (!slices.length) return <p className="report-empty">{t.charts.noData}</p>;

  const tooltip = <Tooltip content={<BreakdownTooltip showTotals={showTotals} />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />;
  // Bar and line charts: a click anywhere on an entry's column opens it.
  const selectFromChart = (state: { activeLabel?: string | number; activeTooltipIndex?: number | string | null } | null) => {
    const byLabel = slices.find((slice) => slice.name === state?.activeLabel);
    const byIndex = state?.activeTooltipIndex != null ? slices[Number(state.activeTooltipIndex)] : undefined;
    const slice = byLabel ?? byIndex;
    if (slice) setSelected(slice);
  };
  const moneyTick = (value: number) => (showTotals ? compactBRL(value) : "");
  const nameTick = (name: string) => (name.length > MAX_TICK ? `${name.slice(0, MAX_TICK - 1)}…` : name);

  return (
    <div className="report-chart">
      <ChartTypeSelect id={selectId} value={chartType} onChange={setChartType} />

      <div className="report-chart-area" style={{ height: chartType === "bar" ? Math.max(240, slices.length * 30 + 30) : 300 }}>
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
                strokeWidth={slices.length > 1 ? 2 : 0}
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
          <div className="report-donut-center" aria-hidden>
            <span>{showTotals ? formatCurrency(sumTotals(slices)) : s.hidden}</span>
            <small>{countLabel(slices.length)}</small>
          </div>
        )}
      </div>

      {/* Legend and table in one: every entry, its share and amount; click for the details. */}
      <ul className="report-legend">
        {slices.map((slice) => (
          <li key={slice.name}>
            <button type="button" onClick={() => setSelected(slice)} aria-label={s.openDetails(slice.name)}>
              <span className="report-swatch" style={{ background: slice.color }} aria-hidden />
              <span className="report-legend-name">{slice.name}</span>
              <span className="report-legend-pct">{formatPercent(slice.percent)}</span>
              <span className="report-legend-amount">{showTotals ? formatCurrency(slice.total) : s.hidden}</span>
              <span className="report-legend-track" aria-hidden>
                <span style={{ width: `${Math.max(slice.percent * 100, 0.5)}%`, background: slice.color }} />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <ReportDetailsModal slice={selected} context={context} showTotals={showTotals} onHide={() => setSelected(null)} />
    </div>
  );
}
