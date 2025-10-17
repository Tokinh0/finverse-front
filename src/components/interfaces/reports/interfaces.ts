interface MonthDetail {
  subcategories: SubcategoryData[];
  total: number;
  total_invested: number;
  total_transfered: number;
  total_expended: number;
  total_received: number;
}

type MonthlyReportData = {
  [month: string]: MonthDetail;
};

interface FullReport {
  credit: MonthlyReportData;
  debit:  MonthlyReportData;
}