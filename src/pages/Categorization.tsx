import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Container } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import { categoriesApi, keywordsApi } from "../api";
import CategoryPanel from "../components/categorization/CategoryPanel";
import CategoryTree from "../components/categorization/CategoryTree";
import ColorThemePicker from "../components/categorization/ColorThemePicker";
import KeywordFormModal from "../components/categorization/KeywordFormModal";
import RulesTable from "../components/categorization/RulesTable";
import SubcategoryPanel from "../components/categorization/SubcategoryPanel";
import "../components/categorization/Categorization.css";
import { Loading } from "../components/LoadingState";
import { useI18n } from "../i18n/context";
import { messages } from "../i18n/locale";
import type { Category, Keyword, KeywordHealth, Subcategory } from "../types";
import {
  CATEGORIZATION_TABS,
  errorText,
  findSubcategory,
  needsAttention,
  readSelection,
  readTab,
  rulesBySubcategory,
  type CategorizationTab,
  type Selection,
} from "../utils/categorization";

type RuleDialog = { rule: Keyword | null; subcategoryId?: number } | null;

/**
 * One place for everything that sorts transactions: categories, their subcategories, the keyword
 * rules behind them and their colors. The tab and the selected item live in the URL.
 */
export default function Categorization() {
  const { t } = useI18n();
  const c = t.categorization;
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [health, setHealth] = useState<Map<number, KeywordHealth>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [ruleDialog, setRuleDialog] = useState<RuleDialog>(null);

  const tab = readTab(params);
  const selection = readSelection(params);
  const attentionOnly = params.get("attention") === "1";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [categoriesData, keywordsData] = await Promise.all([categoriesApi.list(), keywordsApi.list()]);
      setCategories(categoriesData);
      setKeywords(keywordsData);
    } catch (err) {
      console.error(err);
      setError(errorText(err, messages().categorization.loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Health is extra information: the page works without it.
  useEffect(() => {
    if (loading) return;
    keywordsApi
      .health()
      .then((entries) => setHealth(new Map(entries.map((entry) => [entry.keyword_id, entry]))))
      .catch((err) => console.error(err));
  }, [keywords, loading]);

  // On narrow screens the panel sits under the tree: bring it into view when something is picked.
  const detailRef = useRef<HTMLDivElement>(null);
  const selectionKey = params.get("c") ?? params.get("s") ?? params.get("new");
  useEffect(() => {
    if (!selectionKey || typeof window.matchMedia !== "function") return;
    if (window.matchMedia("(max-width: 860px)").matches) detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectionKey]);

  const rules = useMemo(() => rulesBySubcategory(keywords), [keywords]);
  const subcategoryCount = categories.reduce((sum, cat) => sum + cat.subcategories.length, 0);
  const attentionCount = keywords.filter((rule) => needsAttention(rule, health)).length;

  const navigate = (changes: { tab?: CategorizationTab; selection?: Selection; attention?: boolean }) => {
    const next = new URLSearchParams(params);
    if (changes.tab) {
      if (changes.tab === "organize") next.delete("tab");
      else next.set("tab", changes.tab);
    }
    if (changes.selection) {
      ["c", "s", "new"].forEach((key) => next.delete(key));
      const sel = changes.selection;
      if (sel.kind === "category") next.set("c", String(sel.id));
      if (sel.kind === "subcategory") next.set("s", String(sel.id));
      if (sel.kind === "newCategory") next.set("new", "category");
    }
    if (changes.attention !== undefined) {
      if (changes.attention) next.set("attention", "1");
      else next.delete("attention");
    }
    setParams(next);
  };
  const select = (sel: Selection) => navigate({ tab: "organize", selection: sel });

  // --- state updates after a save -------------------------------------------------------------

  const saveCategory = (saved: Category) =>
    setCategories((prev) =>
      prev.some((cat) => cat.id === saved.id)
        ? prev.map((cat) => (cat.id === saved.id ? { ...cat, name: saved.name, color_code: saved.color_code } : cat))
        : [...prev, saved]
    );

  const deleteCategory = (deleted: Category) => {
    const gone = new Set(deleted.subcategories.map((sub) => sub.id));
    setCategories((prev) => prev.filter((cat) => cat.id !== deleted.id));
    setKeywords((prev) => prev.filter((rule) => !gone.has(rule.subcategory_id)));
    select({ kind: "none" });
  };

  const addSubcategory = (sub: Subcategory, categoryId: number) => {
    setCategories((prev) => prev.map((cat) => (cat.id === categoryId ? { ...cat, subcategories: [...cat.subcategories, sub] } : cat)));
    select({ kind: "subcategory", id: sub.id });
  };

  const saveSubcategory = (saved: Subcategory, categoryId: number) =>
    setCategories((prev) =>
      prev.map((cat) => {
        const has = cat.subcategories.some((sub) => sub.id === saved.id);
        if (cat.id === categoryId) {
          return has
            ? { ...cat, subcategories: cat.subcategories.map((sub) => (sub.id === saved.id ? { ...sub, ...saved } : sub)) }
            : { ...cat, subcategories: [...cat.subcategories, saved] };
        }
        return has ? { ...cat, subcategories: cat.subcategories.filter((sub) => sub.id !== saved.id) } : cat;
      })
    );

  const deleteSubcategory = (deleted: Subcategory) => {
    const owner = findSubcategory(categories, deleted.id)?.category;
    setCategories((prev) => prev.map((cat) => ({ ...cat, subcategories: cat.subcategories.filter((sub) => sub.id !== deleted.id) })));
    setKeywords((prev) => prev.filter((rule) => rule.subcategory_id !== deleted.id));
    select(owner ? { kind: "category", id: owner.id } : { kind: "none" });
  };

  const saveRule = (saved: Keyword) => {
    setKeywords((prev) => (prev.some((rule) => rule.id === saved.id) ? prev.map((rule) => (rule.id === saved.id ? saved : rule)) : [...prev, saved]));
    setRuleDialog(null);
  };

  const deleteRule = (deleted: Keyword) => setKeywords((prev) => prev.filter((rule) => rule.id !== deleted.id));

  const applyThemeColors = (updated: Category[]) => {
    const colors = new Map<string, string | null | undefined>();
    for (const cat of updated) {
      colors.set(`c${cat.id}`, cat.color_code);
      for (const sub of cat.subcategories) colors.set(`s${sub.id}`, sub.color_code);
    }
    const pick = (key: string, current: string | null | undefined) => (colors.has(key) ? colors.get(key) : current);
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        color_code: pick(`c${cat.id}`, cat.color_code),
        subcategories: cat.subcategories.map((sub) => ({ ...sub, color_code: pick(`s${sub.id}`, sub.color_code) })),
      }))
    );
  };

  // --- render ---------------------------------------------------------------------------------

  if (loading) return <Loading message={c.loading} />;

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <p className="fw-medium mb-1">{c.loadFailedTitle}</p>
          <p className="mb-0">{error}</p>
        </Alert>
        <Button variant="outline-secondary" onClick={load}>
          {t.common.tryAgain}
        </Button>
      </Container>
    );
  }

  const panel = () => {
    if (selection.kind === "newCategory") {
      return <CategoryPanel key="new" category={null} rules={rules} onSaved={saveCategory} onDeleted={deleteCategory} onSubcategoryCreated={addSubcategory} onSelect={select} />;
    }
    if (selection.kind === "category") {
      const category = categories.find((cat) => cat.id === selection.id);
      if (category) {
        return (
          <CategoryPanel
            key={`c${category.id}`}
            category={category}
            rules={rules}
            onSaved={saveCategory}
            onDeleted={deleteCategory}
            onSubcategoryCreated={addSubcategory}
            onSelect={select}
          />
        );
      }
    }
    if (selection.kind === "subcategory") {
      const found = findSubcategory(categories, selection.id);
      if (found) {
        return (
          <SubcategoryPanel
            key={`s${found.subcategory.id}`}
            category={found.category}
            subcategory={found.subcategory}
            categories={categories}
            rules={rules.get(found.subcategory.id) ?? []}
            health={health}
            onSaved={saveSubcategory}
            onDeleted={deleteSubcategory}
            onEditRule={(rule) => setRuleDialog({ rule, subcategoryId: found.subcategory.id })}
            onRuleDeleted={deleteRule}
            onSelect={select}
          />
        );
      }
    }
    return (
      <div className="cz-panel cz-panel-empty">
        <div className="cz-empty-art" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <h3>{c.pickTitle}</h3>
        <p className="cz-muted">{c.pickHint}</p>
      </div>
    );
  };

  const stats = [
    { label: c.stats.categories, value: categories.length },
    { label: c.stats.subcategories, value: subcategoryCount },
    { label: c.stats.rules, value: keywords.length },
  ];

  return (
    <Container className="cz-page">
      <header className="cz-hero">
        <div>
          <h2>{c.title}</h2>
          <p>{c.subtitle}</p>
        </div>
        <dl className="cz-stats">
          {stats.map((stat) => (
            <div key={stat.label} className="cz-stat">
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
          <div className={attentionCount > 0 ? "cz-stat cz-stat-warn" : "cz-stat"}>
            <dt>{c.stats.attention}</dt>
            <dd>
              {attentionCount > 0 ? (
                <button type="button" onClick={() => navigate({ tab: "rules", attention: true })} aria-label={`${c.stats.attention}: ${attentionCount}`}>
                  {attentionCount}
                </button>
              ) : (
                attentionCount
              )}
            </dd>
          </div>
        </dl>
      </header>

      <div className="cz-tabs" role="tablist" aria-label={c.title}>
        {CATEGORIZATION_TABS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`cz-tab-${key}`}
            aria-selected={tab === key}
            aria-controls={`cz-tabpanel-${key}`}
            className="cz-tab"
            onClick={() => navigate({ tab: key })}
          >
            {c.tabs[key]}
            {key === "rules" && <span className="cz-tab-count">{keywords.length}</span>}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`cz-tabpanel-${tab}`} aria-labelledby={`cz-tab-${tab}`}>
        {tab === "organize" && (
          <div className="cz-organize">
            <CategoryTree
              categories={categories}
              rules={rules}
              health={health}
              selection={selection}
              query={query}
              onQuery={setQuery}
              onSelect={select}
            />
            <div className="cz-detail" ref={detailRef}>
              {panel()}
            </div>
          </div>
        )}
        {tab === "rules" && (
          <RulesTable
            categories={categories}
            keywords={keywords}
            health={health}
            attentionOnly={attentionOnly}
            onAttentionOnly={(value) => navigate({ attention: value })}
            onEditRule={(rule) => setRuleDialog({ rule })}
            onRuleDeleted={deleteRule}
            onSelect={select}
          />
        )}
        {tab === "colors" &&
          (categories.length > 0 ? (
            <ColorThemePicker categories={categories} onApplied={applyThemeColors} />
          ) : (
            <p className="cz-muted">{c.empty}</p>
          ))}
      </div>

      {ruleDialog && (
        <KeywordFormModal
          keyword={ruleDialog.rule}
          categories={categories}
          subcategoryId={ruleDialog.subcategoryId}
          onHide={() => setRuleDialog(null)}
          onSaved={saveRule}
        />
      )}
    </Container>
  );
}
