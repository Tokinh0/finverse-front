import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Container, Form, ListGroup } from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
import { alertsApi, categoriesApi, transactionsApi } from "../api";
import { ErrorMessage, Loading } from "../components/LoadingState";
import { useI18n } from "../i18n/context";
import RecategorizeModal from "../components/transactions/RecategorizeModal";
import type { AlertKind, AlertsResponse, Category, ChargeAlert, Transaction } from "../types";
import { formatIsoDate, formatMonth } from "../utils/dates";
import { formatCurrency } from "../utils/formatter";
import { messages } from "../i18n/locale";

interface Props {
  showTotals: boolean;
}

const ALERT_KINDS: { kind: AlertKind; variant: string }[] = [
  { kind: "duplicate", variant: "danger" },
  { kind: "amount_changed", variant: "warning" },
  { kind: "unusual_amount", variant: "warning" },
  { kind: "new_merchant", variant: "info" },
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
  // `t` is each alert's transaction below, so the messages are `i18n` here.
  const { t: i18n } = useI18n();
  const msg = i18n.alerts;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await alertsApi.list({ month, include_dismissed: showReviewed || undefined }));
    } catch (err) {
      console.error(err);
      setError(messages().alerts.loadError);
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
      setError(msg.updateError);
    } finally {
      setBusy(null);
    }
  };

  const shownMonth = data?.month ?? month;
  const openCount = data?.alerts.filter((a) => !a.dismissed).length ?? 0;

  return (
    <Container className="mt-4 text-start">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-2">
        <h2 className="mb-0">{msg.title}</h2>
        <div className="d-flex flex-wrap align-items-center gap-3">
          <Form.Select aria-label={msg.month} value={shownMonth ?? ""} onChange={(e) => setParam("month", e.target.value)} style={{ width: "auto" }}>
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
            label={msg.showReviewed}
            checked={showReviewed}
            onChange={(e) => setParam("reviewed", e.target.checked ? "1" : undefined)}
          />
        </div>
      </div>
      <p className="text-muted">
        {msg.intro}
      </p>

      {error && <ErrorMessage message={error} />}
      {loading && !data ? (
        <Loading message={msg.loading} />
      ) : data && !data.month ? (
        <Alert variant="secondary">{msg.noTransactions}</Alert>
      ) : data && openCount === 0 && !showReviewed ? (
        <Alert variant="success">{msg.nothingToReview(formatMonth(data.month!))}</Alert>
      ) : (
        <div className="d-grid gap-4" style={{ opacity: loading ? 0.6 : 1 }}>
          {ALERT_KINDS.map(({ kind, variant }) => {
            const { title, hint } = msg.kinds[kind];
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
                          <div className="small">{showTotals || kind === "duplicate" || kind === "new_merchant" ? alert.message : msg.detailsHidden}</div>
                        </div>
                        <div className="fw-semibold text-nowrap" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {showTotals ? formatCurrency(t.amount) : i18n.common.hiddenAmount}
                        </div>
                        <div className="d-flex gap-2">
                          <Link className="btn btn-sm btn-outline-secondary" to={`/transactions?q=${encodeURIComponent(t.name)}`}>
                            {msg.similar}
                          </Link>
                          <Button size="sm" variant="outline-secondary" onClick={() => setEditing(t)}>
                            {i18n.transactions.recategorize}
                          </Button>
                          <Button
                            size="sm"
                            variant={alert.dismissed ? "outline-dark" : "dark"}
                            disabled={busy === alertKey(alert)}
                            onClick={() => toggleReviewed(alert)}
                          >
                            {alert.dismissed ? i18n.common.undo : msg.looksFine}
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
