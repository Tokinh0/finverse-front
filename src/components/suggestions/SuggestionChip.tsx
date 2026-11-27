import { Button } from "react-bootstrap";
import type { CategorySuggestion } from "../../types";
import { confidenceLabel, originLabel } from "../../utils/suggestions";

interface Props {
  suggestion: CategorySuggestion;
  busy?: boolean;
  onAccept: () => void;
  onChange: () => void;
  onReject: () => void;
}

/**
 * A pending suggestion shown next to a transaction. The dashed outline and the "Suggested" label
 * keep it visibly different from a confirmed category.
 */
export default function SuggestionChip({ suggestion, busy, onAccept, onChange, onReject }: Props) {
  const label = `${suggestion.category.name} / ${suggestion.subcategory.name}`;
  return (
    <div className="d-flex flex-wrap align-items-center gap-1 mt-1" data-testid="suggestion-chip">
      <span
        className="rounded-pill px-2 py-0 small"
        style={{ border: "1px dashed #6c757d", background: "#f8f9fa" }}
        title={[`Suggested by ${originLabel(suggestion.origin)}`, suggestion.reason].filter(Boolean).join(": ")}
      >
        <span className="text-muted">Suggested:</span> {label} · {confidenceLabel(suggestion.confidence)}
      </span>
      <Button size="sm" variant="outline-success" className="py-0 px-2" disabled={busy} onClick={onAccept} aria-label={`Accept ${label}`}>
        ✓
      </Button>
      <Button size="sm" variant="outline-secondary" className="py-0 px-2" disabled={busy} onClick={onChange} aria-label="Pick another subcategory">
        ✎
      </Button>
      <Button size="sm" variant="outline-danger" className="py-0 px-2" disabled={busy} onClick={onReject} aria-label={`Reject ${label}`}>
        ✕
      </Button>
    </div>
  );
}
