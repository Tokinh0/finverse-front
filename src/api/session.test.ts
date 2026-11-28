import { afterEach, describe, expect, it, vi } from "vitest";
import { clearSessionToken, currentSessionToken, getSessionToken, setSessionToken } from "./session";

describe("session token", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearSessionToken();
  });

  it("is kept in this browser", () => {
    setSessionToken("abc");
    expect(getSessionToken()).toBe("abc");
    expect(window.localStorage.getItem("finverse.sessionToken")).toBe("abc");

    clearSessionToken();
    expect(currentSessionToken()).toBeNull();
  });

  it("lasts in memory when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    setSessionToken("abc");

    expect(currentSessionToken()).toBe("abc");
  });
});
