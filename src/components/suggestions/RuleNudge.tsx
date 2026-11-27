import { useState } from "react";
import { Alert, Button } from "react-bootstrap";
import { suggestionsApi } from "../../api";
import type { RuleSuggestion } from "../../types";

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

  const answer = async (action: () => Promise<{ updated_count: number }>, message: (moved: number) => string) => {
    setBusy(true);
    setError(null);
    try {
      const result = await action();
      onDone(message(result.updated_count));
    } catch (err) {
      console.error(err);
      setError("Could not save that. Try again.");
      setBusy(false);
    }
  };

  return (
    <Alert variant="info" dismissible onClose={() => onDone()} data-testid="rule-nudge">
      <div className="mb-2">
        <strong>Create a rule for this?</strong> {suggestion.reason}. A rule would put descriptions containing{" "}
        <code>{suggestion.proposed?.name}</code> in <strong>{sub ? `${sub.category} / ${sub.name}` : "this subcategory"}</strong> automatically.
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
              (moved) => `Rule "${suggestion.proposed?.name}" created.${moved > 0 ? ` ${moved} more transaction(s) moved.` : ""}`
            )
          }
        >
          Create rule
        </Button>
        <Button
          size="sm"
          variant="outline-secondary"
          disabled={busy}
          onClick={() => answer(() => suggestionsApi.rejectRule(suggestion.id), () => "OK, no rule for this one.")}
        >
          No thanks
        </Button>
      </div>
    </Alert>
  );
}
