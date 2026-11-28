import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest, API_BASE_URL } from "./client";
import { getSessionToken, SESSION_EXPIRED_EVENT, setSessionToken } from "./session";
import { alertsApi, keywordsApi, profilesApi, sessionApi, reportsApi, settingsApi, statementsApi, suggestionsApi, toQuery, transactionsApi } from "./index";

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

    await transactionsApi.list({ from: "2025-03-01", to: "2025-03-31", q: "", sort: "amount_desc", page: 2 });

    expect(fetchSpy.mock.calls[0][0]).toBe(`${API_BASE_URL}/api/v1/transactions?from=2025-03-01&to=2025-03-31&sort=amount_desc&page=2`);
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

describe("sessions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("sends the session token and the UI language", async () => {
    setSessionToken("abc");
    const fetchSpy = mockFetch(200, []);

    await keywordsApi.list();

    expect(fetchSpy.mock.calls[0][1]?.headers).toMatchObject({ Authorization: "Bearer abc", "Accept-Language": "en" });
  });

  it("sends no Authorization header without a session", async () => {
    const fetchSpy = mockFetch(200, []);

    await profilesApi.list();

    expect(fetchSpy.mock.calls[0][1]?.headers).not.toHaveProperty("Authorization");
  });

  it("forgets an expired session and tells the app", async () => {
    setSessionToken("old");
    mockFetch(401, { error: "unauthenticated" });
    const expired = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, expired);

    await expect(keywordsApi.list()).rejects.toMatchObject({ status: 401 });

    expect(getSessionToken()).toBeNull();
    expect(expired).toHaveBeenCalled();
    window.removeEventListener(SESSION_EXPIRED_EVENT, expired);
  });

  it("keeps the token after signing in and drops it after signing out", async () => {
    const fetchSpy = mockFetch(201, { token: "new", profile: { id: 2, name: "Blake" } });

    await expect(sessionApi.signIn(2, "secret")).resolves.toMatchObject({ name: "Blake" });
    expect(JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)).toEqual({ profile_id: 2, password: "secret" });
    expect(sessionApi.hasToken()).toBe(true);

    fetchSpy.mockResolvedValue(new Response(null, { status: 204 }));
    await sessionApi.signOut();
    expect(sessionApi.hasToken()).toBe(false);
  });

  it("drops the token even when signing out fails", async () => {
    setSessionToken("abc");
    mockFetch(500);

    await expect(sessionApi.signOut()).rejects.toBeInstanceOf(ApiError);
    expect(getSessionToken()).toBeNull();
  });

  it("updates the signed-in profile under `profile`", async () => {
    const fetchSpy = mockFetch(200, {});

    await profilesApi.update({ password: "newpass", current_password: "old" });

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/api/v1/profile`);
    expect(init?.method).toBe("PATCH");
    expect(JSON.parse(init?.body as string)).toEqual({ profile: { password: "newpass", current_password: "old" } });
  });
});
