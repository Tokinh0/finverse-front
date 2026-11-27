import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CategorizationProgressMonth, CategorizationSource } from "../../types";
import { INK, formatPct, shortMonth } from "../../utils/health";
import { SOURCE_COLORS, SOURCE_LABELS, STACK_ORDER, progressHeadline } from "../../utils/suggestions";

interface Props {
  months: CategorizationProgressMonth[];
}

interface TooltipProps {
  active?: boolean;
  label?: string;
  payload?: { dataKey: CategorizationSource; payload: Record<string, number> }[];
}

const share = (count: number, total: number) => (total ? count / total : null);

function ProgressTooltip({ active, label, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="health-tooltip">
      <div className="fw-semibold mb-1">{label}</div>
      {[...STACK_ORDER].reverse().map((source) => (
        <div key={source} className="health-tooltip-row">
          <span className="d-inline-flex align-items-center gap-2">
            <span className="health-swatch" style={{ background: SOURCE_COLORS[source] }} />
            {SOURCE_LABELS[source]}
          </span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {row[source]} · {formatPct(share(row[source], row.total))}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Month by month: how transactions got their category, as shares of the month (100% stacked). */
export default function CategorizationProgressChart({ months }: Props) {
  const data = months.map((m) => ({ month: shortMonth(m.month), total: m.total, ...m.counts }));
  const headline = progressHeadline(months);
  if (!months.some((m) => m.total > 0)) return null;

  return (
    <div className="health-grid mb-4" data-testid="categorization-progress">
      {headline && (
        <p className="mb-0">
          <strong>{headline.text}</strong>
          {headline.change && <span className="text-muted"> · {headline.change}</span>}
        </p>
      )}
      <div className="health-legend" aria-label="Legend">
        {STACK_ORDER.map((source) => (
          <span key={source}>
            <span className="health-swatch" style={{ background: SOURCE_COLORS[source] }} />
            {SOURCE_LABELS[source]}
          </span>
        ))}
      </div>

      <div style={{ width: "100%", height: 220 }} role="img" aria-label="Share of transactions by how they were categorized, per month">
        <ResponsiveContainer>
          <BarChart data={data} stackOffset="expand" margin={{ top: 8, right: 8, bottom: 0, left: 8 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke={INK.grid} />
            <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: INK.axis }} tick={{ fill: INK.secondary, fontSize: 12 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={40}
              ticks={[0, 0.5, 1]}
              tick={{ fill: INK.secondary, fontSize: 12 }}
              tickFormatter={(value: number) => formatPct(value)}
            />
            <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} content={<ProgressTooltip />} />
            {STACK_ORDER.map((source, i) => (
              <Bar
                key={source}
                dataKey={source}
                name={SOURCE_LABELS[source]}
                stackId="source"
                fill={SOURCE_COLORS[source]}
                stroke={INK.surface}
                strokeWidth={2}
                maxBarSize={28}
                radius={i === STACK_ORDER.length - 1 ? [4, 4, 0, 0] : 0}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <details>
        <summary className="small text-muted">Show as a table</summary>
        <div className="health-table-wrap">
          <table className="health-table">
            <caption className="visually-hidden">Transactions per month by how they were categorized</caption>
            <thead>
              <tr>
                <th>Month</th>
                {STACK_ORDER.map((source) => (
                  <th key={source} className="num">
                    {SOURCE_LABELS[source]}
                  </th>
                ))}
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.month}>
                  <td>{shortMonth(m.month)}</td>
                  {STACK_ORDER.map((source) => (
                    <td key={source} className="num">
                      {m.counts[source]} ({formatPct(share(m.counts[source], m.total))})
                    </td>
                  ))}
                  <td className="num">{m.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
