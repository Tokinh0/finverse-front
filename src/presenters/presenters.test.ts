import { describe, expect, it } from "vitest";
import { MonthlyStatementPresenter } from "./MonthlyStatementPresenter";
import { SummaryLinePresenter } from "./SummaryLinePresenter";

describe("MonthlyStatementPresenter", () => {
  it("maps API fields with fallbacks", () => {
    const [statement] = MonthlyStatementPresenter.parseMany([{ id: 1, created_at: "2025-01-02", status: "processed" }]);

    expect(statement).toMatchObject({
      id: 1,
      filename: "Unnamed file",
      uploadedAt: "2025-01-02",
      firstTransactionDate: "Unknown date",
      status: "processed",
    });
  });
});

describe("SummaryLinePresenter", () => {
  it("parses JSON-encoded content and flattens the transaction", () => {
    const line = new SummaryLinePresenter({
      id: 1,
      status: "processed",
      content: '["05/01/2025","IFOOD, SP",null]',
      parsed_transaction: { name: "IFOOD", amount: 60.28, category_name: "Conforto" },
    });

    expect(line.content).toEqual(["05/01/2025", "IFOOD, SP", ""]);
    expect(line).toMatchObject({ name: "IFOOD", amount: 60.28, categoryName: "Conforto" });
  });

  it("accepts arrays and plain comma separated strings", () => {
    expect(new SummaryLinePresenter({ id: 1, status: "failed", content: ["a", "b"] }).content).toEqual(["a", "b"]);
    expect(new SummaryLinePresenter({ id: 2, status: "failed", content: "a,b" }).content).toEqual(["a", "b"]);
  });
});
