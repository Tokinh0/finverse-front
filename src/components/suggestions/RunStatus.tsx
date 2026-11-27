import { Alert, Button, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { isRunActive } from "../../hooks/suggestionsSummary";
import type { SuggestionsSummary } from "../../types";
import { runProblem } from "../../utils/suggestions";

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

  return (
    <div className="d-grid gap-2 mb-3">
      {!summary?.claude_configured && (
        <Alert variant="light" className="border mb-0 small">
          Suggestions come from your own history only. <Link to="/settings">Add a Claude API key</Link> to also get suggestions for
          merchants you haven't categorized before.
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
            Generating suggestions…
          </span>
        ) : (
          run?.finished_at && (
            <span className="text-muted small">
              Last run: {run.history_suggestions_count} from your history, {run.ai_suggestions_count} from Claude
              {run.ai_requests_count > 0 && ` (${run.ai_requests_count} request${run.ai_requests_count === 1 ? "" : "s"})`},{" "}
              {run.rule_suggestions_count} rule idea{run.rule_suggestions_count === 1 ? "" : "s"}.
            </span>
          )
        )}
        <Button size="sm" variant="outline-dark" className="ms-auto" disabled={active || starting} onClick={onSuggestAgain}>
          {starting ? "Starting..." : "Suggest again"}
        </Button>
      </div>
    </div>
  );
}
