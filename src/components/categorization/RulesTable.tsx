import { useMemo, useState } from "react";
import { Button, Form, Table } from "react-bootstrap";
import { keywordsApi } from "../../api";
import { useI18n } from "../../i18n/context";
import type { Category, Keyword, KeywordHealth } from "../../types";
import { amountRangeLabel } from "../../utils/amountRange";
import { needsAttention, normalize, type Selection } from "../../utils/categorization";
import ConfirmDialog from "./ConfirmDialog";
import RuleHealth from "./RuleHealth";

interface Props {
  categories: Category[];
  keywords: Keyword[];
  health: Map<number, KeywordHealth>;
  attentionOnly: boolean;
  onAttentionOnly: (value: boolean) => void;
  onEditRule: (rule: Keyword | null) => void;
  onRuleDeleted: (rule: Keyword) => void;
  onSelect: (selection: Selection) => void;
}

/** Every keyword rule in one searchable table, with its health. */
export default function RulesTable({ categories, keywords, health, attentionOnly, onAttentionOnly, onEditRule, onRuleDeleted, onSelect }: Props) {
  const { t } = useI18n();
  const c = t.categorization;
  const r = c.rulesTable;
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<Keyword | null>(null);

  const owners = useMemo(() => {
    const map = new Map<number, { category: Category; name: string; color?: string | null }>();
    for (const category of categories) for (const sub of category.subcategories) map.set(sub.id, { category, name: sub.name, color: sub.color_code });
    return map;
  }, [categories]);

  const flagged = keywords.filter((rule) => needsAttention(rule, health));
  const q = normalize(query);
  const rows = (attentionOnly ? flagged : keywords)
    .filter((rule) => {
      if (!q) return true;
      const owner = owners.get(rule.subcategory_id);
      return [rule.name, owner?.name, owner?.category.name].some((text) => normalize(text ?? "").includes(q));
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const emptyText = keywords.length === 0 ? r.empty : attentionOnly && flagged.length === 0 ? r.allHealthy : r.noMatches;

  return (
    <section className="cz-card cz-rules-table" aria-label={c.tabs.rules}>
      <div className="cz-table-tools">
        <Form.Control type="search" placeholder={r.search} aria-label={r.search} value={query} onChange={(e) => setQuery(e.target.value)} />
        {health.size > 0 && (
          <Form.Check
            type="switch"
            id="cz-attention-only"
            label={r.attentionOnly(flagged.length)}
            checked={attentionOnly}
            onChange={(e) => onAttentionOnly(e.target.checked)}
          />
        )}
        <Button variant="dark" className="ms-md-auto text-nowrap" onClick={() => onEditRule(null)}>
          {c.addRule}
        </Button>
      </div>

      <Table hover responsive className="mb-0 align-middle">
        <thead>
          <tr>
            <th>{r.columns.rule}</th>
            <th>{r.columns.subcategory}</th>
            <th>{r.columns.amounts}</th>
            <th>{r.columns.health}</th>
            <th className="text-end">{r.columns.actions}</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center text-muted py-4">
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((rule) => {
              const owner = owners.get(rule.subcategory_id);
              const subName = owner?.name ?? rule.subcategory?.name ?? t.keywords.unknownSubcategory;
              return (
                <tr key={rule.id}>
                  <td>
                    <code className="cz-rule-name">{rule.name}</code>
                  </td>
                  <td>
                    {owner ? (
                      <button
                        type="button"
                        className="cz-owner"
                        onClick={() => onSelect({ kind: "subcategory", id: rule.subcategory_id })}
                        aria-label={r.open(subName)}
                      >
                        <span className="cz-dot" style={{ background: owner.color || "#cccccc" }} aria-hidden />
                        <span className="cz-muted">{owner.category.name} ›</span> {subName}
                      </button>
                    ) : (
                      subName
                    )}
                  </td>
                  <td className="text-nowrap small">{amountRangeLabel(rule.min_amount, rule.max_amount) || <span className="text-muted">{t.common.any}</span>}</td>
                  <td data-testid={`health-${rule.id}`}>
                    <RuleHealth health={health.get(rule.id)} />
                  </td>
                  <td>
                    <div className="d-flex justify-content-end gap-1">
                      <Button size="sm" variant="outline-secondary" onClick={() => onEditRule(rule)} aria-label={`${t.common.edit} ${rule.name}`}>
                        {t.common.edit}
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => setDeleting(rule)} aria-label={`${t.common.delete} ${rule.name}`}>
                        {t.common.delete}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>

      {deleting && (
        <ConfirmDialog
          title={c.deleteTitle(deleting.name)}
          body={c.confirmDeleteRule}
          confirmLabel={t.common.delete}
          onHide={() => setDeleting(null)}
          onConfirm={async () => {
            await keywordsApi.remove(deleting.id);
            onRuleDeleted(deleting);
            setDeleting(null);
          }}
        />
      )}
    </section>
  );
}
