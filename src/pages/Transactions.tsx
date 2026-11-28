import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Col, Container, Form, Row, Table } from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
import { categoriesApi, statementsApi, suggestionsApi, transactionsApi } from "../api";
import { ErrorMessage, Loading } from "../components/LoadingState";
import RuleNudge from "../components/suggestions/RuleNudge";
import SuggestionChip from "../components/suggestions/SuggestionChip";
import DateRangeFilter from "../components/transactions/DateRangeFilter";
import RecategorizeModal from "../components/transactions/RecategorizeModal";
import StatementsPanel from "../components/transactions/StatementsPanel";
import { useSuggestionsSummary } from "../hooks/suggestionsSummary";
import { useI18n } from "../i18n/context";
import type { Category, RecategorizeResult, RuleSuggestion, Transaction, TransactionFilters, TransactionsPage } from "../types";
import { MonthlyStatementPresenter } from "../presenters/MonthlyStatementPresenter";
import { formatIsoDate } from "../utils/dates";
import { formatCurrency } from "../utils/formatter";
import { messages } from "../i18n/locale";
import {
  DEFAULT_SORT,
  TRANSACTION_SORTS,
  columnSortState,
  isTransactionSort,
  monthRange,
  nextColumnSort,
  type DateRange,
  type SortableColumn,
} from "../utils/transactionFilters";

interface Props {
  showTotals: boolean;
}

const PER_PAGE = 50;
// Everything here lives in the URL, so links and the back button keep it. `month` (older links,
// e.g. from Financial health) is read as that month's date range.
const FILTER_KEYS = ["from", "to", "monthly_statement_id", "category_id", "subcategory_id", "transaction_type", "q", "unknown"] as const;
type FilterKey = (typeof FILTER_KEYS)[number] | "sort" | "page";
const BULK_CONFIDENCE = 0.9;

const TYPE_BADGES: Record<string, string> = { debit: "secondary", credit: "success", unknown: "warning" };

