import type { Delta } from "../../utils/health";
import { INK } from "../../utils/health";

interface Props {
  label: string;
  value: string;
  delta?: Delta;
  /** e.g. "vs Apr–Jun" */
  comparison?: string;
  hero?: boolean;
  hint?: string;
}

export function DeltaText({ delta }: { delta: Delta }) {
  const color = delta.tone === "good" ? INK.good : delta.tone === "bad" ? INK.bad : INK.secondary;
  return (
    <span style={{ color, fontWeight: 600, whiteSpace: "nowrap" }} aria-label={`${delta.label} ${delta.text.replace(/[↑↓→]/g, "").trim()}`}>
      {delta.text}
    </span>
  );
}

export default function StatTile({ label, value, delta, comparison, hero = false, hint }: Props) {
  return (
    <div className="health-tile" data-hero={hero || undefined}>
      <div className="health-tile-label">{label}</div>
      <div className={hero ? "health-hero-value" : "health-tile-value"}>{value}</div>
      {(delta || hint) && (
        <div className="health-tile-meta">
          {delta && <DeltaText delta={delta} />} {comparison && <span>{comparison}</span>}
          {hint && <div>{hint}</div>}
        </div>
      )}
    </div>
  );
}
