import { useState } from "react";
import { useI18n } from "../../i18n/context";
import { formatCurrency } from "../../utils/formatter";
import type { TypeAllocation } from "../../utils/portfolio";
import { formatPercent } from "../../utils/reportSlices";

interface Props {
  allocation: TypeAllocation[];
  colors: Map<string, string>;
  typeLabel: (type: string) => string;
  showTotals: boolean;
  /** the type the holdings are filtered by, if any */
  selected: string | null;
  onSelect: (type: string | null) => void;
}

/** Share of the portfolio by asset type: one 100% bar (hover for details) and a list that is also its legend and table. */
export default function AllocationCard({ allocation, colors, typeLabel, showTotals, selected, onSelect }: Props) {
  const { t } = useI18n();
  const pf = t.portfolio;
  const [hovered, setHovered] = useState<string | null>(null);
  const money = (value: number) => (showTotals ? formatCurrency(value) : t.common.hiddenAmount);
  const focus = hovered ? allocation.find((entry) => entry.type === hovered) : null;

  return (
    <section className="pf-card pf-allocation" aria-labelledby="pf-allocation-title">
      <header className="pf-card-head">
        <div>
          <h2 id="pf-allocation-title">{pf.allocationTitle}</h2>
          <p>{pf.allocationHint}</p>
        </div>
      </header>

      <div className="pf-bar-wrap">
        <div className="pf-bar" role="img" aria-label={pf.allocationLabel} onMouseLeave={() => setHovered(null)}>
          {allocation
            .filter((entry) => entry.share > 0)
            .map((entry) => (
              <span
                key={entry.type}
                className="pf-bar-segment"
                data-dimmed={(selected && selected !== entry.type) || (hovered && hovered !== entry.type) || undefined}
                style={{ flexGrow: entry.share, background: colors.get(entry.type) }}
                onMouseEnter={() => setHovered(entry.type)}
              />
            ))}
        </div>
        <p className="pf-readout" aria-live="polite">
          {focus ? (
            <>
              <span className="pf-dot" style={{ background: colors.get(focus.type) }} aria-hidden />
              <strong>{typeLabel(focus.type)}</strong>
              <span>{formatPercent(focus.share)}</span>
              <span className="pf-muted">
                {money(focus.value)} · {pf.holdingsCount(focus.count)}
              </span>
            </>
          ) : (
            <span className="pf-muted">{pf.allocationReadout}</span>
          )}
        </p>
      </div>

      <ul className="pf-types">
        {allocation.map((entry) => {
          const active = selected === entry.type;
          return (
            <li key={entry.type}>
              <button
                type="button"
                className="pf-type"
                aria-pressed={active}
                onClick={() => onSelect(active ? null : entry.type)}
                onMouseEnter={() => setHovered(entry.type)}
                onMouseLeave={() => setHovered(null)}
              >
                <span className="pf-dot" style={{ background: colors.get(entry.type) }} aria-hidden />
                <span className="pf-type-name">
                  <strong>{typeLabel(entry.type)}</strong>
                  <small>{pf.holdingsCount(entry.count)}</small>
                </span>
                <span className="pf-type-track" aria-hidden>
                  <span style={{ width: `${entry.share * 100}%`, background: colors.get(entry.type) }} />
                </span>
                <span className="pf-type-share">{formatPercent(entry.share)}</span>
                <span className="pf-type-value">{money(entry.value)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
