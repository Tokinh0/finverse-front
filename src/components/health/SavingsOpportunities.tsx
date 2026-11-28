import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/context";
import type { SavingsOpportunity, SavingsReport } from "../../types";
import { numberLocale } from "../../utils/dates";
import { formatCurrency } from "../../utils/formatter";
import { delta, formatPct, INK, relativeChange, shortMonth } from "../../utils/health";
import { DeltaText } from "./StatTile";

interface Props {
  savings: SavingsReport;
  showTotals: boolean;
}

/**
 * "Where you can save": what the owner spends more on than usual, small purchases that add up,
 * avoidable fees, and recurring charges to review. Built from `savings` in the financial health report.
 */
export default function SavingsOpportunities({ savings, showTotals }: Props) {
  const { t } = useI18n();
  const s = t.health.savings;
  const money = (value: number) => (showTotals ? formatCurrency(value) : t.common.hiddenAmount);
  const summary = savings.summary;
  const enoughHistory = savings.baseline_months >= 3;

  return (
    <div className="savings">
      {!enoughHistory && <p className="health-sub">{s.needsHistory}</p>}

      {summary && (
        <div className="health-tiles">
          <div className="health-tile savings-hero" data-hero>
            <div className="health-tile-label">{s.potential}</div>
            <div className="health-hero-value">
              {money(summary.potential_monthly)}
              <span className="savings-unit">{s.perMonth}</span>
            </div>
            <div className="health-tile-meta">
              <strong>{s.perYear(money(summary.potential_yearly))}</strong> · {s.potentialHint}
            </div>
          </div>
          <div className="health-tile">
            <div className="health-tile-label">{s.spendingNow}</div>
            <div className="health-tile-value">{money(summary.spending_now)}</div>
            {summary.spending_before !== null && (
              <div className="health-tile-meta">
                <DeltaText delta={delta(relativeChange(summary.spending_now, summary.spending_before), false)} /> · {s.usual(money(summary.spending_before))}
              </div>
            )}
          </div>
          {summary.lowest_month && (
            <div className="health-tile">
              <div className="health-tile-label">{s.lowestMonth}</div>
              <div className="health-tile-value">{money(summary.lowest_month.total)}</div>
              <div className="health-tile-meta">{shortMonth(summary.lowest_month.month)}</div>
            </div>
          )}
        </div>
      )}

      {savings.opportunities.length === 0 ? (
        <p className="savings-empty">{s.nothing}</p>
      ) : (
        <ul className="savings-list">
          {savings.opportunities.map((opportunity, index) => (
            <OpportunityCard key={`${opportunity.kind}-${opportunity.name ?? index}`} opportunity={opportunity} periodMonths={savings.period_months} money={money} />
          ))}
        </ul>
      )}

      {savings.subscriptions.items.length > 0 && (
        <section className="savings-subs" aria-labelledby="savings-subs-title">
          <h3 id="savings-subs-title">{s.subscriptionsTitle}</h3>
          <p className="health-sub">{s.subscriptionsSub(money(savings.subscriptions.monthly), money(savings.subscriptions.yearly))}</p>
          <ul>
            {savings.subscriptions.items.map((item) => (
              <li key={item.name}>
                <span className="health-swatch" style={{ background: item.subcategory.color_code ?? INK.axis }} aria-hidden />
                <span className="savings-subs-name">
                  <strong>{item.name}</strong>
                  <small>
                    {item.subcategory.name} · {s.monthsCharged(item.months)}
                  </small>
                </span>
                {item.price_change && <span className="savings-badge savings-badge-warn">{s.priceUp(money(item.price_change.from), money(item.price_change.to))}</span>}
                <span className="savings-subs-cost">
                  {money(item.monthly)}
                  <small>{s.perMonth}</small>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** 1.666 -> "1,7" (pt-BR) / "1.7" (en) */
const formatCount = (value: number) => value.toLocaleString(numberLocale(), { maximumFractionDigits: 1 });

function OpportunityCard({ opportunity: o, periodMonths, money }: { opportunity: SavingsOpportunity; periodMonths: number; money: (value: number) => string }) {
  const { t } = useI18n();
  const s = t.health.savings;
  const name = o.kind === "fees" ? s.feesName : (o.name ?? "");
  const color = o.subcategory?.color_code ?? INK.secondary;
  const link =
    o.kind === "growing_subcategory" && o.subcategory
      ? `/transactions?subcategory_id=${o.subcategory.id}`
      : o.query
        ? `/transactions?q=${encodeURIComponent(o.query)}`
        : null;

  return (
    <li className="savings-card">
      <div className="savings-card-head">
        <span className="savings-badge">{s.kinds[o.kind]}</span>
        {o.monthly_before !== undefined && o.monthly_before > 0 && (
          <span className="savings-growth">{s.growth(`+${formatPct(relativeChange(o.monthly_now, o.monthly_before))}`)}</span>
        )}
      </div>
      <h3 className="savings-card-title">
        <span className="health-swatch" style={{ background: color }} aria-hidden />
        <span>{name}</span>
      </h3>
      {o.subcategory && o.kind !== "growing_subcategory" && (
        <div className="health-sub savings-card-where">
          {[o.subcategory.category, o.subcategory.name].filter(Boolean).join(" › ")}
          {o.first_seen && <> · {s.since(shortMonth(o.first_seen))}</>}
        </div>
      )}

      <p className="savings-card-text">
        {o.kind === "growing_merchant" &&
          s.growingMerchant(
            money(o.monthly_now),
            money(o.monthly_before ?? 0),
            formatCount(o.count_now ?? 0),
            formatCount(o.count_before ?? 0),
            money(o.ticket_now ?? 0),
            o.ticket_before ? money(o.ticket_before) : null
          )}
        {o.kind === "frequent_small" && s.frequentSmall(formatCount(o.count_now ?? 0), money(o.ticket_now ?? 0), money(o.monthly_now))}
        {o.kind === "growing_subcategory" && (
          <>
            {s.growingSubcategory(money(o.monthly_now), money(o.monthly_before ?? 0))}{" "}
            {o.top_merchants && o.top_merchants.length > 0 && s.mostlyAt(o.top_merchants.map((m) => m.name).join(", "))}
          </>
        )}
        {o.kind === "fees" && s.fees(money(o.monthly_now), formatCount(o.count_now ?? 0))}
      </p>
      {o.kind === "fees" && o.items && (
        <ul className="savings-fee-items">
          {o.items.map((item) => (
            <li key={item.name}>
              <span>{item.name}</span>
              <span className="num">{money(item.total)}</span>
            </li>
          ))}
        </ul>
      )}

      <Sparkline series={o.series} highlight={periodMonths} usual={o.monthly_before} color={color} label={s.chart(name)} money={money} />

      <div className="savings-card-foot">
        <div className="savings-save">
          <strong>{s.save(money(o.potential_monthly))}</strong>
          <span>{s.saveYear(money(o.potential_monthly * 12))}</span>
        </div>
        {link && (
          <Link to={link} className="savings-link">
            {s.seeTransactions}
          </Link>
        )}
      </div>
    </li>
  );
}

/** Monthly totals of the last 12 months; the period's months in full color, the usual level as a dashed line. */
function Sparkline({
  series,
  highlight,
  usual,
  color,
  label,
  money,
}: {
  series: { month: string; total: number }[];
  highlight: number;
  usual?: number;
  color: string;
  label: string;
  money: (value: number) => string;
}) {
  const width = 240;
  const height = 48;
  const gap = 2;
  const max = Math.max(...series.map((point) => point.total), usual ?? 0, 1);
  const barWidth = (width - gap * (series.length - 1)) / series.length;
  const usualY = usual !== undefined ? height - (usual / max) * height : null;

  return (
    <figure className="savings-spark">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} preserveAspectRatio="none">
        {series.map((point, i) => {
          const h = point.total > 0 ? Math.max((point.total / max) * height, 2) : 0;
          const recent = i >= series.length - highlight;
          return (
            <rect
              key={point.month}
              x={i * (barWidth + gap)}
              y={height - h}
              width={barWidth}
              height={h}
              rx={2}
              fill={color}
              opacity={recent ? 1 : 0.35}
            >
              <title>{`${shortMonth(point.month)}: ${money(point.total)}`}</title>
            </rect>
          );
        })}
        {usualY !== null && <line x1={0} x2={width} y1={usualY} y2={usualY} stroke={INK.secondary} strokeDasharray="4 3" strokeWidth={1} />}
      </svg>
      <figcaption>
        <span>{shortMonth(series[0]?.month ?? "")}</span>
        <span>{shortMonth(series[series.length - 1]?.month ?? "")}</span>
      </figcaption>
    </figure>
  );
}
