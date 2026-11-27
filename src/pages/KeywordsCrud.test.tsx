import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { keywordsApi, subcategoriesApi } from "../api";
import { MemoryRouter } from "react-router-dom";
import { keyword, keywordHealth, subcategory } from "../test/fixtures";
import KeywordsCrud from "./KeywordsCrud";

vi.mock("../api", async () => (await import("../test/mockApi")).mockApiModule());

describe("KeywordsCrud", () => {
  beforeEach(() => {
    vi.mocked(keywordsApi.list).mockResolvedValue([keyword()]);
    vi.mocked(subcategoriesApi.list).mockResolvedValue([subcategory(), subcategory({ id: 20, name: "Uber" })]);
  });

  it("lists keywords with their subcategory", async () => {
    render(<KeywordsCrud />);

    const row = (await screen.findByText("IFOOD")).closest("tr")!;
    expect(within(row).getByText("Food")).toBeInTheDocument();
  });

  it("creates a keyword", async () => {
    vi.mocked(keywordsApi.create).mockResolvedValue(keyword({ id: 101, name: "UBER", subcategory_id: 20, subcategory: subcategory({ id: 20, name: "Uber" }) }));
    render(<KeywordsCrud />);
    await screen.findByText("IFOOD");

    await userEvent.click(screen.getByRole("button", { name: "+ Add Keyword" }));
    const dialog = screen.getByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Keyword Name"), "UBER");
    await userEvent.selectOptions(within(dialog).getByLabelText("Subcategory"), "20");
    await userEvent.click(within(dialog).getByRole("button", { name: "Add Keyword" }));

    expect(keywordsApi.create).toHaveBeenCalledWith({ name: "UBER", subcategory_id: 20 });
    expect(await screen.findByText("UBER")).toBeInTheDocument();
  });

  it("edits a keyword", async () => {
    vi.mocked(keywordsApi.update).mockResolvedValue(keyword({ name: "IFOOD SP" }));
    render(<KeywordsCrud />);
    await userEvent.click(await screen.findByRole("button", { name: "Edit" }));

    const input = within(screen.getByRole("dialog")).getByLabelText("Keyword Name");
    expect(input).toHaveValue("IFOOD");
    await userEvent.type(input, " SP");
    await userEvent.click(screen.getByRole("button", { name: "Update Keyword" }));

    expect(keywordsApi.update).toHaveBeenCalledWith(100, { name: "IFOOD SP", subcategory_id: 10 });
    expect(await screen.findByText("IFOOD SP")).toBeInTheDocument();
  });

  it("deletes a keyword after confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(keywordsApi.remove).mockResolvedValue(undefined);
    render(<KeywordsCrud />);

    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));

    expect(keywordsApi.remove).toHaveBeenCalledWith(100);
    expect(await screen.findByText("No keywords found. Add one to get started.")).toBeInTheDocument();
  });

  it("shows a retryable error when loading fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(keywordsApi.list).mockRejectedValueOnce(new Error("Network down"));
    render(<KeywordsCrud />);

    expect(await screen.findByText("Network down")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("IFOOD")).toBeInTheDocument();
  });

  it("shows rule health and filters the rules that need attention", async () => {
    vi.mocked(keywordsApi.list).mockResolvedValue([keyword(), keyword({ id: 101, name: "PIX" }), keyword({ id: 102, name: "NADA" })]);
    vi.mocked(keywordsApi.health).mockResolvedValue([
      keywordHealth(),
      keywordHealth({ keyword_id: 101, matches: 4, overrides: 6, flags: ["overridden", "overlapping"], pending_suggestion_ids: [9] }),
      keywordHealth({ keyword_id: 102, matches: 0, flags: ["unused"] }),
    ]);
    render(
      <MemoryRouter>
        <KeywordsCrud />
      </MemoryRouter>
    );

    expect(await screen.findByTestId("health-101")).toHaveTextContent("4 matchesOverridden 6×Overlaps");
    expect(screen.getByTestId("health-102")).toHaveTextContent("Never matches");
    expect(within(screen.getByTestId("health-101")).getByRole("link", { name: "Suggested fix →" })).toHaveAttribute("href", "/suggestions?tab=rules");

    await userEvent.click(screen.getByLabelText("Needs attention (2)"));
    expect(screen.queryByText("IFOOD")).not.toBeInTheDocument();
    expect(screen.getByText("PIX")).toBeInTheDocument();
  });
});
