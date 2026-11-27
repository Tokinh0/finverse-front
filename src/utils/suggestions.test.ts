import { describe, expect, it } from "vitest";
import { categorySuggestion, progressMonth } from "../test/fixtures";
import { confidenceLabel, groupByMerchant, originLabel, progressHeadline, runProblem } from "./suggestions";

describe("suggestions utils", () => {
  it("formats confidence and origin", () => {
    expect(confidenceLabel(0.874)).toBe("87%");
    expect(originLabel("ai")).toBe("Claude");
    expect(originLabel("history")).toBe("Your history");
  });

  it("groups by merchant and suggested subcategory, most confident first", () => {
    const low = categorySuggestion({ id: 1, merchant_key: "PADARIA", confidence: 0.6 });
    const high1 = categorySuggestion({ id: 2, merchant_key: "MERCADO", confidence: 0.95 });
    const high2 = categorySuggestion({ id: 3, merchant_key: "MERCADO", confidence: 0.95 });
    const other = categorySuggestion({ id: 4, merchant_key: "MERCADO", confidence: 0.7, subcategory: { id: 11, name: "Casa" } });

    const groups = groupByMerchant([low, high1, other, high2]);

    expect(groups.map((g) => [g.merchantKey, g.suggestions.map((s) => s.id)])).toEqual([
      ["MERCADO", [2, 3]],
      ["MERCADO", [4]],
      ["PADARIA", [1]],
    ]);
  });

  it("describes failed and retrying runs", () => {
    expect(runProblem(null)).toBeNull();
    expect(runProblem({ status: "succeeded", error_message: null })).toBeNull();
    expect(runProblem({ status: "failed", error_message: "Key rejected" })).toBe("Key rejected");
    expect(runProblem({ status: "queued", error_message: "Rate limited" })).toBe("Rate limited (retrying)");
  });

  it("builds the progress headline from the latest month with data", () => {
    const headline = progressHeadline([
      progressMonth("2025-02", { keyword: 7, manual: 3 }),
      progressMonth("2025-03", { keyword: 82, uncategorized: 18 }),
      progressMonth("2025-04"),
    ]);

    expect(headline?.text).toBe("82% of Mar 25's transactions were categorized by your rules");
    expect(headline?.change).toBe("↑ 12 points vs Feb 25");
    expect(progressHeadline([])).toBeNull();
  });
});
