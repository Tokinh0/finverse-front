import { FormEvent, useState, type CSSProperties } from "react";
import { Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import { categoriesApi, subcategoriesApi } from "../../api";
import { useI18n } from "../../i18n/context";
import type { Category, Keyword, Subcategory, SubcategoryType } from "../../types";
import { colorInputValue, errorText, nextSubcategoryColor, type Selection } from "../../utils/categorization";
import { subcategoryTypes } from "../../utils/categories";
import ConfirmDialog from "./ConfirmDialog";

interface Props {
  /** null while creating a new category */
  category: Category | null;
  rules: Map<number, Keyword[]>;
  onSaved: (category: Category) => void;
  onDeleted: (category: Category) => void;
  onSubcategoryCreated: (subcategory: Subcategory, categoryId: number) => void;
  onSelect: (selection: Selection) => void;
}

type Notice = { variant: "success" | "danger"; text: string } | null;

/** Most of a category's subcategories share a type; a new one starts with it. */
function usualType(category: Category): SubcategoryType {
  const counts = new Map<SubcategoryType, number>();
  for (const sub of category.subcategories) {
    if (sub.subcategory_type) counts.set(sub.subcategory_type, (counts.get(sub.subcategory_type) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "expense";
}

/** Edits a category (or creates one) and lists its subcategories. Key it by category id. */
export default function CategoryPanel({ category, rules, onSaved, onDeleted, onSubcategoryCreated, onSelect }: Props) {
  const { t } = useI18n();
  const c = t.categorization;
  const [name, setName] = useState(category?.name ?? "");
  const [color, setColor] = useState(colorInputValue(category?.color_code, "#2563eb"));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [confirming, setConfirming] = useState(false);

  const dirty = !category || name !== category.name || color !== colorInputValue(category.color_code, "#2563eb");

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setNotice({ variant: "danger", text: c.nameRequired });
    setSaving(true);
    setNotice(null);
    const params = { name: name.trim(), color_code: color };
    try {
      if (category) {
        const saved = await categoriesApi.update(category.id, params);
        onSaved({ ...category, name: saved?.name ?? params.name, color_code: saved?.color_code ?? params.color_code });
        setName(saved?.name ?? params.name);
        setNotice({ variant: "success", text: c.saved });
      } else {
        const saved = await categoriesApi.create(params);
        onSaved({ ...saved, subcategories: saved.subcategories ?? [] });
        onSelect({ kind: "category", id: saved.id });
      }
    } catch (err) {
      console.error(err);
      setNotice({ variant: "danger", text: errorText(err, c.saveFailed) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="cz-panel" style={{ "--cz-accent": color } as CSSProperties} aria-labelledby="cz-panel-title">
      <header className="cz-panel-head">
        <span className="cz-swatch cz-swatch-lg" aria-hidden />
        <div className="cz-panel-titles">
          <span className="cz-kicker">{c.categoryKicker}</span>
          <h3 id="cz-panel-title">{category ? category.name : c.newCategoryTitle}</h3>
        </div>
        {category && (
          <Link className="cz-panel-link" to={`/transactions?category_id=${category.id}`}>
            {c.seeTransactions}
          </Link>
        )}
      </header>

      {!category && <p className="cz-muted">{c.newCategoryIntro}</p>}

      <Form onSubmit={save} className="cz-form" noValidate>
        <Form.Group controlId="cz-category-name" className="cz-field-grow">
          <Form.Label>{c.name}</Form.Label>
          <Form.Control aria-label={c.categoryName} value={name} onChange={(e) => setName(e.target.value)} disabled={saving} autoFocus={!category} />
        </Form.Group>
        <Form.Group controlId="cz-category-color">
          <Form.Label>{c.color}</Form.Label>
          <Form.Control
            type="color"
            aria-label={c.categoryColor}
            className="form-control-color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            disabled={saving}
          />
        </Form.Group>
        <div className="cz-form-actions">
          <Button type="submit" variant="dark" disabled={saving || !dirty}>
            {saving ? t.common.saving : category ? c.saveChanges : c.createCategory}
          </Button>
        </div>
      </Form>
      {notice && (
        <p className={`cz-notice cz-notice-${notice.variant}`} role="status">
          {notice.text}
        </p>
      )}

      {category && (
        <>
          <section className="cz-section" aria-labelledby="cz-subs-title">
            <h4 id="cz-subs-title">
              {c.subcategoriesTitle} <span className="cz-muted">({category.subcategories.length})</span>
            </h4>
            {category.subcategories.length === 0 ? (
              <p className="cz-muted">{c.noSubcategories}</p>
            ) : (
              <ul className="cz-sub-cards">
                {category.subcategories.map((sub) => (
                  <li key={sub.id}>
                    <button type="button" className="cz-sub-card" onClick={() => onSelect({ kind: "subcategory", id: sub.id })}>
                      <span className="cz-dot cz-dot-lg" style={{ background: sub.color_code || "#cccccc" }} aria-hidden />
                      <span className="cz-sub-card-text">
                        <strong>{sub.name}</strong>
                        <small>
                          {sub.subcategory_type ? t.subcategoryTypes[sub.subcategory_type] : c.selectType} ·{" "}
                          {c.rulesCount(rules.get(sub.id)?.length ?? 0)}
                        </small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <NewSubcategoryForm category={category} onCreated={(sub) => onSubcategoryCreated(sub, category.id)} />
          </section>

          <footer className="cz-danger">
            <Button variant="outline-danger" size="sm" onClick={() => setConfirming(true)}>
              {c.deleteCategory}
            </Button>
          </footer>

          {confirming && (
            <ConfirmDialog
              title={c.deleteTitle(category.name)}
              body={c.confirmDeleteCategory(category.subcategories.length)}
              confirmLabel={c.deleteCategory}
              onHide={() => setConfirming(false)}
              onConfirm={async () => {
                await categoriesApi.remove(category.id);
                onDeleted(category);
              }}
            />
          )}
        </>
      )}
    </article>
  );
}

function NewSubcategoryForm({ category, onCreated }: { category: Category; onCreated: (subcategory: Subcategory) => void }) {
  const { t } = useI18n();
  const c = t.categorization;
  const [name, setName] = useState("");
  const [type, setType] = useState<SubcategoryType>(() => usualType(category));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError(c.nameRequired);
    setSaving(true);
    setError(null);
    try {
      const saved = await subcategoriesApi.create({
        name: name.trim(),
        color_code: nextSubcategoryColor(category),
        subcategory_type: type,
        category_id: category.id,
      });
      onCreated(saved);
      setName("");
    } catch (err) {
      console.error(err);
      setError(errorText(err, c.saveFailed));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form onSubmit={create} className="cz-new-sub" noValidate>
      <Form.Control
        placeholder={c.newSubcategory}
        aria-label={c.newSubcategory}
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={saving}
      />
      <Form.Select aria-label={c.subcategoryType} value={type} onChange={(e) => setType(e.target.value as SubcategoryType)} disabled={saving}>
        {subcategoryTypes().map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Form.Select>
      <Button type="submit" variant="outline-dark" disabled={saving} className="text-nowrap">
        {c.addSubcategory}
      </Button>
      {error && (
        <p className="cz-notice cz-notice-danger" role="alert">
          {error}
        </p>
      )}
    </Form>
  );
}
