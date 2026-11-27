import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import DoneAllOutlined from "@mui/icons-material/DoneAllOutlined";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import QuestionMarkOutlined from "@mui/icons-material/QuestionMarkOutlined";
import StorefrontOutlined from "@mui/icons-material/StorefrontOutlined";
import { useMemo, useState } from "react";
import { Badge, Button, Card, Form } from "react-bootstrap";
import type { Category, CategorySuggestion } from "../../types";
import { formatIsoDate } from "../../utils/dates";
import { formatCurrency } from "../../utils/formatter";
import { confidenceLabel, groupByMerchant, originHelp, originLabel } from "../../utils/suggestions";
import InfoTip from "./InfoTip";
import SubcategorySelect from "./SubcategorySelect";
import { useI18n } from "../../i18n/context";

interface Props {
  suggestions: CategorySuggestion[];
  categories: Category[];
  showTotals: boolean;
  acceptAll: (minConfidence: number) => Promise<void>;
  acceptMerchant: (merchantKey: string) => Promise<void>;
  acceptAs: (suggestions: CategorySuggestion[], subcategoryId: number) => Promise<void>;
  reject: (suggestions: CategorySuggestion[]) => Promise<void>;
  /** "no idea": keep them in Outros, mark them, stop suggesting (not a rejection) */
  dontKnow?: (suggestions: CategorySuggestion[]) => Promise<void>;
  /** opens the "new subcategory" dialog; `select` receives the created subcategory's id */
  onNewSubcategory?: (select: (subcategoryId: number) => void) => void;
}

const THRESHOLDS = [0.95, 0.9, 0.8, 0.7];
/** transactions listed per merchant before "+N more" */
const MAX_LISTED = 6;

