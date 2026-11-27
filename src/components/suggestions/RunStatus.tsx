import { Alert, Button, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { isRunActive } from "../../hooks/suggestionsSummary";
import type { SuggestionsSummary } from "../../types";
import { runProblem } from "../../utils/suggestions";
import { useI18n } from "../../i18n/context";

interface Props {
  summary: SuggestionsSummary | null;
  starting: boolean;
  onSuggestAgain: () => void;
}

/** What the suggestion pipeline is doing, why it failed, and a way to run it again. */
export default function RunStatus({ summary, starting, onSuggestAgain }: Props) {
  const run = summary?.latest_run;
  const active = isRunActive(summary);
  const problem = runProblem(run);
  const r = useI18n().t.suggestions.run;

  return (
    <div className="d-grid gap-2 mb-3">
      {!summary?.claude_configured && (
        <Alert variant="light" className="border mb-0 small">
          {r.noKeyBefore} <Link to="/settings">{r.noKeyLink}</Link>
          {r.noKeyAfter}
        </Alert>
      )}
      {problem && (
        <Alert variant={run?.status === "failed" ? "danger" : "warning"} className="mb-0" data-testid="run-problem">
          {problem}
        </Alert>
      )}
      <div className="d-flex flex-wrap align-items-center gap-2">
        {active ? (
          <span className="text-muted" data-testid="run-active">
            <Spinner size="sm" className="me-2" />
            {r.generating}
          </span>
        ) : (
          run?.finished_at && (
            <span className="text-muted small">
              {r.last(run.history_suggestions_count, run.ai_suggestions_count, run.ai_requests_count, run.rule_suggestions_count)}
            </span>
          )
        )}
        <Button size="sm" variant="outline-dark" className="ms-auto" disabled={active || starting} onClick={onSuggestAgain}>
          {starting ? r.starting : r.suggestAgain}
        </Button>
      </div>
    </div>
  );
}
