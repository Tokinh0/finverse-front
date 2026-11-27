import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { HealthYear } from "../../types";
import { formatCurrency } from "../../utils/formatter";
import { INK, MONTH_NAMES, SERIES_COLORS, compactBRL, delta, formatPct, relativeChange } from "../../utils/health";
import StatTile, { DeltaText } from "./StatTile";

interface Props {
  year: HealthYear;
  colors: Map<number, string>;
  showTotals: boolean;
}

const HIDDEN = "R$ •••";
const CURRENT = SERIES_COLORS[0];
const PREVIOUS = "#9a9a9a"; // de-emphasis gray: last year is context, this year is the subject

interface TooltipProps {
  active?: boolean;
  label?: string;
  payload?: { dataKey: string; value: number | null; color: string; name: string }[];
  showTotals: boolean;
}

function YearTooltip({ active, label, payload, showTotals }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="health-tooltip">
      <div className="fw-semibold mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="health-tooltip-row">
          <span className="d-inline-flex align-items-center gap-2">
            <span className="health-swatch" style={{ background: p.color }} />
            {p.name}
          </span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {p.value === null || p.value === undefined ? "no data" : showTotals ? formatCurrency(p.value) : HIDDEN}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function YearSummary({ year, colors, showTotals }: Props) {
  const money = (value: number) => (showTotals ? formatCurrency(value) : HIDDEN);
  const throughLabel = year.compared_through_month < 12 ? `Jan–${MONTH_NAMES[year.compared_through_month - 1]} ${year.previous_year}` : `${year.previous_year}`;
  const previous = year.previous_totals;
  const data = year.monthly.map((m) => ({
    month: MONTH_NAMES[m.month - 1],
    current: m.has_data ? m.expenses : null,
    previous: m.previous_year_expenses,
  }));
  const lastCurrent = data.reduce((last, d, i) => (d.current !== null ? i : last), -1);
  const lastPrevious = data.reduce((last, d, i) => (d.previous !== null ? i : last), -1);

  // Direct end labels name each line where it ends (in text ink, not the line color).
  const endLabel = (lastIndex: number, text: string) =>
    function EndLabel(props: { x?: number; y?: number; index?: number }) {
      // Recharts wants an element for every point, so non-final points get an empty group.
      if (props.index !== lastIndex || props.x === undefined || props.y === undefined) return <g />;
      return (
        <text x={props.x + 8} y={props.y} dy={4} fill={INK.secondary} fontSize={12}>
          {text}
        </text>
      );
    };

  if (year.months_with_data === 0) return <p className="health-sub">No transactions in {year.year}.</p>;

  return (
    <div className="health-grid">
      <div className="health-tiles">
        <StatTile
          label="Spending"
          value={money(year.totals.expenses)}
          delta={previous ? delta(relativeChange(year.totals.expenses, previous.expenses), false) : undefined}
          comparison={previous ? `vs ${throughLabel}` : undefined}
        />
        <StatTile
          label="Income"
          value={money(year.totals.income)}
          delta={previous ? delta(relativeChange(year.totals.income, previous.income), true) : undefined}
          comparison={previous ? `vs ${throughLabel}` : undefined}
        />
        <StatTile label="Net (income − spending)" value={money(year.totals.net)} />
        <StatTile label="Savings rate" value={formatPct(year.totals.savings_rate)} hint={previous ? `${formatPct(previous.savings_rate)} in ${throughLabel}` : undefined} />
        {year.best_month && (
          <StatTile label="Best month" value={MONTH_NAMES[year.best_month.month - 1]} hint={showTotals ? `Net ${formatCurrency(year.best_month.net)}` : "Highest net"} />
        )}
        {year.worst_month && (
          <StatTile label="Worst month" value={MONTH_NAMES[year.worst_month.month - 1]} hint={showTotals ? `Net ${formatCurrency(year.worst_month.net)}` : "Lowest net"} />
        )}
      </div>

      <div>
        <div className="health-legend mb-2" aria-label="Legend">
          <span>
            <span className="health-swatch" style={{ background: CURRENT }} />
            {year.year} spending
          </span>
          <span>
            <span className="health-swatch" style={{ background: PREVIOUS }} />
            {year.previous_year} spending
          </span>
        </div>
        <div style={{ width: "100%", height: 260 }} role="img" aria-label={`Monthly spending in ${year.year} compared with ${year.previous_year}`}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 8, right: 48, bottom: 0, left: 8 }}>
              <CartesianGrid vertical={false} stroke={INK.grid} />
              <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: INK.axis }} tick={{ fill: INK.secondary, fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} width={showTotals ? 72 : 8} tick={showTotals ? { fill: INK.secondary, fontSize: 12 } : false} tickFormatter={compactBRL} />
              <Tooltip cursor={{ stroke: INK.axis }} content={<YearTooltip showTotals={showTotals} />} />
              <Line
                dataKey="previous"
                name={`${year.previous_year}`}
                stroke={PREVIOUS}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: INK.surface, strokeWidth: 2 }}
                connectNulls={false}
                label={endLabel(lastPrevious, `${year.previous_year}`)}
                isAnimationActive={false}
              />
              <Line
                dataKey="current"
                name={`${year.year}`}
                stroke={CURRENT}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, stroke: INK.surface, strokeWidth: 2 }}
                connectNulls={false}
                label={endLabel(lastCurrent, `${year.year}`)}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="health-two">
        <div className="health-table-wrap">
          <table className="health-table">
            <caption className="text-start fw-semibold text-body pb-2" style={{ captionSide: "top" }}>
              Spending by category
            </caption>
            <thead>
              <tr>
                <th>Category</th>
                <th className="num">{year.year}</th>
                <th className="num">{throughLabel}</th>
                <th className="num">Change</th>
              </tr>
            </thead>
            <tbody>
              {year.categories
                .filter((c) => c.total > 0 || c.previous_total > 0)
                .map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="d-inline-flex align-items-center gap-2">
                        <span className="health-swatch" style={{ background: colors.get(c.id) }} />
                        {c.name}
                      </span>
                    </td>
                    <td className="num">{money(c.total)}</td>
                    <td className="num">{money(c.previous_total)}</td>
                    <td className="num">
                      <DeltaText delta={delta(c.change_pct, false, previous !== null)} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="health-table-wrap">
          <table className="health-table">
            <caption className="text-start fw-semibold text-body pb-2" style={{ captionSide: "top" }}>
              Top merchants
            </caption>
            <thead>
              <tr>
                <th>Merchant</th>
                <th className="num">Charges</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {year.top_merchants.map((m) => (
                <tr key={m.name}>
                  <td className="text-break">
                    {m.name}
                    <div className="health-sub">{m.subcategory}</div>
                  </td>
                  <td className="num">{m.count}</td>
                  <td className="num">{money(m.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
