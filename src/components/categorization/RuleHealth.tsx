import { Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import type { Messages } from "../../i18n/en";
import { useI18n } from "../../i18n/context";
import type { KeywordHealth, KeywordHealthFlag } from "../../types";

const FLAG_BADGES: Record<KeywordHealthFlag, string> = { overridden: "danger", overlapping: "warning", unused: "secondary" };

function flagText(flag: KeywordHealthFlag, health: KeywordHealth, k: Messages["keywords"]) {
  if (flag === "overridden") return { label: k.overridden(health.overrides), hint: k.overridenHint };
  if (flag === "overlapping") return { label: k.overlaps, hint: k.overlapsHint };
  return { label: k.neverMatches, hint: k.neverMatchesHint };
}

/** How often a rule matches, what's wrong with it and a link to a suggested fix. */
export default function RuleHealth({ health }: { health?: KeywordHealth }) {
  const k = useI18n().t.keywords;
  if (!health) return null;
  return (
    <span className="cz-health">
      <span className="text-muted">{k.matches(health.matches)}</span>
      {health.flags.map((flag) => {
        const { label, hint } = flagText(flag, health, k);
        return (
          <Badge key={flag} bg={FLAG_BADGES[flag]} text={flag === "overlapping" ? "dark" : undefined} title={hint}>
            {label}
          </Badge>
        );
      })}
      {health.pending_suggestion_ids.length > 0 && <Link to="/suggestions?tab=rules">{k.suggestedFix}</Link>}
    </span>
  );
}
