import type { CSSProperties } from "react";
import { Form } from "react-bootstrap";
import { useI18n } from "../../i18n/context";
import type { Category, Keyword, KeywordHealth } from "../../types";
import { filterCategories, needsAttention, type Selection } from "../../utils/categorization";
import { categoryKind } from "../../utils/colorThemes";

interface Props {
  categories: Category[];
  rules: Map<number, Keyword[]>;
  health: Map<number, KeywordHealth>;
  selection: Selection;
  query: string;
  onQuery: (query: string) => void;
  onSelect: (selection: Selection) => void;
}

/** Every category with its subcategories, searchable; picking one opens it on the right. */
export default function CategoryTree({ categories, rules, health, selection, query, onQuery, onSelect }: Props) {
  const { t } = useI18n();
  const c = t.categorization;
  const visible = filterCategories(categories, rules, query);
  const isSelected = (kind: Selection["kind"], id: number) => selection.kind === kind && "id" in selection && selection.id === id;

  return (
    <nav className="cz-tree" aria-label={c.tabs.organize}>
      <div className="cz-tree-tools">
        <Form.Control type="search" placeholder={c.searchShort} aria-label={c.search} title={c.search} value={query} onChange={(e) => onQuery(e.target.value)} />
      </div>

      {categories.length === 0 && <p className="cz-muted">{c.empty}</p>}
      {categories.length > 0 && visible.length === 0 && <p className="cz-muted">{c.noMatches(query)}</p>}

      <ul className="cz-tree-list">
        {visible.map((category) => {
          const ruleCount = category.subcategories.reduce((sum, sub) => sum + (rules.get(sub.id)?.length ?? 0), 0);
          return (
            <li key={category.id} className="cz-tree-category" style={{ "--cz-accent": category.color_code || "#9ca3af" } as CSSProperties}>
              <button
                type="button"
                className="cz-tree-head"
                aria-current={isSelected("category", category.id) || undefined}
                onClick={() => onSelect({ kind: "category", id: category.id })}
              >
                <span className="cz-swatch" aria-hidden />
                <span className="cz-tree-name">{category.name}</span>
                <span className="cz-tree-meta">
                  {t.categorization.themes.kinds[categoryKind(category)]} · {c.rulesCount(ruleCount)}
                </span>
              </button>
              {category.subcategories.length > 0 && (
                <ul className="cz-tree-subs">
                  {category.subcategories.map((sub) => {
                    const subRules = rules.get(sub.id) ?? [];
                    const attention = subRules.filter((rule) => needsAttention(rule, health)).length;
                    return (
                      <li key={sub.id}>
                        <button
                          type="button"
                          className="cz-tree-sub"
                          aria-current={isSelected("subcategory", sub.id) || undefined}
                          onClick={() => onSelect({ kind: "subcategory", id: sub.id })}
                        >
                          <span className="cz-dot" style={{ background: sub.color_code || "#cccccc" }} aria-hidden />
                          <span className="cz-tree-name">{sub.name}</span>
                          {attention > 0 && (
                            <span className="cz-attention" title={c.attention(attention)}>
                              <span aria-hidden>!</span>
                              <span className="visually-hidden">{c.attention(attention)}</span>
                            </span>
                          )}
                          <span className="cz-count" title={c.rulesCount(subRules.length)}>
                            <span aria-hidden>{subRules.length}</span>
                            <span className="visually-hidden">{c.rulesCount(subRules.length)}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        className="cz-tree-new"
        aria-current={selection.kind === "newCategory" || undefined}
        onClick={() => onSelect({ kind: "newCategory" })}
      >
        {c.newCategory}
      </button>
    </nav>
  );
}
