import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { HealthTrendCategory } from "../../types";
import { formatCurrency } from "../../utils/formatter";
import { INK, compactBRL, delta, shortMonth } from "../../utils/health";
import { DeltaText } from "./StatTile";

interface Props {
  months: string[];
  totals: number[];
  categories: HealthTrendCategory[];
  colors: Map<number, string>;
  showTotals: boolean;
}

const HIDDEN = "R$ •••";

interface TooltipProps {
  active?: boolean;
  label?: string;
  payload?: { dataKey: string; value: number; color: string; name: string }[];
  showTotals: boolean;
}

function TrendTooltip({ active, label, payload, showTotals }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, p) => sum + (p.value || 0), 0);
  return (
    <div className="health-tooltip">
      <div className="fw-semibold mb-1">{label}</div>
      {[...payload].reverse().map((p) => (
        <div key={p.dataKey} className="health-tooltip-row">
          <span className="d-inline-flex align-items-center gap-2">
            <span className="health-swatch" style={{ background: p.color }} />
            {p.name}
          </span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{showTotals ? formatCurrency(p.value) : HIDDEN}</span>
        </div>
      ))}
      <div className="health-tooltip-row border-top mt-1 pt-1 fw-semibold">
        <span>Total</span>
        <span>{showTotals ? formatCurrency(total) : HIDDEN}</span>
      </div>
    </div>
  );
}

export default function CategoryTrendChart({ months, totals, categories, colors, showTotals }: Props) {
  // Stack in a fixed order (by color slot) so a category always sits in the same place.
  const stacked = [...categories].sort((a, b) => a.id - b.id);
  const data = months.map((month, i) => ({
    month: shortMonth(month),
    ...Object.fromEntries(stacked.map((c) => [`c${c.id}`, Math.max(c.values[i], 0)])),
  }));
  const ranked = categories.filter((c) => c.values.some((v) => v > 0));

  return (
    <div className="health-grid">
      <div className="health-legend" aria-label="Legend">
        {stacked.map((c) => (
          <span key={c.id}>
            <span className="health-swatch" style={{ background: colors.get(c.id) }} />
            {c.name}
          </span>
        ))}
      </div>

      <div style={{ width: "100%", height: 300 }} role="img" aria-label={`Monthly spending by category, ${shortMonth(months[0])} to ${shortMonth(months[months.length - 1])}`}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke={INK.grid} />
            <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: INK.axis }} tick={{ fill: INK.secondary, fontSize: 12 }} interval="preserveStartEnd" />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={showTotals ? 72 : 8}
              tick={showTotals ? { fill: INK.secondary, fontSize: 12 } : false}
              tickFormatter={compactBRL}
            />
            <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} content={<TrendTooltip showTotals={showTotals} />} />
            {stacked.map((c, i) => (
              <Bar
                key={c.id}
                dataKey={`c${c.id}`}
                name={c.name}
                stackId="spend"
                fill={colors.get(c.id)}
                stroke={INK.surface}
                strokeWidth={2}
                maxBarSize={24}
                radius={i === stacked.length - 1 ? [4, 4, 0, 0] : 0}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="health-table-wrap">
        <table className="health-table">
          <caption className="visually-hidden">Category spending: last month vs the month before and the 6-month average</caption>
          <thead>
            <tr>
              <th>Category</th>
              <th className="num">{shortMonth(months[months.length - 1])}</th>
              <th className="num">{shortMonth(months[months.length - 2])}</th>
              <th className="num">vs prev.</th>
              <th className="num">6-mo avg</th>
              <th className="num">vs avg</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((c) => (
              <tr key={c.id}>
                <td>
                  <span className="d-inline-flex align-items-center gap-2">
                    <span className="health-swatch" style={{ background: colors.get(c.id) }} />
                    {c.name}
                  </span>
                </td>
                <td className="num">{showTotals ? formatCurrency(c.last_month) : HIDDEN}</td>
                <td className="num">{showTotals ? formatCurrency(c.previous_month) : HIDDEN}</td>
                <td className="num">
                  <DeltaText delta={delta(c.change_vs_previous_pct, false)} />
                </td>
                <td className="num">{showTotals ? formatCurrency(c.average) : HIDDEN}</td>
                <td className="num">
                  <DeltaText delta={delta(c.change_vs_average_pct, false)} />
                </td>
              </tr>
            ))}
            <tr className="fw-semibold">
              <td>All spending</td>
              <td className="num">{showTotals ? formatCurrency(totals[totals.length - 1]) : HIDDEN}</td>
              <td className="num">{showTotals ? formatCurrency(totals[totals.length - 2]) : HIDDEN}</td>
              <td className="num">
                <DeltaText delta={delta(totals[totals.length - 2] > 0 ? totals[totals.length - 1] / totals[totals.length - 2] - 1 : null, false)} />
              </td>
              <td colSpan={2} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
