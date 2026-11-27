import type { HealthCategory } from "../../types";
import { formatCurrency } from "../../utils/formatter";
import { delta, formatPct } from "../../utils/health";
import { DeltaText } from "./StatTile";
import { useI18n } from "../../i18n/context";

interface Props {
  categories: HealthCategory[];
  colors: Map<number, string>;
  showTotals: boolean;
  comparison: string;
}

// Labels inside a fill are white, except near-black on the yellow slot.
const labelInk = (color: string) => (color.toLowerCase() === "#f2a600" ? "#0b0b0b" : "#ffffff");

export default function CategoryRanking({ categories, colors, showTotals, comparison }: Props) {
  const { t } = useI18n();
  const HIDDEN = t.common.hiddenAmount;
  const spending = categories.filter((c) => c.total > 0);
  if (spending.length === 0) return <p className="health-sub">{t.health.noSpending}</p>;

  const max = Math.max(...spending.map((c) => c.total));

  return (
    <div className="health-grid">
      <div
        className="health-segbar"
        role="img"
        aria-label={t.health.shareOfSpending(spending.map((c) => `${c.name} ${formatPct(c.share)}`).join(", "))}
      >
        {spending.map((c) => {
          const color = colors.get(c.id) ?? "#9a9a9a";
          return (
            <div
              key={c.id}
              style={{ flexGrow: c.share, flexBasis: 0, background: color, color: labelInk(color) }}
              title={`${c.name}: ${formatPct(c.share, 1)}${showTotals ? ` · ${formatCurrency(c.total)}` : ""}`}
            >
              {c.share >= 0.08 ? formatPct(c.share) : ""}
            </div>
          );
        })}
      </div>

      <div className="health-rank">
        {spending.map((c) => {
          const color = colors.get(c.id) ?? "#9a9a9a";
          const change = delta(c.change_pct, false, true);
          return (
            <div key={c.id} className="health-rank-row" data-testid="category-row">
              <div className="health-rank-name">
                <span className="health-swatch" style={{ background: color }} />
                <span>{c.name}</span>
              </div>
              <div className="text-nowrap" style={{ fontVariantNumeric: "tabular-nums" }}>
                <strong>{showTotals ? formatCurrency(c.total) : HIDDEN}</strong>{" "}
                <span className="health-sub d-inline">{formatPct(c.share)}</span>{" "}
                <span title={comparison}>
                  <DeltaText delta={change} />
                </span>
              </div>
              <div className="health-rank-track" aria-hidden="true">
                <div style={{ width: `${(c.total / max) * 100}%`, background: color }} />
              </div>
              {c.subcategories.length > 0 && (
                <div className="health-rank-subs">
                  {c.subcategories
                    .slice(0, 3)
                    .map((s) => (showTotals ? `${s.name} ${formatCurrency(s.total)}` : s.name))
                    .join(" · ")}
                  {c.subcategories.length > 3 ? t.health.more(c.subcategories.length - 3) : ""}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
