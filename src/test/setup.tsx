import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { cloneElement, type ReactElement } from "react";
import { afterEach, vi } from "vitest";

// jsdom has no layout, so give Recharts' ResponsiveContainer a fixed size and let charts render.
vi.mock("recharts", async (importOriginal) => {
  const recharts = await importOriginal<typeof import("recharts")>();
  return {
    ...recharts,
    ResponsiveContainer: ({ children }: { children: ReactElement<{ width?: number; height?: number }> }) =>
      cloneElement(children, { width: 800, height: 400 }),
  };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
