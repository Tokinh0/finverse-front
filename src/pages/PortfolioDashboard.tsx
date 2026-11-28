import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Container } from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
import { assetsApi, type AssetParams } from "../api";
import AllocationCard from "../components/assets/AllocationCard";
import AssetFormModal from "../components/assets/AssetFormModal";
import HoldingsTable from "../components/assets/HoldingsTable";
import "../components/assets/Portfolio.css";
import ConfirmDialog from "../components/categorization/ConfirmDialog";
import { Loading } from "../components/LoadingState";
import { useI18n } from "../i18n/context";
import { messages } from "../i18n/locale";
import type { Asset, AssetTypes } from "../types";
import { errorText } from "../utils/categorization";
import { formatCurrency } from "../utils/formatter";
import { allocationByType, typeColors, type AssetSort } from "../utils/portfolio";
import { formatPercent } from "../utils/reportSlices";

interface Props {
  showTotals: boolean;
}

type Dialog = { kind: "form"; asset: Asset | null } | { kind: "delete"; asset: Asset } | null;

/**
 * The investment portfolio: totals, allocation by asset type and every holding. The type filter
 * lives in the URL (`?type=`); amounts follow the global show/hide switch.
 */
export default function PortfolioDashboard({ showTotals }: Props) {
  const { t } = useI18n();
  const pf = t.portfolio;
  const [params, setParams] = useSearchParams();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetTypes>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<AssetSort>("value");

  const load = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    setError(null);
    try {
      const data = await assetsApi.dashboard();
      setAssets(data.assets);
      setAssetTypes(data.asset_types);
    } catch (err) {
      console.error(err);
      setError(errorText(err, messages().portfolio.loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(true);
  }, [load]);

  const allocation = useMemo(() => allocationByType(assets), [assets]);
  const colors = useMemo(() => typeColors(allocation.map((entry) => entry.type), Object.keys(assetTypes)), [allocation, assetTypes]);
  const typeLabel = (key: string) => pf.types[key] ?? assetTypes[key] ?? key;
  const total = allocation.reduce((sum, entry) => sum + entry.value, 0);
  const largest = allocation[0];

  const typeParam = params.get("type");
  const type = typeParam && allocation.some((entry) => entry.type === typeParam) ? typeParam : null;
  const setType = (next: string | null) => {
    const updated = new URLSearchParams(params);
    if (next) updated.set("type", next);
    else updated.delete("type");
    setParams(updated, { replace: true });
  };

  // Saving reloads the dashboard, so the shares per type stay right.
  const save = async (values: AssetParams) => {
    const editing = dialog?.kind === "form" ? dialog.asset : null;
    if (editing) await assetsApi.update(editing.id, values);
    else await assetsApi.create(values);
    setDialog(null);
    setNotice(editing ? pf.updated : pf.added);
    await load();
  };

  const remove = async (asset: Asset) => {
    await assetsApi.remove(asset.id);
    setDialog(null);
    setNotice(pf.deleted);
    await load();
  };

  if (loading) return <Loading message={pf.loading} />;

  if (error && assets.length === 0) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <p className="fw-medium mb-1">{pf.loadFailedTitle}</p>
          <p className="mb-0">{error}</p>
        </Alert>
        <Button variant="outline-secondary" onClick={() => load(true)}>
          {t.common.tryAgain}
        </Button>
      </Container>
    );
  }

  const stats = [
    { label: pf.stats.total, value: showTotals ? formatCurrency(total) : t.common.hiddenAmount, hero: true },
    { label: pf.stats.holdings, value: String(assets.length) },
    { label: pf.stats.types, value: String(allocation.length) },
    ...(largest ? [{ label: pf.stats.largest, value: typeLabel(largest.type), meta: formatPercent(largest.share) }] : []),
  ];

  return (
    <Container className="pf-page">
      <header className="pf-hero">
        <div>
          <h2>{pf.title}</h2>
          <p>{pf.subtitle}</p>
          {!showTotals && <p className="pf-hidden-hint">{pf.hiddenHint}</p>}
        </div>
        <dl className="pf-stats">
          {stats.map((stat) => (
            <div key={stat.label} className="pf-stat" data-hero={stat.hero || undefined}>
              <dt>{stat.label}</dt>
              <dd>
                {stat.value}
                {stat.meta && <span className="pf-stat-meta"> {stat.meta}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      {notice && (
        <Alert variant="success" className="pf-notice" role="status" dismissible onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

      {assets.length === 0 ? (
        <section className="pf-card pf-empty">
          <div className="pf-empty-art" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <p>{pf.empty}</p>
          <Button variant="dark" onClick={() => setDialog({ kind: "form", asset: null })}>
            {pf.addAsset}
          </Button>
        </section>
      ) : (
        <div className="pf-layout">
          <AllocationCard allocation={allocation} colors={colors} typeLabel={typeLabel} showTotals={showTotals} selected={type} onSelect={setType} />
          <HoldingsTable
            assets={assets}
            allocation={allocation}
            colors={colors}
            typeLabel={typeLabel}
            showTotals={showTotals}
            type={type}
            onType={setType}
            query={query}
            onQuery={setQuery}
            sort={sort}
            onSort={setSort}
            onAdd={() => setDialog({ kind: "form", asset: null })}
            onEdit={(asset) => setDialog({ kind: "form", asset })}
            onDelete={(asset) => setDialog({ kind: "delete", asset })}
          />
        </div>
      )}

      <p className="pf-footnote">
        <Link to="/market">{pf.pricesLink}</Link>
      </p>

      {dialog?.kind === "form" && (
        <AssetFormModal asset={dialog.asset} assetTypes={assetTypes} onSave={save} onClose={() => setDialog(null)} errorText={pf.saveError} />
      )}
      {dialog?.kind === "delete" && (
        <ConfirmDialog
          title={pf.deleteTitle(dialog.asset.ticker || dialog.asset.description)}
          body={pf.confirmDelete}
          confirmLabel={t.common.delete}
          onHide={() => setDialog(null)}
          onConfirm={() => remove(dialog.asset)}
        />
      )}
    </Container>
  );
}
