import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest, API_BASE_URL } from "./client";
import { keywordsApi, statementsApi, toQuery, transactionsApi } from "./index";

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

