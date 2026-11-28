import { FormEvent, useState, type CSSProperties } from "react";
import { Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import { keywordsApi, subcategoriesApi } from "../../api";
import { useI18n } from "../../i18n/context";
import type { Category, Keyword, KeywordHealth, Subcategory, SubcategoryType } from "../../types";
import { amountRangeLabel } from "../../utils/amountRange";
import { colorInputValue, errorText, needsAttention, type Selection } from "../../utils/categorization";
import { subcategoryTypes } from "../../utils/categories";
import ConfirmDialog from "./ConfirmDialog";
import RuleHealth from "./RuleHealth";

interface Props {
  category: Category;
  subcategory: Subcategory;
  categories: Category[];
  rules: Keyword[];
  health: Map<number, KeywordHealth>;
  onSaved: (subcategory: Subcategory, categoryId: number) => void;
  onDeleted: (subcategory: Subcategory) => void;
  onEditRule: (rule: Keyword | null) => void;
  onRuleDeleted: (rule: Keyword) => void;
  onSelect: (selection: Selection) => void;
}

type Notice = { variant: "success" | "danger"; text: string } | null;
type Confirm = { kind: "subcategory" } | { kind: "rule"; rule: Keyword } | null;

/** Edits a subcategory and its keyword rules. Key it by subcategory id. */
export default function SubcategoryPanel(props: Props) {
  const { category, subcategory, categories, rules, health, onSaved, onDeleted, onEditRule, onRuleDeleted, onSelect } = props;
  const { t } = useI18n();
  const c = t.categorization;
  const [name, setName] = useState(subcategory.name);
  const [color, setColor] = useState(colorInputValue(subcategory.color_code));
  const [type, setType] = useState<SubcategoryType | "">(subcategory.subcategory_type ?? "");
  const [categoryId, setCategoryId] = useState(category.id);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);

  const dirty =
    name !== subcategory.name ||
    color !== colorInputValue(subcategory.color_code) ||
    type !== (subcategory.subcategory_type ?? "") ||
    categoryId !== category.id;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setNotice({ variant: "danger", text: c.nameRequired });
    setSaving(true);
    setNotice(null);
    const params = { name: name.trim(), color_code: color, subcategory_type: type, category_id: categoryId };
    try {
      await subcategoriesApi.update(subcategory.id, params);
      onSaved({ ...subcategory, name: params.name, color_code: color, subcategory_type: type }, categoryId);
      setName(params.name);
      setNotice({ variant: "success", text: c.saved });
    } catch (err) {
      console.error(err);
      setNotice({ variant: "danger", text: errorText(err, c.saveFailed) });
    } finally {
      setSaving(false);
    }
  };

  const attention = rules.filter((rule) => needsAttention(rule, health)).length;

  return (
    <article className="cz-panel" style={{ "--cz-accent": color } as CSSProperties} aria-labelledby="cz-panel-title">
      <header className="cz-panel-head">
        <span className="cz-dot cz-dot-xl" aria-hidden />
        <div className="cz-panel-titles">
          <button type="button" className="cz-crumb" onClick={() => onSelect({ kind: "category", id: category.id })}>
            <span className="cz-dot" style={{ background: category.color_code || "#9ca3af" }} aria-hidden />
            {category.name}
          </button>
          <h3 id="cz-panel-title">{subcategory.name}</h3>
        </div>
        <Link className="cz-panel-link" to={`/transactions?subcategory_id=${subcategory.id}`}>
          {c.seeTransactions}
        </Link>
      </header>

      <Form onSubmit={save} className="cz-form cz-form-sub" noValidate>
        <Form.Group controlId="cz-sub-name" className="cz-field-grow">
          <Form.Label>{c.name}</Form.Label>
          <Form.Control aria-label={c.subcategoryName} value={name} onChange={(e) => setName(e.target.value)} disabled={saving} />
        </Form.Group>
        <Form.Group controlId="cz-sub-color">
          <Form.Label>{c.color}</Form.Label>
          <Form.Control
            type="color"
            className="form-control-color"
            aria-label={c.subcategoryColor}
            value={color}
            onChange={(e) => setColor(e.target.value)}
            disabled={saving}
          />
        </Form.Group>
        <Form.Group controlId="cz-sub-type">
          <Form.Label>{c.type}</Form.Label>
          <Form.Select aria-label={c.subcategoryType} value={type} onChange={(e) => setType(e.target.value as SubcategoryType)} disabled={saving}>
            <option value="" disabled>
              {c.selectType}
            </option>
            {subcategoryTypes().map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group controlId="cz-sub-category">
          <Form.Label>{c.subcategoryCategory}</Form.Label>
          <Form.Select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} disabled={saving}>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <div className="cz-form-actions">
          <Button type="submit" variant="dark" disabled={saving || !dirty}>
            {saving ? t.common.saving : c.saveChanges}
          </Button>
        </div>
      </Form>
      {notice && (
        <p className={`cz-notice cz-notice-${notice.variant}`} role="status">
          {notice.text}
        </p>
      )}

      <section className="cz-section" aria-labelledby="cz-rules-title">
        <div className="cz-section-head">
          <div>
            <h4 id="cz-rules-title">
              {c.rulesTitle} <span className="cz-muted">({rules.length})</span>
            </h4>
            <p className="cz-muted">
              {c.rulesIntro}
              {attention > 0 && <span className="cz-attention-text"> {c.attention(attention)}.</span>}
            </p>
          </div>
          <Button variant="outline-dark" size="sm" className="text-nowrap" onClick={() => onEditRule(null)}>
            {c.addRule}
          </Button>
        </div>

        {rules.length === 0 ? (
          <p className="cz-empty">{c.noRules}</p>
        ) : (
          <ul className="cz-rules">
            {rules.map((rule) => {
              const range = amountRangeLabel(rule.min_amount, rule.max_amount);
              return (
                <li key={rule.id} className={needsAttention(rule, health) ? "cz-rule cz-rule-flagged" : "cz-rule"}>
                  <div className="cz-rule-main">
                    <code className="cz-rule-name">{rule.name}</code>
                    {range && <span className="cz-rule-range">{range}</span>}
                  </div>
                  <RuleHealth health={health.get(rule.id)} />
                  <div className="cz-rule-actions">
                    <Button size="sm" variant="link" onClick={() => onEditRule(rule)} aria-label={`${t.common.edit} ${rule.name}`}>
                      {t.common.edit}
                    </Button>
                    <Button
                      size="sm"
                      variant="link"
                      className="text-danger"
                      onClick={() => setConfirm({ kind: "rule", rule })}
                      aria-label={`${t.common.delete} ${rule.name}`}
                    >
                      {t.common.delete}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <footer className="cz-danger">
        <Button variant="outline-danger" size="sm" onClick={() => setConfirm({ kind: "subcategory" })}>
          {c.deleteSubcategory}
        </Button>
      </footer>

      {confirm?.kind === "subcategory" && (
        <ConfirmDialog
          title={c.deleteTitle(subcategory.name)}
          body={c.confirmDeleteSubcategory(rules.length)}
          confirmLabel={c.deleteSubcategory}
          onHide={() => setConfirm(null)}
          onConfirm={async () => {
            await subcategoriesApi.remove(subcategory.id);
            onDeleted(subcategory);
          }}
        />
      )}
      {confirm?.kind === "rule" && (
        <ConfirmDialog
          title={c.deleteTitle(confirm.rule.name)}
          body={c.confirmDeleteRule}
          confirmLabel={t.common.delete}
          onHide={() => setConfirm(null)}
          onConfirm={async () => {
            await keywordsApi.remove(confirm.rule.id);
            onRuleDeleted(confirm.rule);
            setConfirm(null);
          }}
        />
      )}
    </article>
  );
}
