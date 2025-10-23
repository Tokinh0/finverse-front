interface SubcategoryData {
  name: string;
  total: number;
  color_code?: string;
  transactions: {
    name: string;
    transaction_date: string;
    amount: number;
  }[];
}