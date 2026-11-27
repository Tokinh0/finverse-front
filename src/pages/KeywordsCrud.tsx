import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Container, Form, Modal, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { keywordsApi, subcategoriesApi } from "../api";
import AmountRangeFields from "../components/AmountRangeFields";
import { Loading } from "../components/LoadingState";
import { useI18n } from "../i18n/context";
import { messages } from "../i18n/locale";
import type { Messages } from "../i18n/en";
import type { Keyword, KeywordHealth, KeywordHealthFlag, Subcategory } from "../types";
import { amountInputValue, amountRangeLabel, parseAmountRange } from "../utils/amountRange";

type FormState = { name: string; subcategory_id: string; min_amount: string; max_amount: string };

const EMPTY_FORM: FormState = { name: "", subcategory_id: "", min_amount: "", max_amount: "" };

const errorMessage = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

const FLAG_BADGES: Record<KeywordHealthFlag, string> = { overridden: "danger", overlapping: "warning", unused: "secondary" };

function flagText(flag: KeywordHealthFlag, health: KeywordHealth, t: Messages["keywords"]) {
  if (flag === "overridden") return { label: t.overridden(health.overrides), hint: t.overridenHint };
  if (flag === "overlapping") return { label: t.overlaps, hint: t.overlapsHint };
  return { label: t.neverMatches, hint: t.neverMatchesHint };
}

