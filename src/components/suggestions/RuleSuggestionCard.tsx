import AddCircleOutlineOutlined from "@mui/icons-material/AddCircleOutlineOutlined";
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import TuneOutlined from "@mui/icons-material/TuneOutlined";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import { useState, type ReactNode } from "react";
import { Badge, Button, Card, Form, Table } from "react-bootstrap";
import type { Category, Reapply, RuleSuggestion, SubcategoryRef } from "../../types";
import { formatIsoDate } from "../../utils/dates";
import { formatCurrency } from "../../utils/formatter";
import { amountInputValue, amountRangeLabel, parseAmountRange } from "../../utils/amountRange";
import { confidenceLabel, originHelp, originLabel, ruleTitle } from "../../utils/suggestions";
import AmountRangeFields from "../AmountRangeFields";
import InfoTip from "./InfoTip";
import SubcategorySelect from "./SubcategorySelect";
import { useI18n } from "../../i18n/context";
import { messages } from "../../i18n/locale";

interface Props {
  suggestion: RuleSuggestion;
  /** put the page-guide markers on this card */
  guide?: boolean;
  categories: Category[];
  showTotals: boolean;
  onAccept: (params: { name?: string; subcategory_id?: number; min_amount?: number | null; max_amount?: number | null; reapply: Reapply }) => Promise<void>;
  onReject: () => Promise<void>;
  /** opens the "new subcategory" dialog; `select` receives the created subcategory's id */
  onNewSubcategory?: (select: (subcategoryId: number) => void) => void;
}


const ACTION_ICONS: Record<RuleSuggestion["action"], ReactNode> = {
  create: <AddCircleOutlineOutlined sx={{ fontSize: 14 }} className="me-1" aria-hidden />,
  update: <EditOutlined sx={{ fontSize: 14 }} className="me-1" aria-hidden />,
  delete: <DeleteOutlineOutlined sx={{ fontSize: 14 }} className="me-1" aria-hidden />,
};

const subLabel = (sub: SubcategoryRef | null | undefined) => (sub ? `${sub.category} / ${sub.name}` : "—");

/** " (only up to R$ 99,99)" or "" */
const rangeSuffix = (rule: { min_amount?: number | null; max_amount?: number | null } | null | undefined) => {
  const label = amountRangeLabel(rule?.min_amount, rule?.max_amount);
  return label ? messages().amountRange.only(label) : "";
};

const REAPPLY_OPTIONS: Reapply[] = ["uncategorized", "all", "none"];

