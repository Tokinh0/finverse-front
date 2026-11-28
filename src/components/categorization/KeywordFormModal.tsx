import { FormEvent, useState } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import { keywordsApi } from "../../api";
import { useI18n } from "../../i18n/context";
import type { Category, Keyword } from "../../types";
import { amountInputValue, parseAmountRange } from "../../utils/amountRange";
import { errorText } from "../../utils/categorization";
import AmountRangeFields from "../AmountRangeFields";

interface Props {
  /** the rule to edit, or null to create one */
  keyword: Keyword | null;
  categories: Category[];
  /** preselected subcategory for a new rule */
  subcategoryId?: number;
  onHide: () => void;
  onSaved: (keyword: Keyword) => void;
}

/** Creates or edits a keyword rule. Mount it only while it's open, so it starts from `keyword`. */
export default function KeywordFormModal({ keyword, categories, subcategoryId, onHide, onSaved }: Props) {
  const { t } = useI18n();
  const k = t.keywords;
  const [name, setName] = useState(keyword?.name ?? "");
  const [subcategory, setSubcategory] = useState(String(keyword?.subcategory_id ?? subcategoryId ?? ""));
  const [min, setMin] = useState(amountInputValue(keyword?.min_amount));
  const [max, setMax] = useState(amountInputValue(keyword?.max_amount));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subcategory) return setError(k.fillAll);
    const range = parseAmountRange(min, max);
    if (typeof range === "string") return setError(range);

    setSaving(true);
    setError(null);
    const params = { name: name.trim(), subcategory_id: Number(subcategory), ...range };
    try {
      onSaved(keyword ? await keywordsApi.update(keyword.id, params) : await keywordsApi.create(params));
    } catch (err) {
      console.error(err);
      setError(errorText(err, keyword ? k.updateFailed : k.createFailed));
      setSaving(false);
    }
  };

  return (
    <Modal show onHide={saving ? undefined : onHide} backdrop={saving ? "static" : true} centered aria-labelledby="keyword-form-title">
      <Form onSubmit={submit} noValidate>
        <Modal.Header closeButton={!saving}>
          <Modal.Title id="keyword-form-title">{keyword ? k.editTitle : k.newTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">{keyword ? k.editDescription : k.newDescription}</p>
          {error && (
            <Alert variant="danger" className="py-2">
              {error}
            </Alert>
          )}
          <Form.Group className="mb-3" controlId="keyword-name">
            <Form.Label>{k.name}</Form.Label>
            <Form.Control
              placeholder={k.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
              autoFocus
            />
          </Form.Group>
          <Form.Group controlId="keyword-subcategory">
            <Form.Label>{k.subcategory}</Form.Label>
            <Form.Select value={subcategory} onChange={(e) => setSubcategory(e.target.value)} disabled={saving}>
              <option value="" disabled>
                {k.selectSubcategory}
              </option>
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
          <div className="mt-3">
            <AmountRangeFields
              idPrefix="keyword-amount"
              min={min}
              max={max}
              onChange={(nextMin, nextMax) => {
                setMin(nextMin);
                setMax(nextMax);
              }}
              disabled={saving}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide} disabled={saving}>
            {t.common.cancel}
          </Button>
          <Button type="submit" variant="dark" disabled={saving}>
            {saving ? t.common.saving : keyword ? k.update : k.addButton}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
