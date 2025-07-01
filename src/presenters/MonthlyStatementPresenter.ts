export interface RawMonthlyStatement {
  id: number;
  filename?: string;
  uploaded_at?: string;
  created_at?: string;
  first_transaction_date?: string;
  last_transaction_date?: string;
  statement_type?: string;
}

export class MonthlyStatementPresenter {
  id: number;
  filename: string;
  uploadedAt: string;
  firstTransactionDate: string;
  lastTransactionDate: string;
  statementType: string;

  constructor(raw: RawMonthlyStatement) {
    this.id = raw.id;
    this.filename = raw.filename || "Unnamed file";
    this.uploadedAt = raw.uploaded_at || raw.created_at || "Unknown date";
    this.firstTransactionDate = raw.first_transaction_date || "Unknown date";
    this.lastTransactionDate = raw.last_transaction_date || "Unknown date";
    this.statementType = raw.statement_type || "";
  }

  static parseMany(data: RawMonthlyStatement[]): MonthlyStatementPresenter[] {
    return data.map((item) => new MonthlyStatementPresenter(item));
  }
}