/** Pending category suggestions, one card per merchant, with bulk actions on top. */
export default function CategorySuggestionGroups({
  suggestions,
  categories,
  showTotals,
  acceptAll,
  acceptMerchant,
  acceptAs,
  reject,
  dontKnow,
  onNewSubcategory,
}: Props) {
  const [threshold, setThreshold] = useState(0.9);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [changing, setChanging] = useState<string | null>(null);
  const [changeTo, setChangeTo] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const groups = useMemo(() => groupByMerchant(suggestions), [suggestions]);
  const { t } = useI18n();
  const g = t.suggestions.groups;
  const tips = t.suggestions.tips;
  const HIDDEN = t.common.hiddenAmount;
  const aboveThreshold = suggestions.filter((s) => s.confidence >= threshold).length;
  const money = (value: number) => (showTotals ? formatCurrency(value) : HIDDEN);

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
    return <p className="text-muted my-4 text-center">{g.empty}</p>;
  }

  return (
    <div className="d-grid gap-3">
      <div className="d-flex flex-wrap align-items-center gap-2 border rounded p-2 bg-light" data-testid="bulk-bar" data-guide="bulk-bar">
        <DoneAllOutlined fontSize="small" className="text-secondary" aria-hidden />
        <span className="small">{g.bulkLabel}</span>
        <Form.Select size="sm" aria-label={g.minimumConfidence} style={{ width: "auto" }} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))}>
          {THRESHOLDS.map((value) => (
            <option key={value} value={value}>
              {confidenceLabel(value)}
            </option>
          ))}
        </Form.Select>
        <Button size="sm" variant="success" disabled={aboveThreshold === 0 || busyKey !== null} onClick={() => run("bulk", () => acceptAll(threshold))}>
          {g.acceptCount(aboveThreshold)}
        </Button>
        <InfoTip label={tips.bulk}>{g.bulkHelp}</InfoTip>
      </div>

      {groups.map((group, index) => {
        const key = `${group.merchantKey}|${group.suggestions[0].subcategory.id}`;
        const first = group.suggestions[0];
        const label = `${first.category.name} / ${first.subcategory.name}`;
        const total = group.suggestions.reduce((sum, s) => sum + (s.transaction?.amount ?? 0), 0);
        const busy = busyKey !== null;
        const transactions = [...group.suggestions]
          .filter((s) => s.transaction)
          .sort((a, b) => (b.transaction!.transaction_date > a.transaction!.transaction_date ? 1 : -1));
        const isExpanded = expanded.has(key);
        const listed = isExpanded ? transactions : transactions.slice(0, MAX_LISTED);
        // Only the first card carries the guide markers.
        const guide = (name: string) => (index === 0 ? name : undefined);

        return (
          <Card key={key} data-testid="merchant-group">
            <Card.Body className="py-2">
              <div className="d-flex flex-wrap justify-content-between gap-2">
                <div data-guide={guide("merchant")}>
                  <div className="fw-semibold text-break d-flex align-items-center gap-1">
                    <StorefrontOutlined fontSize="small" className="text-secondary" aria-hidden />
                    {first.transaction?.name ?? group.merchantKey}
                  </div>
                  <div className="small text-muted">
                    {g.totalLine(t.common.transactions(group.suggestions.length), money(total))}
                  </div>
                </div>
                <div className="text-end">
                  <span className="rounded-pill px-2 small" style={{ border: "1px dashed #6c757d" }} data-guide={guide("suggested")}>
                    <span
                      className="d-inline-block rounded-circle me-1"
                      style={{ width: 8, height: 8, background: first.subcategory.color_code || "#adb5bd" }}
                    />
                    {label}
                  </span>{" "}
                  <span className="small text-nowrap" data-guide={guide("confidence")}>
                    {confidenceLabel(first.confidence)}{" "}
                    <InfoTip label={tips.confidence}>{g.confidenceHelp}</InfoTip>
                  </span>{" "}
                  <Badge bg={first.origin === "ai" ? "info" : "secondary"} title={originHelp(first.origin)} data-guide={guide("origin")}>
                    {first.origin === "ai" ? (
                      <AutoAwesomeOutlined sx={{ fontSize: 12 }} className="me-1" aria-hidden />
                    ) : (
                      <HistoryOutlined sx={{ fontSize: 12 }} className="me-1" aria-hidden />
                    )}
                    {originLabel(first.origin)}
                  </Badge>
                  {first.reason && (
                    <div className="small text-muted" data-guide={guide("reason")}>
                      {first.reason}
                    </div>
                  )}
                </div>
              </div>

              <ul className="list-unstyled small mb-0 mt-2 border-top pt-1" aria-label={g.transactionsFrom(first.transaction?.name ?? group.merchantKey)} data-guide={guide("transactions")}>
                {listed.map((s) => (
                  <li key={s.id} className="d-flex gap-3" data-testid="suggested-transaction">
                    <span className="text-muted text-nowrap" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {formatIsoDate(s.transaction!.transaction_date)}
                    </span>
                    <span className="text-break flex-grow-1">{s.transaction!.name}</span>
                    <span
                      className={`text-nowrap ${s.transaction!.transaction_type === "credit" ? "text-success" : ""}`}
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {money(s.transaction!.amount)}
                    </span>
                  </li>
                ))}
              </ul>
              {transactions.length > MAX_LISTED && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-0"
                  onClick={() =>
                    setExpanded((prev) => {
                      const next = new Set(prev);
                      if (next.has(key)) next.delete(key);
                      else next.add(key);
                      return next;
                    })
                  }
                >
                  {isExpanded ? g.showFewer : g.showMore(transactions.length - MAX_LISTED)}
                </Button>
              )}

              {changing === key ? (
                <div className="d-flex flex-wrap gap-2 mt-2">
                  <div style={{ minWidth: 240 }}>
                    <SubcategorySelect
                      categories={categories}
                      value={changeTo}
                      onChange={setChangeTo}
                      label={g.moveTo}
                      size="sm"
                      disabled={busy}
                      onCreateNew={onNewSubcategory && (() => onNewSubcategory((id) => setChangeTo(String(id))))}
                    />
                  </div>
                  <Button size="sm" variant="dark" disabled={!changeTo || busy} onClick={() => run(key, () => acceptAs(group.suggestions, Number(changeTo)))}>
                    {g.moveCount(group.suggestions.length)}
                  </Button>
                  <Button size="sm" variant="outline-secondary" disabled={busy} onClick={() => setChanging(null)}>
                    {t.common.cancel}
                  </Button>
                </div>
              ) : (
                <div className="d-flex flex-wrap gap-2 mt-2" data-guide={guide("actions")}>
                  <Button size="sm" variant="outline-success" disabled={busy} onClick={() => run(key, () => acceptMerchant(group.merchantKey))}>
                    {g.acceptAll(group.suggestions.length)}
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
                    {g.change}
                  </Button>
                  <Button size="sm" variant="outline-danger" disabled={busy} onClick={() => run(key, () => reject(group.suggestions))}>
                    {t.common.reject}
                  </Button>
                  {dontKnow && (
                    <>
                      <Button size="sm" variant="outline-secondary" disabled={busy} onClick={() => run(key, () => dontKnow(group.suggestions))}>
                        <QuestionMarkOutlined sx={{ fontSize: 14 }} className="me-1" aria-hidden />
                        {g.noIdea}
                      </Button>
                      <InfoTip label={tips.noIdea}>{g.noIdeaHelp}</InfoTip>
                    </>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        );
      })}
    </div>
  );
}
