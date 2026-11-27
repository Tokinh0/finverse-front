import { messages } from "../i18n/locale";
export interface RawMonthlyStatement {
  id: number;
  filename?: string;
  uploaded_at?: string;
  created_at?: string;
  first_transaction_date?: string;
  last_transaction_date?: string;
  status?: string;
}

export class MonthlyStatementPresenter {
  id: number;
  filename: string;
  uploadedAt: string;
  firstTransactionDate: string;
  lastTransactionDate: string;
  status?: string;

  constructor(raw: RawMonthlyStatement) {
    this.id = raw.id;
    this.filename = raw.filename || messages().statements.unnamedFile;
    this.uploadedAt = raw.uploaded_at || raw.created_at || messages().statements.unknownDate;
    this.firstTransactionDate = raw.first_transaction_date || messages().statements.unknownDate;
    this.lastTransactionDate = raw.last_transaction_date || messages().statements.unknownDate;
    this.status = raw.status || "";
  }

  static parseMany(data: RawMonthlyStatement[]): MonthlyStatementPresenter[] {
    return data.map((item) => new MonthlyStatementPresenter(item));
  }
}
