import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest, API_BASE_URL } from "./client";
import { alertsApi, keywordsApi, reportsApi, settingsApi, statementsApi, suggestionsApi, toQuery, transactionsApi } from "./index";

const mockFetch = (status: number, body?: unknown) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), { status })
  );

describe("apiRequest", () => {
  afterEach(() => vi.restoreAllMocks());

  it("prefixes /api/v1 and parses JSON", async () => {
    const fetchSpy = mockFetch(200, [{ id: 1 }]);

    await expect(apiRequest("/keywords")).resolves.toEqual([{ id: 1 }]);
    expect(fetchSpy).toHaveBeenCalledWith(`${API_BASE_URL}/api/v1/keywords`, expect.objectContaining({ body: undefined }));
  });

  it("serializes json bodies with a JSON content type", async () => {
    const fetchSpy = mockFetch(201, { id: 2 });

    await keywordsApi.create({ name: "UBER", subcategory_id: 3 });

    const [, init] = fetchSpy.mock.calls[0];
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({ "Content-Type": "application/json" });
    expect(JSON.parse(init?.body as string)).toEqual({ keyword: { name: "UBER", subcategory_id: 3 } });
  });

  it("sends uploads as multipart form data", async () => {
    const fetchSpy = mockFetch(201, { statement: {}, summary_lines: [] });

    await statementsApi.upload(new File(["a"], "fatura.csv"));

    const body = fetchSpy.mock.calls[0][1]?.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect((body.get("monthly_statement[file]") as File).name).toBe("fatura.csv");
  });

  it("returns undefined for empty responses", async () => {
    mockFetch(204);

    await expect(keywordsApi.remove(1)).resolves.toBeUndefined();
  });

  it("throws ApiError with the status and body on failures", async () => {
    mockFetch(422, { name: ["can't be blank"] });

    const error = await apiRequest("/keywords").catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 422, body: { name: ["can't be blank"] } });
  });
});

describe("transactionsApi", () => {
  afterEach(() => vi.restoreAllMocks());

  it("sends only the filters that are set", async () => {
    const fetchSpy = mockFetch(200, { transactions: [], meta: {} });

    await transactionsApi.list({ month: "2025-03", q: "", page: 2 });

    expect(fetchSpy.mock.calls[0][0]).toBe(`${API_BASE_URL}/api/v1/transactions?month=2025-03&page=2`);
    expect(toQuery({})).toBe("");
  });

  it("nests re-categorize params under transaction", async () => {
    const fetchSpy = mockFetch(200, { transaction: {}, keyword: null, updated_count: 0 });

    await transactionsApi.recategorize(5, { subcategory_id: 3, keyword: "IFD", apply_to_matching: true });

    expect(fetchSpy.mock.calls[0][1]?.method).toBe("PATCH");
    expect(JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)).toEqual({
      transaction: { subcategory_id: 3, keyword: "IFD", apply_to_matching: true },
    });
  });
});

describe("alertsApi", () => {
  afterEach(() => vi.restoreAllMocks());

  it("lists, dismisses and restores alerts", async () => {
    const fetchSpy = mockFetch(204);

    await alertsApi.list({ month: "2025-07", include_dismissed: true });
    await alertsApi.dismiss(2, "duplicate");
    await alertsApi.restore(2, "duplicate");

    const [list, dismiss, restore] = fetchSpy.mock.calls;
    expect(list[0]).toBe(`${API_BASE_URL}/api/v1/alerts?month=2025-07&include_dismissed=true`);
    expect(dismiss[1]?.method).toBe("POST");
    expect(JSON.parse(dismiss[1]?.body as string)).toEqual({ transaction_id: 2, kind: "duplicate" });
    expect(restore[1]?.method).toBe("DELETE");
  });
});

describe("suggestion and settings endpoints", () => {
  afterEach(() => vi.restoreAllMocks());

  const call = (index = 0) => {
    const [url, init] = vi.mocked(globalThis.fetch).mock.calls[index];
    return { url: String(url).replace(`${API_BASE_URL}/api/v1`, ""), method: init?.method ?? "GET", body: init?.body ? JSON.parse(init.body as string) : undefined };
  };

  it("hits the right paths with the right bodies", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response("{}", { status: 200 }));

    await settingsApi.updateClaude({ api_key: "sk-ant-x", model: "claude-haiku-5-5" });
    await settingsApi.removeClaudeKey();
    await suggestionsApi.acceptCategory(5, 10);
    await suggestionsApi.acceptCategory(6);
    await suggestionsApi.bulkAccept({ min_confidence: 0.9 });
    await suggestionsApi.acceptRule(8, { name: "UBER", reapply: "all" });
    await suggestionsApi.rejectRule(8);
    await suggestionsApi.categories({ month: "2025-03" });
    await reportsApi.categorizationProgress(6);
    await keywordsApi.health();

    expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(call)).toEqual([
      { url: "/settings/claude", method: "PUT", body: { claude: { api_key: "sk-ant-x", model: "claude-haiku-5-5" } } },
      { url: "/settings/claude", method: "DELETE", body: undefined },
      { url: "/category_suggestions/5/accept", method: "POST", body: { subcategory_id: 10 } },
      { url: "/category_suggestions/6/accept", method: "POST", body: {} },
      { url: "/category_suggestions/bulk_accept", method: "POST", body: { min_confidence: 0.9 } },
      { url: "/rule_suggestions/8/accept", method: "POST", body: { name: "UBER", reapply: "all" } },
      { url: "/rule_suggestions/8/reject", method: "POST", body: undefined },
      { url: "/category_suggestions?month=2025-03", method: "GET", body: undefined },
      { url: "/reports/categorization_progress?months=6", method: "GET", body: undefined },
      { url: "/keywords/health", method: "GET", body: undefined },
    ]);
  });
});

