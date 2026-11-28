import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { marketApi } from "../../api";
import { useI18n } from "../../i18n/context";
import type { AssetValuation, AssetValuationRow } from "../../types";
import { formatCurrency } from "../../utils/formatter";
import { changeClass, formatChange, formatPrice, percentChange } from "../../utils/market";
import { ErrorMessage, Loading } from "../LoadingState";

interface Props {
  showTotals: boolean;
  /** Changing it looks the prices up again. */
  refreshKey: number;
}

/**
 * The profile's assets valued at today's prices, next to the saved values. Saving writes the
 * new unit price and value on the assets (after a confirmation); nothing changes before that.
 */
export default function AssetPrices({ showTotals, refreshKey }: Props) {
  const { t } = useI18n();
  const a = t.market.assets;
  const hidden = t.common.hiddenAmount;
  const [valuation, setValuation] = useState<AssetValuation | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ variant: "success" | "danger"; text: string } | null>(null);

  const load = useCallback(() => {
    setLoadError(null);
    marketApi
      .assets()
      .then(setValuation)
      .catch((err) => {
        console.error(err);
        setLoadError(a.loadError);
      });
  }, [a.loadError]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const priced = valuation?.assets.filter((row) => row.status === "priced") ?? [];

  const save = async () => {
    if (!window.confirm(a.confirmSave(priced.length))) return;
    setSaving(true);
    setNotice(null);
    try {
      const updated = await marketApi.applyAssetPrices(priced.map((row) => row.id));
      setValuation(updated);
      setNotice({ variant: "success", text: a.saved(updated.updated_count ?? priced.length) });
    } catch (err) {
      console.error(err);
      setNotice({ variant: "danger", text: a.saveError });
    } finally {
      setSaving(false);
    }
  };

  const money = (value: number | null) => (value === null ? "—" : showTotals ? formatCurrency(value) : hidden);

  const difference = (from: number | null, to: number | null) => {
    const pct = percentChange(from, to);
    if (pct === null || from === null || to === null) return "—";
    return (
      <span className={changeClass(pct)}>
        {formatChange(pct)}
        {showTotals && <span className="d-block small">{formatCurrency(to - from)}</span>}
      </span>
    );
  };

  const row = (r: AssetValuationRow) => (
    <tr key={r.id}>
      <td>
        <div className="fw-semibold">{r.ticker || "—"}</div>
        <div className="small text-muted">{r.description}</div>
      </td>
      <td className="small">{r.asset_type_label ?? "—"}</td>
      <td className="text-end">{showTotals ? (r.quantity ?? "—") : "•••"}</td>
      <td className="text-end">{r.saved_unit_price === null ? "—" : formatPrice(r.saved_unit_price)}</td>
      {r.status === "priced" && r.unit_price !== null ? (
        <>
          <td className="text-end">
            {formatPrice(r.unit_price)}
            {r.change_pct !== null && (
              <span className={`d-block small ${changeClass(r.change_pct)}`}>{formatChange(r.change_pct)}</span>
            )}
          </td>
          <td className="text-end">{money(r.saved_value)}</td>
          <td className="text-end">{money(r.live_value)}</td>
          <td className="text-end text-nowrap">{difference(r.saved_value, r.live_value)}</td>
        </>
      ) : (
        <>
          <td className="text-end">
            <Badge bg="light" text="dark" className="fw-normal text-wrap">
              {a.status[r.status]}
            </Badge>
          </td>
          <td className="text-end">{money(r.saved_value)}</td>
          <td className="text-end">—</td>
          <td className="text-end">—</td>
        </>
      )}
    </tr>
  );

  const needsToken = valuation?.assets.some((r) => r.status === "needs_token");

  return (
    <Card className="mb-4">
      <Card.Body>
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
          <div>
            <h2 className="h5 mb-1">{a.title}</h2>
            <p className="small text-muted mb-0">{a.help}</p>
          </div>
          {valuation && priced.length > 0 && (
            <Button onClick={save} disabled={saving}>
              {saving ? a.saving : a.save(priced.length)}
            </Button>
          )}
        </div>

        {notice && (
          <Alert variant={notice.variant} className="py-2" dismissible onClose={() => setNotice(null)}>
            {notice.text}
          </Alert>
        )}
        {needsToken && (
          <Alert variant="info" className="py-2">
            {a.tokenHint} <Link to="/settings">{t.market.addToken}</Link>
          </Alert>
        )}

        {loadError ? (
          <ErrorMessage message={loadError} />
        ) : !valuation ? (
          <Loading message={a.loading} />
        ) : valuation.assets.length === 0 ? (
          <p className="text-muted mb-0">
            {a.empty} <Link to="/assets">{t.nav.assets}</Link>
          </p>
        ) : (
          <div className="table-responsive">
            <Table size="sm" hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">{a.asset}</th>
                  <th scope="col">{a.type}</th>
                  <th scope="col" className="text-end">{a.quantity}</th>
                  <th scope="col" className="text-end">{a.savedPrice}</th>
                  <th scope="col" className="text-end">{a.todayPrice}</th>
                  <th scope="col" className="text-end">{a.savedValue}</th>
                  <th scope="col" className="text-end">{a.todayValue}</th>
                  <th scope="col" className="text-end">{a.difference}</th>
                </tr>
              </thead>
              <tbody>{valuation.assets.map(row)}</tbody>
              {priced.length > 0 && (
                <tfoot>
                  <tr className="fw-semibold">
                    <th scope="row" colSpan={5}>
                      {a.totals(valuation.totals.priced_count)}
                    </th>
                    <td className="text-end">{money(valuation.totals.saved_value)}</td>
                    <td className="text-end">{money(valuation.totals.live_value)}</td>
                    <td className="text-end text-nowrap">{difference(valuation.totals.saved_value, valuation.totals.live_value)}</td>
                  </tr>
                </tfoot>
              )}
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
