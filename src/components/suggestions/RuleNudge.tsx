import { useState } from "react";
import { Alert, Button } from "react-bootstrap";
import { suggestionsApi } from "../../api";
import type { RuleSuggestion } from "../../types";
import { useI18n } from "../../i18n/context";

interface Props {
  suggestion: RuleSuggestion;
  /** called after the owner answered (or closed it); `message` describes what happened */
  onDone: (message?: string) => void;
}

/** "Create a rule for this?", shown right after the owner fixed the same merchant a few times. */
export default function RuleNudge({ suggestion, onDone }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sub = suggestion.proposed?.subcategory;
  const n = useI18n().t.suggestions.nudge;

  const answer = async (action: () => Promise<{ updated_count: number }>, message: (moved: number) => string) => {
    setBusy(true);
    setError(null);
    try {
      const result = await action();
      onDone(message(result.updated_count));
    } catch (err) {
      console.error(err);
      setError(n.error);
      setBusy(false);
    }
  };

  return (
    <Alert variant="info" dismissible onClose={() => onDone()} data-testid="rule-nudge">
      <div className="mb-2">
        <strong>{n.title}</strong> {suggestion.reason}. {n.wouldPut} <code>{suggestion.proposed?.name}</code> {n.in}{" "}
        <strong>{sub ? `${sub.category} / ${sub.name}` : n.thisSubcategory}</strong> {n.automatically}
      </div>
      {error && <div className="text-danger small mb-2">{error}</div>}
      <div className="d-flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="dark"
          disabled={busy}
          onClick={() =>
            answer(
              () => suggestionsApi.acceptRule(suggestion.id, { reapply: "uncategorized" }),
              (moved) => n.created(suggestion.proposed?.name ?? "", moved)
            )
          }
        >
          {n.create}
        </Button>
        <Button
          size="sm"
          variant="outline-secondary"
          disabled={busy}
          onClick={() => answer(() => suggestionsApi.rejectRule(suggestion.id), () => n.declined)}
        >
          {n.decline}
        </Button>
      </div>
    </Alert>
  );
}
