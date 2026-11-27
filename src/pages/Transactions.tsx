import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Col, Container, Form, Row, Table } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import { categoriesApi, transactionsApi } from "../api";
import { ErrorMessage, Loading } from "../components/LoadingState";
import RecategorizeModal from "../components/transactions/RecategorizeModal";
import type { Category, RecategorizeResult, Transaction, TransactionFilters, TransactionsPage } from "../types";
import { formatIsoDate, formatMonth } from "../utils/dates";
import { formatCurrency } from "../utils/formatter";

interface Props {
  showTotals: boolean;
}

const PER_PAGE = 50;
const FILTER_KEYS = ["month", "category_id", "subcategory_id", "transaction_type", "q"] as const;
const HIDDEN = "R$ •••";

const TYPE_STYLES: Record<string, { label: string; bg: string }> = {
  debit: { label: "Debit", bg: "secondary" },
  credit: { label: "Credit", bg: "success" },
  unknown: { label: "Unknown", bg: "warning" },
};

export default function Transactions({ showTotals }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<TransactionsPage | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [searchText, setSearchText] = useState(searchParams.get("q") ?? "");

  const filters: TransactionFilters = useMemo(() => {
    const result: TransactionFilters = { page: Number(searchParams.get("page")) || 1, per_page: PER_PAGE };
    FILTER_KEYS.forEach((key) => {
      const value = searchParams.get(key);
      if (value) result[key] = value;
    });
    return result;
  }, [searchParams]);

  const updateFilters = useCallback(
    (changes: Partial<Record<(typeof FILTER_KEYS)[number] | "page", string>>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
        if (!("page" in changes)) next.delete("page");
        return next;
      });
    },
    [setSearchParams]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await transactionsApi.list(filters));
    } catch (err) {
      console.error(err);
      setError("Could not load transactions.");
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
    const parts = ["Transaction updated."];
    if (result.keyword) parts.push(`Keyword "${result.keyword.name}" saved.`);
    if (result.updated_count > 0) parts.push(`${result.updated_count} other transaction(s) moved.`);
    setNotice(parts.join(" "));
    load();
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.meta.total_count / data.meta.per_page)) : 1;
  const page = filters.page ?? 1;
  const hasFilters = FILTER_KEYS.some((key) => filters[key]);

  return (
    <Container className="mt-4 text-start">
      <div className="d-flex flex-wrap align-items-baseline justify-content-between gap-2 mb-3">
        <h2 className="mb-0">Transactions</h2>
        {data && (
          <span className="text-muted" data-testid="transactions-summary">
            {data.meta.total_count} transaction{data.meta.total_count === 1 ? "" : "s"} ·{" "}
            {showTotals ? formatCurrency(data.meta.total_amount) : HIDDEN}
          </span>
        )}
      </div>

      <Form onSubmit={(e) => e.preventDefault()} className="mb-3">
        <Row className="g-2">
          <Col xs={6} md={2}>
            <Form.Select aria-label="Month" value={filters.month ?? ""} onChange={(e) => updateFilters({ month: e.target.value })}>
              <option value="">All months</option>
              {data?.meta.months.map((month) => (
                <option key={month} value={month}>
                  {formatMonth(month)}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col xs={6} md={2}>
            <Form.Select
              aria-label="Category"
              value={filters.category_id ?? ""}
              onChange={(e) => updateFilters({ category_id: e.target.value, subcategory_id: "" })}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col xs={6} md={3}>
            <Form.Select aria-label="Subcategory" value={filters.subcategory_id ?? ""} onChange={(e) => updateFilters({ subcategory_id: e.target.value })}>
              <option value="">All subcategories</option>
              {subcategoryOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {filters.category_id ? s.name : `${s.categoryName} / ${s.name}`}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col xs={6} md={2}>
            <Form.Select aria-label="Type" value={filters.transaction_type ?? ""} onChange={(e) => updateFilters({ transaction_type: e.target.value })}>
              <option value="">All types</option>
              <option value="debit">Debit</option>
              <option value="credit">Credit</option>
              <option value="unknown">Unknown</option>
            </Form.Select>
          </Col>
          <Col xs={12} md={3}>
            <Form.Control aria-label="Search" type="search" placeholder="Search name..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          </Col>
        </Row>
      </Form>

      {notice && (
        <Alert variant="success" dismissible onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

      {error ? (
        <ErrorMessage message={error} />
      ) : loading && !data ? (
        <Loading message="Loading transactions..." />
      ) : (
        <>
          <Table hover responsive size="sm" className="align-middle" style={{ opacity: loading ? 0.6 : 1 }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Category / Subcategory</th>
                <th>Type</th>
                <th className="text-end">Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data?.transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    {hasFilters ? "No transactions match these filters." : "No transactions yet. Upload a statement to get started."}
                  </td>
                </tr>
              ) : (
                data?.transactions.map((t) => {
                  const type = TYPE_STYLES[t.transaction_type] ?? TYPE_STYLES.unknown;
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
                        <Button size="sm" variant="outline-secondary" onClick={() => setEditing(t)}>
                          Re-categorize
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
                Previous
              </Button>
              <span className="text-muted">
                Page {page} of {totalPages}
              </span>
              <Button variant="outline-secondary" size="sm" disabled={page >= totalPages} onClick={() => updateFilters({ page: String(page + 1) })}>
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <RecategorizeModal
        transaction={editing}
        categories={categories}
        showTotals={showTotals}
        onHide={() => setEditing(null)}
        onSaved={handleSaved}
      />
    </Container>
  );
}
