import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Container, Form, ListGroup } from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
import { alertsApi, categoriesApi, transactionsApi } from "../api";
import { ErrorMessage, Loading } from "../components/LoadingState";
import RecategorizeModal from "../components/transactions/RecategorizeModal";
import type { AlertKind, AlertsResponse, Category, ChargeAlert, Transaction } from "../types";
import { formatIsoDate, formatMonth } from "../utils/dates";
import { formatCurrency } from "../utils/formatter";

interface Props {
  showTotals: boolean;
}

const ALERT_KINDS: { kind: AlertKind; title: string; hint: string; variant: string }[] = [
  { kind: "duplicate", title: "Possible duplicates", hint: "Same merchant and amount charged twice on the same day.", variant: "danger" },
  { kind: "amount_changed", title: "Recurring charge changed", hint: "A monthly charge that used to have a stable amount.", variant: "warning" },
  { kind: "unusual_amount", title: "Unusually large", hint: "At least 3× what this subcategory usually costs.", variant: "warning" },
  { kind: "new_merchant", title: "New, uncategorized merchants", hint: "No keyword matched them and they're new in the last 6 months.", variant: "info" },
];

const alertKey = (alert: ChargeAlert) => `${alert.kind}-${alert.transaction.id}`;

export default function ChargeAlerts({ showTotals }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const month = searchParams.get("month") ?? undefined;
  const showReviewed = searchParams.get("reviewed") === "1";

  const [data, setData] = useState<AlertsResponse | null>(null);
  const [months, setMonths] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await alertsApi.list({ month, include_dismissed: showReviewed || undefined }));
    } catch (err) {
      console.error(err);
      setError("Could not load alerts.");
    } finally {
      setLoading(false);
    }
  }, [month, showReviewed]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    transactionsApi
      .list({ per_page: 1 })
      .then((page) => setMonths(page.meta.months))
      .catch((err) => console.error(err));
    categoriesApi.list().then(setCategories).catch((err) => console.error(err));
  }, []);

  const setParam = (key: string, value?: string) =>
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    });

  const toggleReviewed = async (alert: ChargeAlert) => {
    setBusy(alertKey(alert));
    try {
      if (alert.dismissed) await alertsApi.restore(alert.transaction.id, alert.kind);
      else await alertsApi.dismiss(alert.transaction.id, alert.kind);
      setData((prev) =>
        prev && {
          ...prev,
          alerts: showReviewed
            ? prev.alerts.map((a) => (alertKey(a) === alertKey(alert) ? { ...a, dismissed: !a.dismissed } : a))
            : prev.alerts.filter((a) => alertKey(a) !== alertKey(alert)),
        }
      );
    } catch (err) {
      console.error(err);
      setError("Could not update the alert.");
    } finally {
      setBusy(null);
    }
  };

  const shownMonth = data?.month ?? month;
  const openCount = data?.alerts.filter((a) => !a.dismissed).length ?? 0;

  return (
    <Container className="mt-4 text-start">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-2">
        <h2 className="mb-0">Review charges</h2>
        <div className="d-flex flex-wrap align-items-center gap-3">
          <Form.Select aria-label="Month" value={shownMonth ?? ""} onChange={(e) => setParam("month", e.target.value)} style={{ width: "auto" }}>
            {shownMonth && !months.includes(shownMonth) && <option value={shownMonth}>{formatMonth(shownMonth)}</option>}
            {months.map((m) => (
              <option key={m} value={m}>
                {formatMonth(m)}
              </option>
            ))}
          </Form.Select>
          <Form.Check
            id="show-reviewed"
            type="switch"
            label="Show reviewed"
            checked={showReviewed}
            onChange={(e) => setParam("reviewed", e.target.checked ? "1" : undefined)}
          />
        </div>
      </div>
      <p className="text-muted">
        Charges worth a second look this month. Mark the ones that are fine, re-categorize the ones that landed in the wrong place.
      </p>

      {error && <ErrorMessage message={error} />}
      {loading && !data ? (
        <Loading message="Checking charges..." />
      ) : data && !data.month ? (
        <Alert variant="secondary">No transactions yet. Upload a statement to get started.</Alert>
      ) : data && openCount === 0 && !showReviewed ? (
        <Alert variant="success">Nothing to review for {formatMonth(data.month!)}.</Alert>
      ) : (
        <div className="d-grid gap-4" style={{ opacity: loading ? 0.6 : 1 }}>
          {ALERT_KINDS.map(({ kind, title, hint, variant }) => {
            const alerts = data?.alerts.filter((a) => a.kind === kind) ?? [];
            if (alerts.length === 0) return null;

            return (
              <section key={kind} aria-labelledby={`alerts-${kind}`}>
                <div className="d-flex align-items-baseline gap-2 mb-1">
                  <h5 id={`alerts-${kind}`} className="mb-0">
                    {title}
                  </h5>
                  <Badge bg={variant} text={variant === "warning" || variant === "info" ? "dark" : undefined}>
                    {alerts.length}
                  </Badge>
                </div>
                <p className="text-muted small mb-2">{hint}</p>
                <ListGroup>
                  {alerts.map((alert) => {
                    const t = alert.transaction;
                    return (
                      <ListGroup.Item key={alertKey(alert)} className={`d-flex flex-wrap gap-3 align-items-center ${alert.dismissed ? "opacity-50" : ""}`}>
                        <div className="flex-grow-1" style={{ minWidth: 0 }}>
                          <div className="fw-semibold text-break">{t.name}</div>
                          <div className="small text-muted">
                            {formatIsoDate(t.transaction_date)} · {t.category?.name} / {t.subcategory?.name}
                          </div>
                          {/* amount_changed / unusual_amount messages contain amounts */}
                          <div className="small">{showTotals || kind === "duplicate" || kind === "new_merchant" ? alert.message : "Details hidden (amounts are off)"}</div>
                        </div>
                        <div className="fw-semibold text-nowrap" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {showTotals ? formatCurrency(t.amount) : "R$ •••"}
                        </div>
                        <div className="d-flex gap-2">
                          <Link className="btn btn-sm btn-outline-secondary" to={`/transactions?q=${encodeURIComponent(t.name)}`}>
                            Similar
                          </Link>
                          <Button size="sm" variant="outline-secondary" onClick={() => setEditing(t)}>
                            Re-categorize
                          </Button>
                          <Button
                            size="sm"
                            variant={alert.dismissed ? "outline-dark" : "dark"}
                            disabled={busy === alertKey(alert)}
                            onClick={() => toggleReviewed(alert)}
                          >
                            {alert.dismissed ? "Undo" : "Looks fine"}
                          </Button>
                        </div>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              </section>
            );
          })}
        </div>
      )}

      <RecategorizeModal
        transaction={editing}
        categories={categories}
        showTotals={showTotals}
        onHide={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />
    </Container>
  );
}
