import { useI18n } from "../i18n/context";
import type { CategoryReportEntry } from "../types";
import { toCategorySlices } from "../utils/reportSlices";
import BreakdownChart from "./reports/BreakdownChart";

interface Props {
  /** category name => entry, for one month */
  data: Record<string, CategoryReportEntry>;
  showTotals: boolean;
  /** Shown above the category name in the details modal, e.g. "Money out · October 2026". */
  context?: string;
}

export default function CategoryChart({ data, showTotals, context }: Props) {
  const { t } = useI18n();
  if (!data || typeof data !== "object") return <p>{t.charts.invalidData}</p>;
  return <BreakdownChart slices={toCategorySlices(data)} showTotals={showTotals} context={context} countLabel={t.reports.breakdown.categories} />;
}
