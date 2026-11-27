import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePersistentToggle } from "./usePersistentToggle";

describe("usePersistentToggle", () => {
  afterEach(() => window.localStorage.clear());

  it("starts from the fallback, saves changes and survives a remount (reload)", () => {
    const first = renderHook(() => usePersistentToggle("test.toggle", false));
    expect(first.result.current[0]).toBe(false);

    act(() => first.result.current[1](true));
    expect(first.result.current[0]).toBe(true);
    first.unmount();

    const second = renderHook(() => usePersistentToggle("test.toggle", false));
    expect(second.result.current[0]).toBe(true);
  });

  it("still works when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    const { result } = renderHook(() => usePersistentToggle("test.toggle", false));
    act(() => result.current[1](true));

    expect(result.current[0]).toBe(true);
  });
});
