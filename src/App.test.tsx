import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { keywordsApi, subcategoriesApi } from "./api";
import App from "./App";

vi.mock("./api", async () => (await import("./test/mockApi")).mockApiModule());

describe("App", () => {
  it("routes to the requested page", async () => {
    vi.mocked(keywordsApi.list).mockResolvedValue([]);
    vi.mocked(subcategoriesApi.list).mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/keywords"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Keywords Management" })).toBeInTheDocument();
  });
});
