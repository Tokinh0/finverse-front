import { Button, Form, Table } from "react-bootstrap";
import { useI18n } from "../../i18n/context";
import type { Asset } from "../../types";
import { numberLocale } from "../../utils/dates";
import { formatCurrency } from "../../utils/formatter";
import { ASSET_SORTS, filterAssets, formatQuantity, sortAssets, type AssetSort, type TypeAllocation } from "../../utils/portfolio";
import { formatPercent } from "../../utils/reportSlices";

interface Props {
  assets: Asset[];
  allocation: TypeAllocation[];
  colors: Map<string, string>;
  typeLabel: (type: string) => string;
  showTotals: boolean;
  type: string | null;
  onType: (type: string | null) => void;
  query: string;
  onQuery: (query: string) => void;
  sort: AssetSort;
  onSort: (sort: AssetSort) => void;
  onAdd: () => void;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
}

/** Every holding, filterable by type and text, sortable, with its share of its type and of the whole. */
export default function HoldingsTable(props: Props) {
  const { assets, allocation, colors, typeLabel, showTotals, type, onType, query, onQuery, sort, onSort, onAdd, onEdit, onDelete } = props;
  const { t } = useI18n();
  const pf = t.portfolio;
  const total = assets.reduce((sum, asset) => sum + (asset.current_value || 0), 0);
  const rows = sortAssets(filterAssets(assets, type, query), sort);
  const locale = numberLocale();

  return (
    <section className="pf-card pf-holdings" aria-labelledby="pf-holdings-title">
      <header className="pf-card-head">
        <h2 id="pf-holdings-title">
          {pf.holdingsTitle} <span className="pf-muted">({rows.length})</span>
        </h2>
        <Button variant="dark" onClick={onAdd} className="text-nowrap">
          {pf.addAsset}
        </Button>
      </header>

      <div className="pf-tools">
        <div className="pf-pills" role="group" aria-label={t.portfolio.columns.type}>
          <button type="button" className="pf-pill" aria-pressed={!type} onClick={() => onType(null)}>
            {pf.all} <span className="pf-pill-count">{assets.length}</span>
          </button>
          {allocation.map((entry) => (
            <button key={entry.type} type="button" className="pf-pill" aria-pressed={type === entry.type} onClick={() => onType(entry.type)}>
              <span className="pf-dot" style={{ background: colors.get(entry.type) }} aria-hidden />
              {typeLabel(entry.type)} <span className="pf-pill-count">{entry.count}</span>
            </button>
          ))}
        </div>
        <div className="pf-tools-row">
          <Form.Control type="search" placeholder={pf.search} aria-label={pf.search} value={query} onChange={(e) => onQuery(e.target.value)} />
          <Form.Select aria-label={pf.sortLabel} value={sort} onChange={(e) => onSort(e.target.value as AssetSort)}>
            {ASSET_SORTS.map((key) => (
              <option key={key} value={key}>
                {pf.sortLabel}: {pf.sort[key]}
              </option>
            ))}
          </Form.Select>
        </div>
      </div>

      <Table hover className="pf-table mb-0 align-middle">
        <thead>
          <tr>
            <th>{pf.columns.asset}</th>
            <th>{pf.columns.type}</th>
            <th className="text-end">{pf.columns.quantity}</th>
            <th className="text-end">{pf.columns.value}</th>
            <th>{pf.columns.shareOfType}</th>
            <th className="text-end">{pf.columns.shareOfTotal}</th>
            <th className="text-center">{pf.columns.rating}</th>
            <th className="text-end">
              <span className="visually-hidden">{pf.columns.actions}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="pf-empty-row">
                {pf.noMatches}{" "}
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 align-baseline"
                  onClick={() => {
                    onType(null);
                    onQuery("");
                  }}
                >
                  {pf.showAll}
                </Button>
              </td>
            </tr>
          ) : (
            rows.map((asset) => {
              const label = asset.ticker || asset.description;
              return (
                <tr key={asset.id}>
                  <td className="pf-asset-cell">
                    <div className="pf-asset">
                      <strong>{asset.ticker || "—"}</strong>
                      <span className="pf-muted">{asset.description}</span>
                    </div>
                  </td>
                  <td className="text-nowrap" data-label={pf.columns.type}>
                    <span className="pf-type-cell">
                      <span className="pf-dot" style={{ background: colors.get(asset.asset_type) }} aria-hidden />
                      {typeLabel(asset.asset_type)}
                    </span>
                  </td>
                  <td className="text-end pf-num" data-label={pf.columns.quantity}>{showTotals ? formatQuantity(asset.quantity, locale) : "•••"}</td>
                  <td className="text-end pf-num pf-value" data-label={pf.columns.value}>{showTotals ? formatCurrency(asset.current_value) : t.common.hiddenAmount}</td>
                  <td data-label={pf.columns.shareOfType}>
                    <div className="pf-share">
                      <span className="pf-share-track" aria-hidden>
                        <span style={{ width: `${Math.min(asset.percent_by_type, 100)}%`, background: colors.get(asset.asset_type) }} />
                      </span>
                      <span className="pf-num">{formatPercent(asset.percent_by_type / 100)}</span>
                    </div>
                  </td>
                  <td className="text-end pf-num" data-label={pf.columns.shareOfTotal}>{formatPercent(total > 0 ? asset.current_value / total : 0)}</td>
                  <td className="text-center" data-label={pf.columns.rating}>
                    <span className="pf-rating" data-level={asset.rating >= 8 ? "high" : asset.rating >= 5 ? "mid" : "low"}>
                      {pf.ratingOf(asset.rating)}
                    </span>
                  </td>
                  <td className="pf-actions">
                    <div className="d-flex justify-content-end gap-1">
                      <Button size="sm" variant="outline-secondary" onClick={() => onEdit(asset)} aria-label={pf.edit(label)}>
                        {t.common.edit}
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => onDelete(asset)} aria-label={pf.remove(label)}>
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
    </section>
  );
}
