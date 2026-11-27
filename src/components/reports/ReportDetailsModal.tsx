import { useState } from "react";
import { Modal } from "react-bootstrap";
import { useI18n } from "../../i18n/context";
import { formatCurrency } from "../../utils/formatter";
import {
  amountTier,
  cleanName,
  displayDate,
  formatPercent,
  sortTransactions,
  type ReportSlice,
  type TransactionSort,
} from "../../utils/reportSlices";

interface Props {
  slice: ReportSlice | null;
  /** "Money in" / "Money out" and the month, shown above the name. */
  context: string;
  showTotals: boolean;
  onHide: () => void;
}

/** Everything behind one category or subcategory of a monthly report. */
export default function ReportDetailsModal({ slice, context, showTotals, onHide }: Props) {
  const { t } = useI18n();
  const s = t.reports.breakdown;
  const [sort, setSort] = useState<TransactionSort>("date");

  const money = (value: number) => (showTotals ? formatCurrency(value) : s.hidden);
  const transactions = slice ? sortTransactions(slice.transactions, sort) : [];
  const average = transactions.length ? (slice?.total ?? 0) / transactions.length : 0;
  const withSubcategory = transactions.some((tx) => tx.subcategory);

  return (
    <Modal show={slice !== null} onHide={onHide} size="lg" centered scrollable className="report-modal">
      {slice && (
        <>
          <Modal.Header closeButton closeLabel={s.close} style={{ borderTop: `6px solid ${slice.color}` }}>
            <div className="report-modal-head">
              <span className="report-modal-context">{context}</span>
              <Modal.Title as="h2" className="report-modal-title">
                <span className="report-swatch report-swatch-lg" style={{ background: slice.color }} aria-hidden />
                {slice.name}
              </Modal.Title>
            </div>
          </Modal.Header>

          <Modal.Body>
            <div className="report-modal-stats">
              <div>
                <span className="report-stat-label">{t.common.total}</span>
                <span className="report-stat-value">{money(slice.total)}</span>
              </div>
              <div>
                <span className="report-stat-label">{s.share}</span>
                <span className="report-stat-value">{formatPercent(slice.percent)}</span>
              </div>
              <div>
                <span className="report-stat-label">{s.count}</span>
                <span className="report-stat-value">{transactions.length}</span>
              </div>
              <div>
                <span className="report-stat-label">{s.average}</span>
                <span className="report-stat-value">{money(average)}</span>
              </div>
            </div>

            {slice.parts && slice.parts.length > 0 && (
              <section className="report-parts" aria-label={s.bySubcategory}>
                <h3 className="report-stat-label">{s.bySubcategory}</h3>
                <ul>
                  {slice.parts.map((part) => {
                    const share = slice.total > 0 ? part.total / slice.total : 0;
                    return (
                      <li key={part.name}>
                        <span className="report-parts-name">{part.name}</span>
                        <span className="report-legend-pct">{formatPercent(share)}</span>
                        <span className="report-parts-amount">{money(part.total)}</span>
                        <span className="report-legend-track" aria-hidden>
                          <span style={{ width: `${Math.max(share * 100, 0.5)}%`, background: slice.color }} />
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <div className="report-modal-toolbar">
              <span className="report-stat-label">{s.sortBy}</span>
              <div className="report-segmented" role="group" aria-label={s.sortBy}>
                {(["date", "amount"] as const).map((key) => (
                  <button key={key} type="button" aria-pressed={sort === key} onClick={() => setSort(key)}>
                    {key === "date" ? s.sortDate : s.sortAmount}
                  </button>
                ))}
              </div>
            </div>

            <table className="report-table">
              <thead>
                <tr>
                  <th scope="col">{s.date}</th>
                  <th scope="col">{s.description}</th>
                  {withSubcategory && <th scope="col">{s.subcategory}</th>}
                  <th scope="col" className="num">
                    {s.amount}
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, index) => {
                  const tier = amountTier(tx.amount);
                  return (
                    <tr key={`${tx.transaction_date}-${index}`} data-tier={tier}>
                      <td className="report-date">{displayDate(tx.transaction_date)}</td>
                      <td className="report-desc">{cleanName(tx.name)}</td>
                      {withSubcategory && <td className="report-sub">{tx.subcategory}</td>}
                      <td className="num">
                        {showTotals ? (
                          <span className={`report-amount report-amount-${tier}`} title={tier === "high" ? s.highHint : tier === "medium" ? s.mediumHint : undefined}>
                            {formatCurrency(tx.amount)}
                          </span>
                        ) : (
                          s.hidden
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Modal.Body>
        </>
      )}
    </Modal>
  );
}
