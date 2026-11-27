import { useState } from "react";
import { Badge, Button, Card, Form, Table } from "react-bootstrap";
import type { Category, Reapply, RuleSuggestion, SubcategoryRef } from "../../types";
import { formatIsoDate } from "../../utils/dates";
import { formatCurrency } from "../../utils/formatter";
import { confidenceLabel, originLabel, RULE_TITLES } from "../../utils/suggestions";
import SubcategorySelect from "./SubcategorySelect";

interface Props {
  suggestion: RuleSuggestion;
  categories: Category[];
  showTotals: boolean;
  onAccept: (params: { name?: string; subcategory_id?: number; reapply: Reapply }) => Promise<void>;
  onReject: () => Promise<void>;
}

const subLabel = (sub: SubcategoryRef | null | undefined) => (sub ? `${sub.category} / ${sub.name}` : "—");

const REAPPLY_OPTIONS: [Reapply, string][] = [
  ["uncategorized", "Uncategorized transactions"],
  ["all", "Also transactions other rules matched"],
  ["none", "Future imports only"],
];

/** One proposed rule change: the rule, why, how sure, and exactly what it would move. */
export default function RuleSuggestionCard({ suggestion, categories, showTotals, onAccept, onReject }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(suggestion.proposed?.name ?? "");
  const [subcategoryId, setSubcategoryId] = useState(String(suggestion.proposed?.subcategory?.id ?? ""));
  const [reapply, setReapply] = useState<Reapply>(suggestion.action === "delete" ? "none" : "uncategorized");
  const [showPreview, setShowPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const preview = suggestion.preview;

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  const accept = () =>
    run(() =>
      onAccept({
        ...(editing && name.trim() ? { name: name.trim() } : {}),
        ...(editing && subcategoryId ? { subcategory_id: Number(subcategoryId) } : {}),
        reapply,
      })
    );

  const moveCount = reapply === "all" ? preview?.total ?? 0 : reapply === "uncategorized" ? preview?.counts.uncategorized ?? 0 : 0;

  return (
    <Card data-testid="rule-suggestion">
      <Card.Body className="d-grid gap-2">
        <div className="d-flex flex-wrap justify-content-between gap-2">
          <div>
            <Badge bg="dark" className="me-2">
              {RULE_TITLES[suggestion.action]}
            </Badge>
            {suggestion.action === "create" && (
              <span>
                Descriptions containing <code>{suggestion.proposed?.name}</code> → <strong>{subLabel(suggestion.proposed?.subcategory)}</strong>
              </span>
            )}
            {suggestion.action === "update" && (
              <span>
                <code>{suggestion.keyword?.name}</code> ({subLabel(suggestion.keyword?.subcategory)}) → <code>{suggestion.proposed?.name}</code>{" "}
                (<strong>{subLabel(suggestion.proposed?.subcategory)}</strong>)
              </span>
            )}
            {suggestion.action === "delete" && (
              <span>
                Remove <code>{suggestion.keyword?.name}</code> ({subLabel(suggestion.keyword?.subcategory)})
              </span>
            )}
          </div>
          <div className="small text-nowrap">
            {confidenceLabel(suggestion.confidence)} <Badge bg={suggestion.origin === "ai" ? "info" : "secondary"}>{originLabel(suggestion.origin)}</Badge>
          </div>
        </div>
        {suggestion.reason && <div className="text-muted small">{suggestion.reason}</div>}

        {preview && (
          <div className="small">
            <span data-testid="rule-impact">
              Matches {preview.matched} transaction{preview.matched === 1 ? "" : "s"}: {preview.counts.uncategorized} uncategorized,{" "}
              {preview.counts.keyword} from other rules
              {preview.counts.kept > 0 && `, ${preview.counts.kept} you categorized yourself (kept as they are)`}.
            </span>{" "}
            {preview.transactions.length > 0 && (
              <Button variant="link" size="sm" className="p-0 align-baseline" onClick={() => setShowPreview((v) => !v)} aria-expanded={showPreview}>
                {showPreview ? "Hide" : "Show"} affected transactions
              </Button>
            )}
            {showPreview && (
              <Table size="sm" responsive className="mt-2 mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Name</th>
                    {showTotals && <th className="text-end">Amount</th>}
                    <th>Now</th>
                    <th>After</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.transactions.map((row) => (
                    <tr key={row.id} className={row.kept ? "text-muted" : undefined}>
                      <td className="text-nowrap">{formatIsoDate(row.transaction_date)}</td>
                      <td className="text-break">{row.name}</td>
                      {showTotals && <td className="text-end text-nowrap">{formatCurrency(row.amount)}</td>}
                      <td>{subLabel(row.from)}</td>
                      <td>{row.kept ? "Kept (your choice)" : subLabel(row.to)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        )}

        {editing && suggestion.action !== "delete" && (
          <div className="d-flex flex-wrap gap-2">
            <Form.Control
              size="sm"
              aria-label="Keyword"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ maxWidth: 260 }}
              disabled={busy}
            />
            <div style={{ minWidth: 240 }}>
              <SubcategorySelect categories={categories} value={subcategoryId} onChange={setSubcategoryId} label="Rule subcategory" size="sm" disabled={busy} />
            </div>
            <span className="small text-muted align-self-center">The preview updates after saving.</span>
          </div>
        )}

        {suggestion.action !== "delete" && (
          <Form.Group className="d-flex flex-wrap align-items-center gap-3 small">
            <span>Apply to:</span>
            {REAPPLY_OPTIONS.map(([value, label]) => (
              <Form.Check
                key={value}
                inline
                type="radio"
                id={`reapply-${suggestion.id}-${value}`}
                name={`reapply-${suggestion.id}`}
                label={label}
                checked={reapply === value}
                onChange={() => setReapply(value)}
                disabled={busy}
              />
            ))}
          </Form.Group>
        )}

        <div className="d-flex flex-wrap gap-2">
          <Button size="sm" variant="success" disabled={busy} onClick={accept}>
            {editing ? "Save & accept" : "Accept"}
            {suggestion.action !== "delete" && moveCount > 0 && !editing ? ` (moves ${moveCount})` : ""}
          </Button>
          {suggestion.action !== "delete" && !editing && (
            <Button size="sm" variant="outline-secondary" disabled={busy} onClick={() => setEditing(true)}>
              Edit & accept
            </Button>
          )}
          <Button size="sm" variant="outline-danger" disabled={busy} onClick={() => run(onReject)}>
            Reject
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
