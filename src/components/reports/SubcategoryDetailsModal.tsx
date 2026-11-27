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
  type SubcategorySlice,
  type TransactionSort,
} from "../../utils/subcategoryReport";

interface Props {
  slice: SubcategorySlice | null;
  /** "Money in" / "Money out" and the month, shown above the name. */
  context: string;
  showTotals: boolean;
  onHide: () => void;
}

export default function SubcategoryDetailsModal({ slice, context, showTotals, onHide }: Props) {
  const { t } = useI18n();
  const s = t.reports.subcategory;
  const [sort, setSort] = useState<TransactionSort>("date");

  const money = (value: number) => (showTotals ? formatCurrency(value) : s.hidden);
  const transactions = slice ? sortTransactions(slice.transactions, sort) : [];
  const average = transactions.length ? (slice?.total ?? 0) / transactions.length : 0;

  return (
    <Modal show={slice !== null} onHide={onHide} size="lg" centered scrollable className="subcat-modal">
      {slice && (
        <>
          <Modal.Header closeButton closeLabel={s.close} style={{ borderTop: `6px solid ${slice.color}` }}>
            <div className="subcat-modal-head">
              <span className="subcat-modal-context">{context}</span>
              <Modal.Title as="h2" className="subcat-modal-title">
                <span className="subcat-swatch subcat-swatch-lg" style={{ background: slice.color }} aria-hidden />
                {slice.name}
              </Modal.Title>
            </div>
          </Modal.Header>

          <Modal.Body>
            <div className="subcat-modal-stats">
              <div>
                <span className="subcat-stat-label">{t.common.total}</span>
                <span className="subcat-stat-value">{money(slice.total)}</span>
              </div>
              <div>
                <span className="subcat-stat-label">{s.share}</span>
                <span className="subcat-stat-value">{formatPercent(slice.percent)}</span>
              </div>
              <div>
                <span className="subcat-stat-label">{s.count}</span>
                <span className="subcat-stat-value">{transactions.length}</span>
              </div>
              <div>
                <span className="subcat-stat-label">{s.average}</span>
                <span className="subcat-stat-value">{money(average)}</span>
              </div>
            </div>

            <div className="subcat-modal-toolbar">
              <span className="subcat-stat-label">{s.sortBy}</span>
              <div className="subcat-segmented" role="group" aria-label={s.sortBy}>
                {(["date", "amount"] as const).map((key) => (
                  <button key={key} type="button" aria-pressed={sort === key} onClick={() => setSort(key)}>
                    {key === "date" ? s.sortDate : s.sortAmount}
                  </button>
                ))}
              </div>
            </div>

            <table className="subcat-table">
              <thead>
                <tr>
                  <th scope="col">{s.date}</th>
                  <th scope="col">{s.description}</th>
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
                      <td className="subcat-date">{displayDate(tx.transaction_date)}</td>
                      <td className="subcat-desc">{cleanName(tx.name)}</td>
                      <td className="num">
                        {showTotals ? (
                          <span className={`subcat-amount subcat-amount-${tier}`} title={tier === "high" ? s.highHint : tier === "medium" ? s.mediumHint : undefined}>
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
