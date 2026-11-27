import { useI18n } from "../i18n/context";
import type { SubcategoryReportEntry } from "../types";
import { toSlices } from "../utils/reportSlices";
import BreakdownChart from "./reports/BreakdownChart";

interface Props {
  data: SubcategoryReportEntry[];
  showTotals: boolean;
  /** Shown above the subcategory name in the details modal, e.g. "Money out · October 2026". */
  context?: string;
}

export default function SubcategoryChart({ data, showTotals, context }: Props) {
  const { t } = useI18n();
  if (!Array.isArray(data)) return <p>{t.charts.invalidData}</p>;
  return <BreakdownChart slices={toSlices(data)} showTotals={showTotals} context={context} countLabel={t.reports.breakdown.subcategories} />;
}
