import { messages } from "../i18n/locale";
export interface RawMonthlyStatement {
  id: number;
  filename?: string;
  uploaded_at?: string;
  created_at?: string;
  first_transaction_date?: string;
  last_transaction_date?: string;
  status?: string;
  transactions_count?: number;
}

export class MonthlyStatementPresenter {
  id: number;
  filename: string;
  uploadedAt: string;
  firstTransactionDate: string;
  lastTransactionDate: string;
  status?: string;
  /** ISO dates as the API sent them (null when unknown), for sorting and filtering */
  firstDate: string | null;
  lastDate: string | null;
  transactionsCount: number | null;

  constructor(raw: RawMonthlyStatement) {
    this.id = raw.id;
    this.filename = raw.filename || messages().statements.unnamedFile;
    this.uploadedAt = raw.uploaded_at || raw.created_at || messages().statements.unknownDate;
    this.firstTransactionDate = raw.first_transaction_date || messages().statements.unknownDate;
    this.lastTransactionDate = raw.last_transaction_date || messages().statements.unknownDate;
    this.status = raw.status || "";
    this.firstDate = raw.first_transaction_date || null;
    this.lastDate = raw.last_transaction_date || null;
    this.transactionsCount = raw.transactions_count ?? null;
  }

  static parseMany(data: RawMonthlyStatement[]): MonthlyStatementPresenter[] {
    return data.map((item) => new MonthlyStatementPresenter(item));
  }
}
