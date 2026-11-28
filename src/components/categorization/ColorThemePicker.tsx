import { useMemo, useState } from "react";
import { Alert, Badge, Button } from "react-bootstrap";
import { categoriesApi, subcategoriesApi } from "../../api";
import { useI18n } from "../../i18n/context";
import type { Category } from "../../types";
import {
  categoryKind,
  COLOR_THEMES,
  currentTheme,
  pendingChanges,
  planTheme,
  type ColorChange,
  type ColorThemeId,
} from "../../utils/colorThemes";
import "./ColorThemePicker.css";

interface Props {
  categories: Category[];
  /** Called with the categories as they are after applying (only the colors that were saved). */
  onApplied: (categories: Category[]) => void;
}

const CONCURRENCY = 4;

function save(change: ColorChange) {
  if (change.kind === "category") {
    return categoriesApi.update(change.record.id, { name: change.record.name, color_code: change.color });
  }
  const sub = change.record;
  return subcategoriesApi.update(sub.id, {
    name: sub.name,
    color_code: change.color,
    subcategory_type: sub.subcategory_type,
    category_id: change.categoryId,
  });
}

/** Saves every change, a few at a time; resolves with the ones that were saved. */
async function saveAll(changes: ColorChange[], onProgress: (done: number) => void) {
  const saved: ColorChange[] = [];
  let next = 0;
  let done = 0;
  const worker = async () => {
    while (next < changes.length) {
      const change = changes[next++];
      try {
        await save(change);
        saved.push(change);
      } catch (error) {
        console.error("Error saving color:", error);
      }
      onProgress(++done);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, changes.length) }, worker));
  return saved;
}

function applySaved(categories: Category[], saved: ColorChange[]): Category[] {
  const cats = new Map(saved.filter((c) => c.kind === "category").map((c) => [c.record.id, c.color]));
  const subs = new Map(saved.filter((c) => c.kind === "subcategory").map((c) => [c.record.id, c.color]));
  return categories.map((category) => ({
    ...category,
    color_code: cats.get(category.id) ?? category.color_code,
    subcategories: category.subcategories.map((sub) => ({ ...sub, color_code: subs.get(sub.id) ?? sub.color_code })),
  }));
}

type Status = { type: "idle" } | { type: "confirm" } | { type: "saving"; done: number } | { type: "done"; failed: number };

export default function ColorThemePicker({ categories, onApplied }: Props) {
  const { t } = useI18n();
  const th = t.categorization.themes;
  const active = useMemo(() => currentTheme(categories), [categories]);
  const [selected, setSelected] = useState<ColorThemeId>(active ?? COLOR_THEMES[0].id);
  const [status, setStatus] = useState<Status>({ type: "idle" });

  const sorted = useMemo(() => [...categories].sort((a, b) => a.id - b.id), [categories]);
  const plans = useMemo(() => new Map(COLOR_THEMES.map((theme) => [theme.id, planTheme(theme, categories)])), [categories]);
  const plan = plans.get(selected)!;
  const changes = pendingChanges(plan, categories);
  const selectedName = th.names[selected];

  const apply = async () => {
    setStatus({ type: "saving", done: 0 });
    const saved = await saveAll(changes, (done) => setStatus({ type: "saving", done }));
    onApplied(applySaved(categories, saved));
    setStatus({ type: "done", failed: changes.length - saved.length });
  };

  const choose = (id: ColorThemeId) => {
    setSelected(id);
    if (status.type !== "saving") setStatus({ type: "idle" });
  };

  return (
    <section className="theme-picker" aria-labelledby="theme-picker-title">
      <header>
        <h3 id="theme-picker-title">{th.title}</h3>
        <p>{th.intro}</p>
        <p className="theme-picker-status">{active ? th.currentIs(th.names[active]) : th.custom}</p>
      </header>

      <div className="theme-options" role="radiogroup" aria-label={th.title}>
        {COLOR_THEMES.map((theme) => {
          const themePlan = plans.get(theme.id)!;
          return (
            <button
              key={theme.id}
              type="button"
              role="radio"
              aria-checked={selected === theme.id}
              className="theme-option"
              onClick={() => choose(theme.id)}
              disabled={status.type === "saving"}
            >
              <span className="theme-option-head">
                <strong>{th.names[theme.id]}</strong>
                {active === theme.id && (
                  <Badge bg="success" pill>
                    {th.current}
                  </Badge>
                )}
              </span>
              <span className="theme-option-desc">{th.descriptions[theme.id]}</span>
              <span className="theme-strip" aria-hidden>
                {sorted.map((category) => (
                  <span key={category.id} className="theme-strip-group">
                    <span style={{ background: themePlan.categories.get(category.id) }} />
                    {category.subcategories.map((sub) => (
                      <span key={sub.id} className="theme-strip-shade" style={{ background: themePlan.subcategories.get(sub.id) }} />
                    ))}
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="theme-preview" aria-label={`${th.preview}: ${selectedName}`} role="region">
        <h4>
          {th.preview}: {selectedName}
        </h4>
        <ul>
          {sorted.map((category) => (
            <li key={category.id}>
              <span className="theme-preview-category">
                <span className="theme-dot theme-dot-lg" style={{ background: plan.categories.get(category.id) }} aria-hidden />
                <strong>{category.name}</strong>
                <small>{th.kinds[categoryKind(category)]}</small>
              </span>
              <span className="theme-preview-subs">
                {category.subcategories.map((sub) => (
                  <span key={sub.id} className="theme-chip">
                    <span className="theme-dot" style={{ background: plan.subcategories.get(sub.id) }} aria-hidden />
                    {sub.name}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {status.type === "confirm" ? (
        <Alert variant="warning" className="theme-confirm">
          <p>{th.confirm(changes.length)}</p>
          <div className="d-flex gap-2">
            <Button variant="primary" size="sm" onClick={apply}>
              {th.confirmYes}
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={() => setStatus({ type: "idle" })}>
              {th.cancel}
            </Button>
          </div>
        </Alert>
      ) : (
        <div className="theme-actions">
          <Button onClick={() => setStatus({ type: "confirm" })} disabled={status.type === "saving" || changes.length === 0}>
            {status.type === "saving"
              ? th.applying(status.done, changes.length)
              : changes.length === 0
                ? th.nothingToChange
                : th.apply(selectedName)}
          </Button>
        </div>
      )}

      {status.type === "done" && (
        <Alert variant={status.failed ? "danger" : "success"} className="mt-3 mb-0" role="status">
          {status.failed ? th.failed(status.failed) : th.applied(selectedName)}
        </Alert>
      )}
    </section>
  );
}