export default function Transactions({ showTotals }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<TransactionsPage | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ transaction: Transaction; subcategoryId?: number } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [nudge, setNudge] = useState<RuleSuggestion | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const { summary, refresh: refreshSummary } = useSuggestionsSummary();
  // `t` is used for transactions below, so the messages are `i18n` here.
  const { t: i18n } = useI18n();
  const tx = i18n.transactions;
  const HIDDEN = i18n.common.hiddenAmount;
  const [searchText, setSearchText] = useState(searchParams.get("q") ?? "");
  const [statements, setStatements] = useState<MonthlyStatementPresenter[] | null>(null);
  const [statementsError, setStatementsError] = useState<string | null>(null);

  const filters: TransactionFilters = useMemo(() => {
    const result: TransactionFilters = { page: Number(searchParams.get("page")) || 1, per_page: PER_PAGE };
    FILTER_KEYS.forEach((key) => {
      const value = searchParams.get(key);
      if (value) result[key] = value;
    });
    const month = searchParams.get("month");
    const legacy = month && !result.from && !result.to ? monthRange(month) : null;
    if (legacy) Object.assign(result, legacy);
    const sort = searchParams.get("sort");
    if (isTransactionSort(sort) && sort !== DEFAULT_SORT) result.sort = sort;
    return result;
  }, [searchParams]);

  const sort = isTransactionSort(filters.sort) ? filters.sort : DEFAULT_SORT;
  const range: DateRange = { from: filters.from ?? "", to: filters.to ?? "" };

  const updateFilters = useCallback(
    (changes: Partial<Record<FilterKey, string>>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
        if ("from" in changes || "to" in changes) next.delete("month");
        if (!("page" in changes)) next.delete("page");
        return next;
      });
    },
    [setSearchParams]
  );

  const loadStatements = useCallback(() => {
    statementsApi
      .list()
      .then((list) => {
        setStatements(MonthlyStatementPresenter.parseMany(list));
        setStatementsError(null);
      })
      .catch((err) => {
        console.error(err);
        setStatementsError(messages().statements.loadError);
      });
  }, []);

  useEffect(() => {
    loadStatements();
  }, [loadStatements]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await transactionsApi.list(filters));
    } catch (err) {
      console.error(err);
      setError(messages().transactions.loadError);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    categoriesApi.list().then(setCategories).catch((err) => console.error(err));
  }, []);

  // Debounce the text search so typing doesn't fire a request per keystroke.
  useEffect(() => {
    if (searchText === (searchParams.get("q") ?? "")) return;
    const timer = setTimeout(() => updateFilters({ q: searchText.trim() }), 350);
    return () => clearTimeout(timer);
  }, [searchText, searchParams, updateFilters]);

  const subcategoryOptions = useMemo(() => {
    const scoped = filters.category_id ? categories.filter((c) => String(c.id) === filters.category_id) : categories;
    return scoped.flatMap((c) => c.subcategories.map((s) => ({ ...s, categoryName: c.name })));
  }, [categories, filters.category_id]);

  const handleSaved = (result: RecategorizeResult) => {
    setEditing(null);
    const parts = [tx.updated];
    if (result.keyword) parts.push(tx.keywordSaved(result.keyword.name));
    if (result.updated_count > 0) parts.push(tx.movedOthers(result.updated_count));
    setNotice(parts.join(" "));
    setNudge(result.rule_nudge ?? null);
    load();
    refreshSummary();
  };

  const decide = async (id: number, action: () => Promise<unknown>, message: string) => {
    setBusyId(id);
    try {
      await action();
      setNotice(message);
    } catch (err) {
      console.error(err);
      setNotice(tx.decisionError);
    } finally {
      setBusyId(null);
      load();
      refreshSummary();
    }
  };

  const acceptAboveThreshold = () =>
    decide(-1, () => suggestionsApi.bulkAccept({ min_confidence: BULK_CONFIDENCE }), tx.acceptedAbove90);

  const pageSuggestions = data?.transactions.filter((t) => t.pending_suggestion).length ?? 0;
  const pendingCategoryCount = summary?.pending_category_count ?? 0;

  const totalPages = data ? Math.max(1, Math.ceil(data.meta.total_count / data.meta.per_page)) : 1;
  const page = filters.page ?? 1;
  const hasFilters = FILTER_KEYS.some((key) => filters[key]);
  const statementId = filters.monthly_statement_id ?? null;
  const selectedStatement = statementId ? statements?.find((s) => String(s.id) === statementId) : undefined;

  const clearFilters = () => {
    setSearchText("");
    setSearchParams((prev) => {
      const next = new URLSearchParams();
      const kept = prev.get("sort");
      if (kept) next.set("sort", kept);
      return next;
    });
  };

  const sortHeader = (column: SortableColumn, label: string, className?: string) => {
    const state = columnSortState(column, sort);
    const next = nextColumnSort(column, sort);
    return (
      <th scope="col" className={className} aria-sort={state ?? "none"}>
        <button
          type="button"
          className="btn btn-link p-0 text-reset fw-semibold text-decoration-none text-nowrap"
          title={tx.sortColumn(label)}
          onClick={() => updateFilters({ sort: next === DEFAULT_SORT ? "" : next })}
        >
          {label}{" "}
          <span aria-hidden="true" className={state ? "" : "text-muted opacity-50"}>
            {state === "ascending" ? "▲" : state === "descending" ? "▼" : "↕"}
          </span>
        </button>
      </th>
    );
  };

  return (
    <Container className="mt-4 text-start">
      <div className="d-flex flex-wrap align-items-baseline justify-content-between gap-2 mb-3">
        <h2 className="mb-0">{tx.title}</h2>
        {data && (
          <span className="text-muted" data-testid="transactions-summary">
            {tx.summary(i18n.common.transactions(data.meta.total_count), showTotals ? formatCurrency(data.meta.total_amount) : HIDDEN)}
          </span>
        )}
      </div>

      <StatementsPanel
        statements={statements}
        loadError={statementsError}
        selectedId={statementId}
        defaultOpen={searchParams.get("statements") === "open"}
        onSelect={(id) => updateFilters({ monthly_statement_id: String(id), from: "", to: "" })}
        onChanged={({ deletedId }) => {
          loadStatements();
          if (deletedId && String(deletedId) === statementId) updateFilters({ monthly_statement_id: "" });
          else load();
          refreshSummary();
        }}
      />

      <Form onSubmit={(e) => e.preventDefault()} className="mb-3">
        <Row className="g-2">
          <Col xs={12} lg={9}>
            <DateRangeFilter
              range={range}
              months={data?.meta.months ?? []}
              min={data?.meta.first_date}
              max={data?.meta.last_date}
              onChange={(next) => updateFilters({ from: next.from, to: next.to })}
            />
          </Col>
          <Col xs={12} lg={3}>
            <Form.Select aria-label={tx.sortBy} value={sort} onChange={(e) => updateFilters({ sort: e.target.value === DEFAULT_SORT ? "" : e.target.value })}>
              {TRANSACTION_SORTS.map((value) => (
                <option key={value} value={value}>
                  {tx.sortBy}: {tx.sorts[value]}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col xs={12} md={4}>
            <Form.Control aria-label={tx.search} type="search" placeholder={tx.searchPlaceholder} value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          </Col>
          <Col xs={6} md={3}>
            <Form.Select
              aria-label={tx.category}
              value={filters.category_id ?? ""}
              onChange={(e) => updateFilters({ category_id: e.target.value, subcategory_id: "" })}
            >
              <option value="">{tx.allCategories}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col xs={6} md={3}>
            <Form.Select aria-label={tx.subcategory} value={filters.subcategory_id ?? ""} onChange={(e) => updateFilters({ subcategory_id: e.target.value })}>
              <option value="">{tx.allSubcategories}</option>
              {subcategoryOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {filters.category_id ? s.name : `${s.categoryName} / ${s.name}`}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col xs={12} md={2}>
            <Form.Select aria-label={tx.type} value={filters.transaction_type ?? ""} onChange={(e) => updateFilters({ transaction_type: e.target.value })}>
              <option value="">{tx.allTypes}</option>
              <option value="debit">{tx.types.debit}</option>
              <option value="credit">{tx.types.credit}</option>
              <option value="unknown">{tx.types.unknown}</option>
            </Form.Select>
          </Col>
          <Col xs={12} className="d-flex flex-wrap align-items-center gap-3">
            <Form.Check
              type="switch"
              id="filter-unknown"
              label={tx.onlyUnknown}
              checked={filters.unknown === "true"}
              onChange={(e) => updateFilters({ unknown: e.target.checked ? "true" : "" })}
            />
            {statementId && (
              <Badge bg="light" text="dark" className="border d-inline-flex align-items-center gap-2 fw-normal" data-testid="statement-filter">
                {tx.statementFilter(selectedStatement?.filename ?? `#${statementId}`)}
                <Button
                  size="sm"
                  variant="link"
                  className="p-0 lh-1 text-reset"
                  aria-label={tx.clearStatement}
                  title={tx.clearStatement}
                  onClick={() => updateFilters({ monthly_statement_id: "" })}
                >
                  ✕
                </Button>
              </Badge>
            )}
            {hasFilters && (
              <Button size="sm" variant="link" className="p-0 ms-auto" onClick={clearFilters}>
                {tx.clearFilters}
              </Button>
            )}
          </Col>
        </Row>
      </Form>

      {notice && (
        <Alert variant="success" dismissible onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

      {nudge && (
        <RuleNudge
          suggestion={nudge}
          onDone={(message) => {
            setNudge(null);
            if (message) setNotice(message);
            load();
            refreshSummary();
          }}
        />
      )}

      {pendingCategoryCount > 0 && (
        <div className="d-flex flex-wrap align-items-center gap-2 border rounded p-2 mb-3 bg-light small" data-testid="suggestions-bar">
          <span>
            {pageSuggestions > 0 && tx.onThisPage(pageSuggestions)}
            {tx.toReview(pendingCategoryCount)}
          </span>
          <Button size="sm" variant="outline-success" disabled={busyId !== null} onClick={acceptAboveThreshold}>
            {tx.acceptAbove90}
          </Button>
          <Link to="/suggestions?tab=transactions" className="ms-auto">
            {tx.reviewByMerchant}
          </Link>
        </div>
      )}

      {error ? (
        <ErrorMessage message={error} />
      ) : loading && !data ? (
        <Loading message={tx.loading} />
      ) : (
        <>
          <Table hover responsive size="sm" className="align-middle" style={{ opacity: loading ? 0.6 : 1 }}>
            <thead>
              <tr>
                {sortHeader("date", tx.columns.date)}
                {sortHeader("name", tx.columns.name)}
                {sortHeader("category", tx.columns.category)}
                <th scope="col">{tx.columns.type}</th>
                {sortHeader("amount", tx.columns.amount, "text-end")}
                <th />
              </tr>
            </thead>
            <tbody>
              {data?.transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    {hasFilters ? tx.emptyFiltered : tx.empty}
                  </td>
                </tr>
              ) : (
                data?.transactions.map((t) => {
                  const type = { bg: TYPE_BADGES[t.transaction_type] ?? TYPE_BADGES.unknown, label: tx.types[t.transaction_type] ?? tx.types.unknown };
                  return (
                    <tr key={t.id}>
                      <td className="text-nowrap" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {formatIsoDate(t.transaction_date)}
                      </td>
                      <td className="text-break">{t.name}</td>
                      <td>
                        <span
                          className="d-inline-block rounded-circle me-2"
                          style={{ width: 10, height: 10, background: t.subcategory?.color_code || "#adb5bd" }}
                        />
                        {t.category?.name} / {t.subcategory?.name}
                        {t.pending_suggestion && (
                          <SuggestionChip
                            suggestion={t.pending_suggestion}
                            busy={busyId !== null}
                            onAccept={() =>
                              decide(t.id, () => suggestionsApi.acceptCategory(t.pending_suggestion!.id), tx.suggestionAccepted)
                            }
                            onChange={() => setEditing({ transaction: t, subcategoryId: t.pending_suggestion!.subcategory.id })}
                            onReject={() =>
                              decide(t.id, () => suggestionsApi.rejectCategory(t.pending_suggestion!.id), tx.suggestionRejected)
                            }
                            onDontKnow={() =>
                              decide(
                                t.id,
                                () => suggestionsApi.dontKnow(t.pending_suggestion!.id),
                                tx.markedUnknown
                              )
                            }
                          />
                        )}
                        {t.unknown_marked && (
                          <div className="d-flex align-items-center gap-1 mt-1" data-testid="unknown-mark">
                            <Badge bg="light" text="dark" className="border" title={tx.cantRememberHint}>
                              {tx.cantRemember}
                            </Badge>
                            <Button
                              size="sm"
                              variant="link"
                              className="p-0 small"
                              disabled={busyId !== null}
                              onClick={() => decide(t.id, () => transactionsApi.unmarkUnknown(t.id), tx.unmarked)}
                            >
                              {i18n.common.undo}
                            </Button>
                          </div>
                        )}
                      </td>
                      <td>
                        <Badge bg={type.bg}>{type.label}</Badge>
                      </td>
                      <td
                        className={`text-end text-nowrap ${t.transaction_type === "credit" ? "text-success" : ""}`}
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {showTotals ? formatCurrency(t.amount) : HIDDEN}
                      </td>
                      <td className="text-end">
                        <Button size="sm" variant="outline-secondary" onClick={() => setEditing({ transaction: t })}>
                          {tx.recategorize}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>

          {totalPages > 1 && (
            <div className="d-flex align-items-center justify-content-center gap-3">
              <Button variant="outline-secondary" size="sm" disabled={page <= 1} onClick={() => updateFilters({ page: String(page - 1) })}>
                {tx.previous}
              </Button>
              <span className="text-muted">{tx.page(page, totalPages)}</span>
              <Button variant="outline-secondary" size="sm" disabled={page >= totalPages} onClick={() => updateFilters({ page: String(page + 1) })}>
                {tx.next}
              </Button>
            </div>
          )}
        </>
      )}

      <RecategorizeModal
        transaction={editing?.transaction ?? null}
        initialSubcategoryId={editing?.subcategoryId}
        categories={categories}
        showTotals={showTotals}
        onHide={() => setEditing(null)}
        onSaved={handleSaved}
        onMarkedUnknown={() => {
          setEditing(null);
          setNotice(tx.markedUnknown);
          load();
          refreshSummary();
        }}
      />
    </Container>
  );
}
