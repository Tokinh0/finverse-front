import { FormEvent, useEffect, useState } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import { ApiError, transactionsApi } from "../../api";
import type { Category, RecategorizeResult, Transaction, TransactionType } from "../../types";
import { formatIsoDate } from "../../utils/dates";

interface Props {
  transaction: Transaction | null;
  /** pre-select this subcategory (e.g. when changing a suggestion) */
  initialSubcategoryId?: number;
  categories: Category[];
  showTotals: boolean;
  onHide: () => void;
  onSaved: (result: RecategorizeResult) => void;
}

/** matches the API's limit on a correction note */
const REASON_LIMIT = 300;

const TYPES: [TransactionType, string][] = [
  ["debit", "Debit (money out)"],
  ["credit", "Credit (money in)"],
  ["unknown", "Unknown"],
];

const errorText = (err: unknown) => {
  const errors = err instanceof ApiError ? (err.body as { errors?: string[] } | undefined)?.errors : undefined;
  return errors?.join(", ") || "Could not save the change.";
};

export default function RecategorizeModal({ transaction, initialSubcategoryId, categories, showTotals, onHide, onSaved }: Props) {
  const [subcategoryId, setSubcategoryId] = useState("");
  const [transactionType, setTransactionType] = useState<TransactionType>("debit");
  const [createKeyword, setCreateKeyword] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [applyToMatching, setApplyToMatching] = useState(true);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transaction) return;
    setSubcategoryId(String(initialSubcategoryId ?? transaction.subcategory?.id ?? ""));
    setTransactionType(transaction.transaction_type);
    setCreateKeyword(false);
    setKeyword(transaction.name.trim());
    setApplyToMatching(true);
    setReason("");
    setError(null);
  }, [transaction, initialSubcategoryId]);

  if (!transaction) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const result = await transactionsApi.recategorize(transaction.id, {
        subcategory_id: Number(subcategoryId),
        transaction_type: transactionType,
        ...(createKeyword && keyword.trim() ? { keyword: keyword.trim(), apply_to_matching: applyToMatching } : {}),
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
          <Modal.Title>Re-categorize transaction</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-grid gap-3">
          <div>
            <div className="fw-semibold text-break">{transaction.name}</div>
            <div className="text-muted small">
              {formatIsoDate(transaction.transaction_date)}
              {showTotals && ` · R$ ${transaction.amount.toFixed(2)}`}
              {transaction.subcategory && ` · now in ${transaction.category?.name} / ${transaction.subcategory.name}`}
            </div>
          </div>

          {error && <Alert variant="danger" className="mb-0">{error}</Alert>}

          <Form.Group controlId="recategorize-subcategory">
            <Form.Label>Subcategory</Form.Label>
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
            <Form.Label>Type</Form.Label>
            <Form.Select value={transactionType} onChange={(e) => setTransactionType(e.target.value as TransactionType)} disabled={saving}>
              {TYPES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group controlId="recategorize-reason">
            <Form.Label>Why? (optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              maxLength={REASON_LIMIT}
              placeholder="e.g. PIX to Maria is my monthly rent"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={saving}
            />
            <Form.Text>
              Saved with this change. Suggestions for similar transactions use it, and it's sent to Claude when a key is saved
              (long numbers are removed first).
            </Form.Text>
          </Form.Group>

          <Form.Check
            id="recategorize-create-keyword"
            type="checkbox"
            label="Create a keyword so future imports use this subcategory"
            checked={createKeyword}
            onChange={(e) => setCreateKeyword(e.target.checked)}
            disabled={saving}
          />
          {createKeyword && (
            <div className="d-grid gap-2 ps-4">
              <Form.Group controlId="recategorize-keyword">
                <Form.Label className="small mb-1">Keyword (text the transaction name contains)</Form.Label>
                <Form.Control value={keyword} onChange={(e) => setKeyword(e.target.value)} required disabled={saving} />
              </Form.Group>
              <Form.Check
                id="recategorize-apply"
                type="checkbox"
                label="Also move existing transactions this keyword matches best"
                checked={applyToMatching}
                onChange={(e) => setApplyToMatching(e.target.checked)}
                disabled={saving}
              />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="dark" disabled={saving || !subcategoryId}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