/** One proposed rule change: the rule, why, how sure, and exactly what it would move. */
export default function RuleSuggestionCard({ suggestion, guide = false, categories, showTotals, onAccept, onReject, onNewSubcategory }: Props) {
  const { t } = useI18n();
  const r = t.suggestions.rule;
  const tips = t.suggestions.tips;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(suggestion.proposed?.name ?? "");
  const [subcategoryId, setSubcategoryId] = useState(String(suggestion.proposed?.subcategory?.id ?? ""));
  const [reapply, setReapply] = useState<Reapply>(suggestion.action === "delete" ? "none" : "uncategorized");
  const [minAmount, setMinAmount] = useState(amountInputValue(suggestion.proposed?.min_amount));
  const [maxAmount, setMaxAmount] = useState(amountInputValue(suggestion.proposed?.max_amount));
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const preview = suggestion.preview;
  const mark = (name: string) => (guide ? name : undefined);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  const accept = () => {
    const range = editing && suggestion.action !== "delete" ? parseAmountRange(minAmount, maxAmount) : null;
    if (typeof range === "string") {
      setRangeError(range);
      return;
    }
    setRangeError(null);
    return run(() =>
      onAccept({
        ...(editing && name.trim() ? { name: name.trim() } : {}),
        ...(editing && subcategoryId ? { subcategory_id: Number(subcategoryId) } : {}),
        ...(range ?? {}),
        reapply,
      })
    );
  };

  const moveCount = reapply === "all" ? preview?.total ?? 0 : reapply === "uncategorized" ? preview?.counts.uncategorized ?? 0 : 0;

  return (
    <Card data-testid="rule-suggestion">
      <Card.Body className="d-grid gap-2">
        <div className="d-flex flex-wrap justify-content-between gap-2">
          <div data-guide={mark("rule")}>
            <Badge bg="dark" className="me-2">
              {ACTION_ICONS[suggestion.action]}
              {ruleTitle(suggestion.action)}
            </Badge>
            {suggestion.action === "create" && (
              <span>
                {r.contains} <code>{suggestion.proposed?.name}</code>
                {rangeSuffix(suggestion.proposed)} → <strong>{subLabel(suggestion.proposed?.subcategory)}</strong>
              </span>
            )}
            {suggestion.action === "update" && (
              <span>
                <code>{suggestion.keyword?.name}</code>
                {rangeSuffix(suggestion.keyword)} ({subLabel(suggestion.keyword?.subcategory)}) → <code>{suggestion.proposed?.name}</code>
                {rangeSuffix(suggestion.proposed)} (<strong>{subLabel(suggestion.proposed?.subcategory)}</strong>)
              </span>
            )}
            {suggestion.action === "delete" && (
              <span>
                {r.remove} <code>{suggestion.keyword?.name}</code> ({subLabel(suggestion.keyword?.subcategory)})
              </span>
            )}
          </div>
          <div className="small text-nowrap" data-guide={mark("confidence")}>
            {confidenceLabel(suggestion.confidence)}{" "}
            <InfoTip label={tips.confidence}>{r.confidenceHelp}</InfoTip>{" "}
            <Badge bg={suggestion.origin === "ai" ? "info" : "secondary"} title={originHelp(suggestion.origin)}>
              {suggestion.origin === "ai" ? (
                <AutoAwesomeOutlined sx={{ fontSize: 12 }} className="me-1" aria-hidden />
              ) : (
                <HistoryOutlined sx={{ fontSize: 12 }} className="me-1" aria-hidden />
              )}
              {originLabel(suggestion.origin)}
            </Badge>
          </div>
        </div>
        {suggestion.reason && (
          <div className="text-muted small" data-guide={mark("reason")}>
            {suggestion.reason}
          </div>
        )}

        {preview && (
          <div className="small" data-guide={mark("impact")}>
            <VisibilityOutlined sx={{ fontSize: 14 }} className="text-secondary me-1" aria-hidden />
            <span data-testid="rule-impact">
              {r.impact(preview.matched, preview.counts.uncategorized, preview.counts.keyword, preview.counts.kept)}
            </span>{" "}
            <InfoTip label={tips.impact}>{r.impactHelp}</InfoTip>{" "}
            {preview.transactions.length > 0 && (
              <Button variant="link" size="sm" className="p-0 align-baseline" onClick={() => setShowPreview((v) => !v)} aria-expanded={showPreview}>
                {showPreview ? r.hideAffected : r.showAffected}
              </Button>
            )}
            {showPreview && (
              <Table size="sm" responsive className="mt-2 mb-0">
                <thead>
                  <tr>
                    <th>{r.columns.date}</th>
                    <th>{r.columns.name}</th>
                    <th className="text-end">{r.columns.amount}</th>
                    <th>{r.columns.now}</th>
                    <th>{r.columns.after}</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.transactions.map((row) => (
                    <tr key={row.id} className={row.kept ? "text-muted" : undefined}>
                      <td className="text-nowrap">{formatIsoDate(row.transaction_date)}</td>
                      <td className="text-break">{row.name}</td>
                      <td className="text-end text-nowrap" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {showTotals ? formatCurrency(row.amount) : t.common.hiddenAmount}
                      </td>
                      <td>{subLabel(row.from)}</td>
                      <td>{row.kept ? r.kept : subLabel(row.to)}</td>
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
              aria-label={r.keyword}
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ maxWidth: 260 }}
              disabled={busy}
            />
            <div style={{ minWidth: 240 }}>
              <SubcategorySelect
                categories={categories}
                value={subcategoryId}
                onChange={setSubcategoryId}
                label={r.ruleSubcategory}
                size="sm"
                disabled={busy}
                onCreateNew={onNewSubcategory && (() => onNewSubcategory((id) => setSubcategoryId(String(id))))}
              />
            </div>
            <span className="small text-muted align-self-center">{r.previewUpdates}</span>
            <div className="w-100">
              <AmountRangeFields
                idPrefix={`rule-${suggestion.id}-amount`}
                size="sm"
                min={minAmount}
                max={maxAmount}
                onChange={(min, max) => {
                  setMinAmount(min);
                  setMaxAmount(max);
                }}
                disabled={busy}
              />
              {rangeError && <div className="text-danger small">{rangeError}</div>}
            </div>
          </div>
        )}

        {suggestion.action !== "delete" && (
          <Form.Group className="d-flex flex-wrap align-items-center gap-3 small" data-guide={mark("reapply")}>
            <span className="d-inline-flex align-items-center gap-1">
              <TuneOutlined sx={{ fontSize: 14 }} className="text-secondary" aria-hidden />
              {r.applyTo}
              <InfoTip label={tips.applyTo}>{r.applyToHelp}</InfoTip>
            </span>
            {REAPPLY_OPTIONS.map((value) => (
              <Form.Check
                key={value}
                inline
                type="radio"
                id={`reapply-${suggestion.id}-${value}`}
                name={`reapply-${suggestion.id}`}
                label={r.reapply[value]}
                checked={reapply === value}
                onChange={() => setReapply(value)}
                disabled={busy}
              />
            ))}
          </Form.Group>
        )}

        <div className="d-flex flex-wrap gap-2" data-guide={mark("rule-actions")}>
          <Button size="sm" variant="success" disabled={busy} onClick={accept}>
            {editing ? r.saveAndAccept : suggestion.action !== "delete" && moveCount > 0 ? r.acceptMoves(moveCount) : t.common.accept}
          </Button>
          {suggestion.action !== "delete" && !editing && (
            <Button size="sm" variant="outline-secondary" disabled={busy} onClick={() => setEditing(true)}>
              {r.editAndAccept}
            </Button>
          )}
          <Button size="sm" variant="outline-danger" disabled={busy} onClick={() => run(onReject)}>
            {t.common.reject}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
