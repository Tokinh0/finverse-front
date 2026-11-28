import { reportsApi } from "../../api";
import CategoryChart from "../../components/CategoryChart";
import { ErrorMessage, Loading } from "../../components/LoadingState";
import { ReportMonth, ReportPage, ReportPanel } from "../../components/reports/MonthlyReportLayout";
import { useCreditDebitReport } from "../../hooks/useCreditDebitReport";
import { useI18n } from "../../i18n/context";
import { longMonth, sumTotals, toCategorySlices } from "../../utils/reportSlices";

interface Props {
  showTotals: boolean;
}

export default function MonthlyByCategory({ showTotals }: Props) {
  const { credit, debit, months, loading, error } = useCreditDebitReport(reportsApi.monthlyByCategory);
  const { t } = useI18n();

  if (loading) return <Loading message={t.reports.loading} />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <ReportPage title={t.reports.byCategoryTitle} subtitle={t.reports.breakdown.subtitleByCategory}>
      {months.map((month) => {
        const moneyIn = credit[month] || {};
        const moneyOut = debit[month] || {};
        // The API sends no month totals here: each side is the sum of its categories.
        const totalIn = sumTotals(toCategorySlices(moneyIn));
        const totalOut = sumTotals(toCategorySlices(moneyOut));
        const label = longMonth(month);

        return (
          <ReportMonth key={month} label={label} moneyIn={totalIn} moneyOut={totalOut} showTotals={showTotals}>
            <ReportPanel kind="in" title={t.reports.gains} total={totalIn} showTotals={showTotals}>
              <CategoryChart data={moneyIn} showTotals={showTotals} context={`${t.reports.gains} · ${label}`} />
            </ReportPanel>
            <ReportPanel kind="out" title={t.reports.expenses} total={totalOut} showTotals={showTotals}>
              <CategoryChart data={moneyOut} showTotals={showTotals} context={`${t.reports.expenses} · ${label}`} />
            </ReportPanel>
          </ReportMonth>
        );
      })}
    </ReportPage>
  );
}
