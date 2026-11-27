import { reportsApi } from "../../api";
import { ErrorMessage, Loading } from "../../components/LoadingState";
import { ReportMonth, ReportPage, ReportPanel } from "../../components/reports/MonthlyReportLayout";
import SubcategoryChart from "../../components/SubcategoryChart";
import { useCreditDebitReport } from "../../hooks/useCreditDebitReport";
import { useI18n } from "../../i18n/context";
import type { SubcategoryMonth } from "../../types";
import { longMonth } from "../../utils/reportSlices";

interface Props {
  showTotals: boolean;
}

const EMPTY_MONTH: SubcategoryMonth = {
  subcategories: [],
  total: 0,
  total_invested: 0,
  total_transfered: 0,
  total_expended: 0,
  total_received: 0,
};

// "total" is the panel's headline; the others break it down, shown only when non-zero.
const BREAKDOWN_KEYS = ["total_received", "total_expended", "total_invested", "total_transfered"] as const;

export default function MonthlyBySubcategory({ showTotals }: Props) {
  const { credit, debit, months, loading, error } = useCreditDebitReport(reportsApi.monthlyBySubcategory);
  const { t } = useI18n();

  if (loading) return <Loading message={t.reports.loadingBySubcategory} />;
  if (error) return <ErrorMessage message={error} />;

  const breakdown = (data: SubcategoryMonth) =>
    BREAKDOWN_KEYS.filter((key) => data[key] > 0).map((key) => ({ label: t.reports.totals[key], value: data[key] }));

  return (
    <ReportPage title={t.reports.bySubcategoryTitle} subtitle={t.reports.breakdown.subtitleBySubcategory}>
      {months.map((month) => {
        const moneyIn = credit[month] || EMPTY_MONTH;
        const moneyOut = debit[month] || EMPTY_MONTH;
        const label = longMonth(month);

        return (
          <ReportMonth key={month} label={label} moneyIn={moneyIn.total} moneyOut={moneyOut.total} showTotals={showTotals}>
            <ReportPanel kind="in" title={t.reports.gains} total={moneyIn.total} breakdown={breakdown(moneyIn)} showTotals={showTotals}>
              <SubcategoryChart data={moneyIn.subcategories} showTotals={showTotals} context={`${t.reports.gains} · ${label}`} />
            </ReportPanel>
            <ReportPanel kind="out" title={t.reports.expenses} total={moneyOut.total} breakdown={breakdown(moneyOut)} showTotals={showTotals}>
              <SubcategoryChart data={moneyOut.subcategories} showTotals={showTotals} context={`${t.reports.expenses} · ${label}`} />
            </ReportPanel>
          </ReportMonth>
        );
      })}
    </ReportPage>
  );
}
