export interface RawSummaryLine {
  id: number;
  status: string;
  error?: string;
  content: string[] | string;
  parsed_transaction?: {
    name?: string;
    parsed_name?: string;
    amount?: number;
    transaction_date?: string;
    transaction_type?: string;
    category_name?: string;
    subcategory_name?: string;
  };
}

export class SummaryLinePresenter {
  id: number;
  status: string;
  error?: string;
  content: string[];
  amount?: number;
  name?: string;
  parsedName?: string;
  transactionDate?: string;
  transactionType?: string;
  categoryName?: string;
  subcategoryName?: string;

  constructor(raw: RawSummaryLine) {
    this.id = raw.id;
    this.status = raw.status;
    this.error = raw.error;
    this.content = Array.isArray(raw.content)
      ? raw.content
      : String(raw.content).split(",");

    this.name = raw.parsed_transaction?.name ?? undefined;
    this.parsedName = raw.parsed_transaction?.parsed_name ?? undefined;
    this.amount = raw.parsed_transaction?.amount ?? undefined;
    this.transactionDate = raw.parsed_transaction?.transaction_date ?? undefined;
    this.transactionType = raw.parsed_transaction?.transaction_type ?? undefined;
    this.categoryName = raw.parsed_transaction?.category_name ?? undefined;
    this.subcategoryName = raw.parsed_transaction?.subcategory_name ?? undefined;
  }

  static parseMany(lines: RawSummaryLine[]): SummaryLinePresenter[] {
    return lines.map((l) => new SummaryLinePresenter(l));
  }
}
