import { useEffect, useState } from "react";
import type { CreditDebitReport } from "../types";

/** Loads a { credit, debit } report keyed by "YYYY-MM" and lists its months, newest first. */
export function useCreditDebitReport<T extends Record<string, unknown>>(load: () => Promise<CreditDebitReport<T>>) {
  const [report, setReport] = useState<CreditDebitReport<T>>({ credit: {} as T, debit: {} as T });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load()
      .then(setReport)
      .catch((err) => {
        console.error("Failed to fetch report:", err);
        setError("Erro ao carregar o relatório");
      })
      .finally(() => setLoading(false));
  }, [load]);

  const months = Array.from(new Set([...Object.keys(report.credit), ...Object.keys(report.debit)])).sort().reverse();

  return { ...report, months, loading, error };
}
