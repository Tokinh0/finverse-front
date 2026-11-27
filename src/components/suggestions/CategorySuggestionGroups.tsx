import { useMemo, useState } from "react";
import { Badge, Button, Card, Form } from "react-bootstrap";
import type { Category, CategorySuggestion } from "../../types";
import { formatCurrency } from "../../utils/formatter";
import { confidenceLabel, groupByMerchant, originLabel } from "../../utils/suggestions";
import SubcategorySelect from "./SubcategorySelect";

interface Props {
  suggestions: CategorySuggestion[];
  categories: Category[];
  showTotals: boolean;
  acceptAll: (minConfidence: number) => Promise<void>;
  acceptMerchant: (merchantKey: string) => Promise<void>;
  acceptAs: (suggestions: CategorySuggestion[], subcategoryId: number) => Promise<void>;
  reject: (suggestions: CategorySuggestion[]) => Promise<void>;
}

const THRESHOLDS = [0.95, 0.9, 0.8, 0.7];

/** Pending category suggestions, one card per merchant, with bulk actions on top. */
export default function CategorySuggestionGroups({ suggestions, categories, showTotals, acceptAll, acceptMerchant, acceptAs, reject }: Props) {
  const [threshold, setThreshold] = useState(0.9);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [changing, setChanging] = useState<string | null>(null);
  const [changeTo, setChangeTo] = useState("");
  const groups = useMemo(() => groupByMerchant(suggestions), [suggestions]);
  const aboveThreshold = suggestions.filter((s) => s.confidence >= threshold).length;

  const run = async (key: string, action: () => Promise<void>) => {
    setBusyKey(key);
    try {
      await action();
    } finally {
      setBusyKey(null);
      setChanging(null);
    }
  };

  if (suggestions.length === 0) {
    return <p className="text-muted my-4 text-center">No transaction suggestions to review.</p>;
  }

  return (
    <div className="d-grid gap-3">
      <div className="d-flex flex-wrap align-items-center gap-2 border rounded p-2 bg-light" data-testid="bulk-bar">
        <span className="small">Accept every suggestion with confidence of at least</span>
        <Form.Select size="sm" aria-label="Minimum confidence" style={{ width: "auto" }} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))}>
          {THRESHOLDS.map((value) => (
            <option key={value} value={value}>
              {confidenceLabel(value)}
            </option>
          ))}
        </Form.Select>
        <Button size="sm" variant="success" disabled={aboveThreshold === 0 || busyKey !== null} onClick={() => run("bulk", () => acceptAll(threshold))}>
          Accept {aboveThreshold}
        </Button>
      </div>

      {groups.map((group) => {
        const key = `${group.merchantKey}|${group.suggestions[0].subcategory.id}`;
        const first = group.suggestions[0];
        const label = `${first.category.name} / ${first.subcategory.name}`;
        const total = group.suggestions.reduce((sum, s) => sum + (s.transaction?.amount ?? 0), 0);
        const busy = busyKey !== null;
        return (
          <Card key={key} data-testid="merchant-group">
            <Card.Body className="py-2">
              <div className="d-flex flex-wrap justify-content-between gap-2">
                <div>
                  <div className="fw-semibold text-break">{first.transaction?.name ?? group.merchantKey}</div>
                  <div className="small text-muted">
                    {group.suggestions.length} transaction{group.suggestions.length === 1 ? "" : "s"}
                    {showTotals && ` · ${formatCurrency(total)}`}
                  </div>
                </div>
                <div className="text-end">
                  <span className="rounded-pill px-2 small" style={{ border: "1px dashed #6c757d" }}>
                    <span
                      className="d-inline-block rounded-circle me-1"
                      style={{ width: 8, height: 8, background: first.subcategory.color_code || "#adb5bd" }}
                    />
                    {label}
                  </span>{" "}
                  <span className="small">{confidenceLabel(first.confidence)}</span>{" "}
                  <Badge bg={first.origin === "ai" ? "info" : "secondary"}>{originLabel(first.origin)}</Badge>
                  {first.reason && <div className="small text-muted">{first.reason}</div>}
                </div>
              </div>

              {changing === key ? (
                <div className="d-flex flex-wrap gap-2 mt-2">
                  <div style={{ minWidth: 240 }}>
                    <SubcategorySelect categories={categories} value={changeTo} onChange={setChangeTo} label="Move to" size="sm" disabled={busy} />
                  </div>
                  <Button size="sm" variant="dark" disabled={!changeTo || busy} onClick={() => run(key, () => acceptAs(group.suggestions, Number(changeTo)))}>
                    Move {group.suggestions.length}
                  </Button>
                  <Button size="sm" variant="outline-secondary" disabled={busy} onClick={() => setChanging(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="d-flex flex-wrap gap-2 mt-2">
                  <Button size="sm" variant="outline-success" disabled={busy} onClick={() => run(key, () => acceptMerchant(group.merchantKey))}>
                    Accept{group.suggestions.length > 1 ? ` all ${group.suggestions.length}` : ""}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    disabled={busy}
                    onClick={() => {
                      setChangeTo(String(first.subcategory.id));
                      setChanging(key);
                    }}
                  >
                    Change…
                  </Button>
                  <Button size="sm" variant="outline-danger" disabled={busy} onClick={() => run(key, () => reject(group.suggestions))}>
                    Reject
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        );
      })}
    </div>
  );
}
