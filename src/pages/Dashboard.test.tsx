import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Dashboard from "./Dashboard";

describe("Dashboard", () => {
  it("renders the BTC chart widget", () => {
    const { container } = render(<Dashboard />);

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(JSON.parse(container.querySelector("script")!.innerHTML)).toMatchObject({ symbol: "BITSTAMP:BTCUSD" });
  });
});
