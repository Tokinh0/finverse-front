import { FormEvent, useEffect, useState } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import { ApiError, categoriesApi, subcategoriesApi } from "../../api";
import type { Category, Subcategory, SubcategoryType } from "../../types";
import { messages } from "../../i18n/locale";
import { subcategoryTypes } from "../../utils/categories";
import { useI18n } from "../../i18n/context";

interface Props {
  show: boolean;
  categories: Category[];
  onHide: () => void;
  /** called with the created subcategory; the caller reloads its category list */
  onCreated: (subcategory: Subcategory) => void;
}

const NEW_CATEGORY = "__new__";

const errorText = (err: unknown) =>
  (err instanceof ApiError ? (err.body as { errors?: string[] } | undefined)?.errors?.join(", ") : undefined) ||
  messages().suggestions.newSubcategory.error;

/** Creates a subcategory, in an existing category or in a new one, without leaving the page. */
export default function NewSubcategoryModal({ show, categories, onHide, onCreated }: Props) {
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState("#6c757d");
  const [name, setName] = useState("");
  const [type, setType] = useState<SubcategoryType>("expense");
  const [color, setColor] = useState("#257de0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A category created on a failed attempt is reused on retry instead of being created twice.
  const [createdCategory, setCreatedCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (!show) return;
    setCategoryId(categories[0] ? String(categories[0].id) : NEW_CATEGORY);
    setCategoryName("");
    setName("");
    setType("expense");
    setError(null);
    setCreatedCategory(null);
  }, [show, categories]);

  const isNewCategory = categoryId === NEW_CATEGORY;
  const { t } = useI18n();
  const m = t.suggestions.newSubcategory;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let targetId = Number(categoryId);
      if (isNewCategory) {
        const category = createdCategory ?? (await categoriesApi.create({ name: categoryName.trim(), color_code: categoryColor }));
        setCreatedCategory(category);
        targetId = category.id;
      }
      const subcategory = await subcategoriesApi.create({
        name: name.trim(),
        color_code: color,
        subcategory_type: type,
        category_id: targetId,
      });
      onCreated(subcategory);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={saving ? undefined : onHide} backdrop={saving ? "static" : true} aria-labelledby="new-subcategory-title">
      <Form onSubmit={save}>
        <Modal.Header closeButton={!saving}>
          <Modal.Title id="new-subcategory-title">{m.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-grid gap-3">
          {error && (
            <Alert variant="danger" className="mb-0">
              {error}
            </Alert>
          )}

          <Form.Group controlId="new-subcategory-category">
            <Form.Label>{m.category}</Form.Label>
            <Form.Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={saving || createdCategory !== null}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
              <option value={NEW_CATEGORY}>{m.newCategory}</option>
            </Form.Select>
          </Form.Group>

          {isNewCategory && (
            <div className="d-flex gap-2 ps-3 border-start">
              <Form.Group controlId="new-category-name" className="flex-grow-1">
                <Form.Label>{m.newCategoryName}</Form.Label>
                <Form.Control
                  value={createdCategory?.name ?? categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                  disabled={saving || createdCategory !== null}
                />
              </Form.Group>
              <Form.Group controlId="new-category-color">
                <Form.Label>{m.color}</Form.Label>
                <Form.Control type="color" value={categoryColor} onChange={(e) => setCategoryColor(e.target.value)} disabled={saving || createdCategory !== null} />
              </Form.Group>
            </div>
          )}

          <div className="d-flex gap-2">
            <Form.Group controlId="new-subcategory-name" className="flex-grow-1">
              <Form.Label>{m.name}</Form.Label>
              <Form.Control value={name} onChange={(e) => setName(e.target.value)} required disabled={saving} />
            </Form.Group>
            <Form.Group controlId="new-subcategory-color">
              <Form.Label>{m.color}</Form.Label>
              <Form.Control type="color" value={color} onChange={(e) => setColor(e.target.value)} disabled={saving} />
            </Form.Group>
          </div>

          <Form.Group controlId="new-subcategory-type">
            <Form.Label>{m.type}</Form.Label>
            <Form.Select value={type} onChange={(e) => setType(e.target.value as SubcategoryType)} disabled={saving}>
              {subcategoryTypes().map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Form.Select>
            <Form.Text>{m.typeHelp}</Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide} disabled={saving}>
            {t.common.cancel}
          </Button>
          <Button type="submit" variant="dark" disabled={saving || !name.trim() || (isNewCategory && !createdCategory && !categoryName.trim())}>
            {saving ? t.common.creating : t.common.create}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