export default function KeywordsCrud() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [health, setHealth] = useState<Map<number, KeywordHealth>>(new Map());
  const [needsAttention, setNeedsAttention] = useState(false);
  const { t } = useI18n();
  const k = t.keywords;

  const subcategoryNames = useMemo(() => new Map(subcategories.map((s) => [s.id, s.name])), [subcategories]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [keywordsData, subcategoriesData] = await Promise.all([keywordsApi.list(), subcategoriesApi.list()]);
      setKeywords(keywordsData);
      setSubcategories(subcategoriesData);
    } catch (err) {
      console.error(err);
      setError(errorMessage(err, messages().keywords.loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Health is extra information: the page works without it.
  useEffect(() => {
    keywordsApi
      .health()
      .then((entries) => setHealth(new Map(entries.map((entry) => [entry.keyword_id, entry]))))
      .catch((err) => console.error(err));
  }, [keywords]);

  const flagged = (keyword: Keyword) => (health.get(keyword.id)?.flags.length ?? 0) > 0;
  const visibleKeywords = needsAttention ? keywords.filter(flagged) : keywords;
  const attentionCount = keywords.filter(flagged).length;

  const openDialog = (keyword: Keyword | null) => {
    setEditingKeyword(keyword);
    setFormData(
      keyword
        ? {
            name: keyword.name,
            subcategory_id: String(keyword.subcategory_id),
            min_amount: amountInputValue(keyword.min_amount),
            max_amount: amountInputValue(keyword.max_amount),
          }
        : EMPTY_FORM
    );
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    if (isSubmitting) return;
    setIsDialogOpen(false);
    setEditingKeyword(null);
    setFormData(EMPTY_FORM);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(k.confirmDelete)) return;

    try {
      await keywordsApi.remove(id);
      setKeywords((prev) => prev.filter((keyword) => keyword.id !== id));
    } catch (err) {
      console.error(err);
      alert(errorMessage(err, k.deleteFailed));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.subcategory_id) {
      alert(k.fillAll);
      return;
    }

    const range = parseAmountRange(formData.min_amount, formData.max_amount);
    if (typeof range === "string") {
      alert(range);
      return;
    }
    const params = { name: formData.name, subcategory_id: Number(formData.subcategory_id), ...range };
    setIsSubmitting(true);
    try {
      const saved = editingKeyword ? await keywordsApi.update(editingKeyword.id, params) : await keywordsApi.create(params);
      setKeywords((prev) => (editingKeyword ? prev.map((k) => (k.id === saved.id ? saved : k)) : [...prev, saved]));
      setIsDialogOpen(false);
      setEditingKeyword(null);
      setFormData(EMPTY_FORM);
    } catch (err) {
      console.error(err);
      alert(editingKeyword ? k.updateFailed : k.createFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const subcategoryName = (keyword: Keyword) =>
    keyword.subcategory?.name ?? subcategoryNames.get(keyword.subcategory_id) ?? k.unknownSubcategory;

  if (loading) return <Loading message={k.loading} />;

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <p className="fw-medium mb-1">{k.loadFailedTitle}</p>
          <p className="mb-0">{error}</p>
        </Alert>
        <Button variant="outline-secondary" onClick={loadData}>
          {t.common.tryAgain}
        </Button>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="mb-4 d-flex align-items-center justify-content-between border rounded p-3">
        <h2 className="mb-0">{k.title}</h2>
        <Button variant="outline-dark" onClick={() => openDialog(null)}>
          {k.add}
        </Button>
      </div>

      <Modal show={isDialogOpen} onHide={closeDialog} backdrop={isSubmitting ? "static" : true}>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton={!isSubmitting}>
            <Modal.Title>{editingKeyword ? k.editTitle : k.newTitle}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="text-muted">
              {editingKeyword ? k.editDescription : k.newDescription}
            </p>
            <Form.Group className="mb-3" controlId="keyword-name">
              <Form.Label>{k.name}</Form.Label>
              <Form.Control
                placeholder={k.namePlaceholder}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </Form.Group>
            <Form.Group controlId="keyword-subcategory">
              <Form.Label>{k.subcategory}</Form.Label>
              <Form.Select
                value={formData.subcategory_id}
                onChange={(e) => setFormData({ ...formData, subcategory_id: e.target.value })}
                required
                disabled={isSubmitting}
              >
                <option value="" disabled>
                  {k.selectSubcategory}
                </option>
                {subcategories.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <div className="mt-3">
              <AmountRangeFields
                idPrefix="keyword-amount"
                min={formData.min_amount}
                max={formData.max_amount}
                onChange={(min, max) => setFormData({ ...formData, min_amount: min, max_amount: max })}
                disabled={isSubmitting}
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={closeDialog} disabled={isSubmitting}>
              {t.common.cancel}
            </Button>
            <Button type="submit" variant="dark" disabled={isSubmitting}>
              {isSubmitting ? t.common.saving : editingKeyword ? k.update : k.addButton}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {health.size > 0 && (
        <div className="d-flex align-items-center gap-3 mb-2">
          <Form.Check
            type="switch"
            id="keywords-needs-attention"
            label={k.needsAttention(attentionCount)}
            checked={needsAttention}
            onChange={(e) => setNeedsAttention(e.target.checked)}
          />
        </div>
      )}

      <Table bordered hover responsive>
        <thead>
          <tr>
            <th>{k.columns.id}</th>
            <th>{k.columns.name}</th>
            <th>{k.columns.subcategory}</th>
            <th>{k.columns.amounts}</th>
            <th>{k.columns.health}</th>
            <th className="text-end">{k.columns.actions}</th>
          </tr>
        </thead>
        <tbody>
          {visibleKeywords.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center text-muted">
                {needsAttention ? k.allHealthy : k.empty}
              </td>
            </tr>
          ) : (
            visibleKeywords.map((keyword) => (
              <tr key={keyword.id}>
                <td className="fw-medium">{keyword.id}</td>
                <td>{keyword.name}</td>
                <td>{subcategoryName(keyword)}</td>
                <td className="text-nowrap small">{amountRangeLabel(keyword.min_amount, keyword.max_amount) || <span className="text-muted">{t.common.any}</span>}</td>
                <td data-testid={`health-${keyword.id}`}>
                  <HealthCell health={health.get(keyword.id)} />
                </td>
                <td>
                  <div className="d-flex justify-content-end gap-2">
                    <Button size="sm" variant="outline-secondary" onClick={() => openDialog(keyword)}>
                      {t.common.edit}
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => handleDelete(keyword.id)}>
                      {t.common.delete}
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </Container>
  );
}

function HealthCell({ health }: { health?: KeywordHealth }) {
  const k = useI18n().t.keywords;
  if (!health) return null;
  return (
    <div className="d-flex flex-wrap align-items-center gap-1 small">
      <span className="text-muted">{k.matches(health.matches)}</span>
      {health.flags.map((flag) => {
        const { label, hint } = flagText(flag, health, k);
        return (
          <Badge key={flag} bg={FLAG_BADGES[flag]} text={flag === "overlapping" ? "dark" : undefined} title={hint}>
            {label}
          </Badge>
        );
      })}
      {health.pending_suggestion_ids.length > 0 && <Link to="/suggestions?tab=rules">{k.suggestedFix}</Link>}
    </div>
  );
}
