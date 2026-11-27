import { Button } from "react-bootstrap";
import type { CategorySuggestion } from "../../types";
import { confidenceLabel, originLabel } from "../../utils/suggestions";
import { useI18n } from "../../i18n/context";

interface Props {
  suggestion: CategorySuggestion;
  busy?: boolean;
  onAccept: () => void;
  onChange: () => void;
  onReject: () => void;
  /** "no idea": keep it in Outros and stop suggesting */
  onDontKnow?: () => void;
}

/**
 * A pending suggestion shown next to a transaction. The dashed outline and the "Suggested" label
 * keep it visibly different from a confirmed category.
 */
export default function SuggestionChip({ suggestion, busy, onAccept, onChange, onReject, onDontKnow }: Props) {
  const c = useI18n().t.suggestions.chip;
  const label = `${suggestion.category.name} / ${suggestion.subcategory.name}`;
  return (
    <div className="d-flex flex-wrap align-items-center gap-1 mt-1" data-testid="suggestion-chip">
      <span
        className="rounded-pill px-2 py-0 small"
        style={{ border: "1px dashed #6c757d", background: "#f8f9fa" }}
        title={[c.suggestedBy(originLabel(suggestion.origin)), suggestion.reason].filter(Boolean).join(": ")}
      >
        <span className="text-muted">{c.suggested}</span> {label} · {confidenceLabel(suggestion.confidence)}
      </span>
      <Button size="sm" variant="outline-success" className="py-0 px-2" disabled={busy} onClick={onAccept} aria-label={c.accept(label)}>
        ✓
      </Button>
      <Button size="sm" variant="outline-secondary" className="py-0 px-2" disabled={busy} onClick={onChange} aria-label={c.pickAnother}>
        ✎
      </Button>
      <Button size="sm" variant="outline-danger" className="py-0 px-2" disabled={busy} onClick={onReject} aria-label={c.reject(label)}>
        ✕
      </Button>
      {onDontKnow && (
        <Button
          size="sm"
          variant="outline-secondary"
          className="py-0 px-2"
          disabled={busy}
          onClick={onDontKnow}
          aria-label={c.noIdea}
          title={c.noIdeaTitle}
        >
          ?
        </Button>
      )}
    </div>
  );
}
