import { FormEvent, useEffect, useState } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import { ApiError, transactionsApi } from "../../api";
import type { Category, RecategorizeResult, Transaction, TransactionType } from "../../types";
import { useI18n } from "../../i18n/context";
import { messages } from "../../i18n/locale";
import { parseAmountRange } from "../../utils/amountRange";
import AmountRangeFields from "../AmountRangeFields";
import { formatIsoDate } from "../../utils/dates";

interface Props {
  transaction: Transaction | null;
  /** pre-select this subcategory (e.g. when changing a suggestion) */
  initialSubcategoryId?: number;
  categories: Category[];
  showTotals: boolean;
  onHide: () => void;
  onSaved: (result: RecategorizeResult) => void;
  /** offers "No idea" for uncategorized transactions; called after marking it */
  onMarkedUnknown?: () => void;
}

/** matches the API's limit on a correction note */
const REASON_LIMIT = 300;

const TYPES: TransactionType[] = ["debit", "credit", "unknown"];

const errorText = (err: unknown) => {
  const errors = err instanceof ApiError ? (err.body as { errors?: string[] } | undefined)?.errors : undefined;
  return errors?.join(", ") || messages().recategorize.saveError;
};

export default function RecategorizeModal({
  transaction,
  initialSubcategoryId,
  categories,
  showTotals,
  onHide,
  onSaved,
  onMarkedUnknown,
}: Props) {
  const [subcategoryId, setSubcategoryId] = useState("");
  const [transactionType, setTransactionType] = useState<TransactionType>("debit");
  const [createKeyword, setCreateKeyword] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [applyToMatching, setApplyToMatching] = useState(true);
  const [reason, setReason] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const { t } = useI18n();
  const r = t.recategorize;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transaction) return;
    setSubcategoryId(String(initialSubcategoryId ?? transaction.subcategory?.id ?? ""));
    setTransactionType(transaction.transaction_type);
    setCreateKeyword(false);
    setKeyword(transaction.name.trim());
    setApplyToMatching(true);
    setReason("");
    setMinAmount("");
    setMaxAmount("");
    setError(null);
  }, [transaction, initialSubcategoryId]);

  if (!transaction) return null;

  const canMarkUnknown = onMarkedUnknown && transaction.categorization_source === "uncategorized" && !transaction.unknown_marked;

  const markUnknown = async () => {
    setSaving(true);
    setError(null);
    try {
      await transactionsApi.markUnknown(transaction.id);
      onMarkedUnknown?.();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const range = createKeyword ? parseAmountRange(minAmount, maxAmount) : null;
    if (typeof range === "string") {
      setError(range);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await transactionsApi.recategorize(transaction.id, {
        subcategory_id: Number(subcategoryId),
        transaction_type: transactionType,
        ...(createKeyword && keyword.trim() ? { keyword: keyword.trim(), apply_to_matching: applyToMatching } : {}),
        ...(createKeyword && range && (range.min_amount !== null || range.max_amount !== null) ? range : {}),
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      });
      onSaved(result);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show onHide={saving ? undefined : onHide} backdrop={saving ? "static" : true}>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton={!saving}>
          <Modal.Title>{r.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-grid gap-3">
          <div>
            <div className="fw-semibold text-break">{transaction.name}</div>
            <div className="text-muted small">
              {formatIsoDate(transaction.transaction_date)}
              {showTotals && ` · R$ ${transaction.amount.toFixed(2)}`}
              {transaction.subcategory && r.nowIn(`${transaction.category?.name} / ${transaction.subcategory.name}`)}
            </div>
          </div>

          {error && <Alert variant="danger" className="mb-0">{error}</Alert>}

          <Form.Group controlId="recategorize-subcategory">
            <Form.Label>{r.subcategory}</Form.Label>
            <Form.Select value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)} required disabled={saving}>
              {categories.map((category) => (
                <optgroup key={category.id} label={category.name}>
                  {category.subcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group controlId="recategorize-type">
            <Form.Label>{r.type}</Form.Label>
            <Form.Select value={transactionType} onChange={(e) => setTransactionType(e.target.value as TransactionType)} disabled={saving}>
              {TYPES.map((value) => (
                <option key={value} value={value}>
                  {r.typeOptions[value]}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group controlId="recategorize-reason">
            <Form.Label>{r.why}</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              maxLength={REASON_LIMIT}
              placeholder={r.whyPlaceholder}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={saving}
            />
            <Form.Text>{r.whyHelp}</Form.Text>
          </Form.Group>

          <Form.Check
            id="recategorize-create-keyword"
            type="checkbox"
            label={r.createKeyword}
            checked={createKeyword}
            onChange={(e) => setCreateKeyword(e.target.checked)}
            disabled={saving}
          />
          {createKeyword && (
            <div className="d-grid gap-2 ps-4">
              <Form.Group controlId="recategorize-keyword">
                <Form.Label className="small mb-1">{r.keywordLabel}</Form.Label>
                <Form.Control value={keyword} onChange={(e) => setKeyword(e.target.value)} required disabled={saving} />
              </Form.Group>
              <AmountRangeFields
                idPrefix="recategorize-amount"
                size="sm"
                min={minAmount}
                max={maxAmount}
                onChange={(min, max) => {
                  setMinAmount(min);
                  setMaxAmount(max);
                }}
                disabled={saving}
              />
              <Form.Check
                id="recategorize-apply"
                type="checkbox"
                label={r.applyToMatching}
                checked={applyToMatching}
                onChange={(e) => setApplyToMatching(e.target.checked)}
                disabled={saving}
              />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {canMarkUnknown && (
            <Button
              variant="link"
              className="me-auto text-secondary"
              onClick={markUnknown}
              disabled={saving}
              title={r.noIdeaTitle}
            >
              {r.noIdea}
            </Button>
          )}
          <Button variant="outline-secondary" onClick={onHide} disabled={saving}>
            {t.common.cancel}
          </Button>
          <Button type="submit" variant="dark" disabled={saving || !subcategoryId}>
            {saving ? t.common.saving : t.common.save}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
