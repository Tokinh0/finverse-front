import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { categoriesApi, keywordsApi, subcategoriesApi } from "../api";
import { category, keyword, keywordHealth, subcategory } from "../test/fixtures";
import { inLocale } from "../test/i18n";
import { COLOR_THEMES, planTheme } from "../utils/colorThemes";
import Categorization from "./Categorization";

vi.mock("../api", async () => (await import("../test/mockApi")).mockApiModule());

const food = subcategory({ id: 10, name: "Food", category: undefined });
const uber = subcategory({ id: 11, name: "Uber", category: undefined });
const cinema = subcategory({ id: 20, name: "Cinema", category: undefined });
const conforto = category({ id: 1, name: "Conforto", subcategories: [food, uber] });
const lazer = category({ id: 2, name: "Lazer", color_code: "#d97706", subcategories: [cinema] });

const renderAt = (path = "/categorization") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/categorization" element={<Categorization />} />
      </Routes>
    </MemoryRouter>
  );

const tree = () => screen.getByRole("navigation", { name: "Categories" });
const panel = () => screen.getByRole("article");

describe("Categorization", () => {
  beforeEach(() => {
    vi.mocked(categoriesApi.list).mockResolvedValue([conforto, lazer]);
    vi.mocked(keywordsApi.list).mockResolvedValue([keyword(), keyword({ id: 101, name: "UBER", subcategory_id: 11 })]);
  });

  it("shows the totals and every category with its subcategories and rule counts", async () => {
    renderAt();

    expect(await screen.findByRole("heading", { name: "Categorization" })).toBeInTheDocument();
    expect(screen.getByText("Subcategories").nextSibling).toHaveTextContent("3");
    expect(screen.getByText("Rules").nextSibling).toHaveTextContent("2");
    expect(within(tree()).getByRole("button", { name: /Conforto/ })).toHaveTextContent("Expenses · 2 rules");
    expect(within(tree()).getByRole("button", { name: /Food/ })).toHaveTextContent("1 rule");
    expect(screen.getByRole("heading", { name: "Pick something to edit" })).toBeInTheDocument();
  });

  it("searches categories, subcategories and rule words", async () => {
    renderAt();
    await screen.findByRole("heading", { name: "Categorization" });

    await userEvent.type(screen.getByRole("searchbox", { name: "Search categories, subcategories or rules" }), "ube");
    expect(within(tree()).getByRole("button", { name: /Uber/ })).toBeInTheDocument();
    expect(within(tree()).queryByRole("button", { name: /Food/ })).not.toBeInTheDocument();
    expect(within(tree()).queryByRole("button", { name: /Lazer/ })).not.toBeInTheDocument();

    await userEvent.clear(screen.getByRole("searchbox"));
    await userEvent.type(screen.getByRole("searchbox"), "nothing");
    expect(screen.getByText('Nothing matches "nothing".')).toBeInTheDocument();
  });

  it("opens a subcategory with its rules and saves its changes, including a move", async () => {
    vi.mocked(subcategoriesApi.update).mockResolvedValue(food);
    renderAt();
    await screen.findByRole("navigation", { name: "Categories" });
    await userEvent.click(within(tree()).getByRole("button", { name: /Food/ }));

    expect(within(panel()).getByRole("heading", { name: "Food" })).toBeInTheDocument();
    expect(within(panel()).getByText("IFOOD")).toBeInTheDocument();
    expect(within(panel()).getByRole("link", { name: "See transactions →" })).toHaveAttribute("href", "/transactions?subcategory_id=10");
    expect(within(panel()).getByRole("button", { name: "Save changes" })).toBeDisabled();

    await userEvent.selectOptions(within(panel()).getByLabelText("Subcategory type"), "investment");
    await userEvent.selectOptions(within(panel()).getByLabelText("Belongs to"), "2");
    await userEvent.click(within(panel()).getByRole("button", { name: "Save changes" }));

    expect(subcategoriesApi.update).toHaveBeenCalledWith(10, { name: "Food", color_code: "#ff0000", subcategory_type: "investment", category_id: 2 });
    expect(await within(panel()).findByRole("status")).toHaveTextContent("Saved.");
    const lazerGroup = within(tree()).getByRole("button", { name: /Lazer/ }).closest("li")!;
    expect(within(lazerGroup).getByRole("button", { name: /Food/ })).toBeInTheDocument();
  });

  it("edits a category, adds a subcategory and opens it", async () => {
    vi.mocked(categoriesApi.update).mockResolvedValue({ ...conforto, name: "Casa" });
    vi.mocked(subcategoriesApi.create).mockResolvedValue(subcategory({ id: 12, name: "Gas", category: undefined }));
    renderAt("/categorization?c=1");

    const name = await within(await screen.findByRole("article")).findByLabelText("Category name");
    await userEvent.clear(name);
    await userEvent.type(name, "Casa");
    await userEvent.click(within(panel()).getByRole("button", { name: "Save changes" }));
    expect(categoriesApi.update).toHaveBeenCalledWith(1, { name: "Casa", color_code: "#000000" });
    expect(await within(tree()).findByRole("button", { name: /Casa/ })).toBeInTheDocument();

    await userEvent.type(within(panel()).getByLabelText("New subcategory"), "Gas");
    await userEvent.click(within(panel()).getByRole("button", { name: "Add subcategory" }));

    expect(subcategoriesApi.create).toHaveBeenCalledWith(expect.objectContaining({ name: "Gas", subcategory_type: "expense", category_id: 1 }));
    expect(await within(panel()).findByRole("heading", { name: "Gas" })).toBeInTheDocument();
  });

  it("creates a category", async () => {
    vi.mocked(categoriesApi.create).mockResolvedValue(category({ id: 3, name: "Viagem", subcategories: [] }));
    renderAt();
    await userEvent.click(await screen.findByRole("button", { name: "+ New category" }));

    expect(within(panel()).getByRole("heading", { name: "New category" })).toBeInTheDocument();
    await userEvent.type(within(panel()).getByLabelText("Category name"), "Viagem");
    await userEvent.click(within(panel()).getByRole("button", { name: "Create category" }));

    expect(categoriesApi.create).toHaveBeenCalledWith({ name: "Viagem", color_code: "#2563eb" });
    expect(await within(panel()).findByRole("heading", { name: "Viagem" })).toBeInTheDocument();
    expect(within(panel()).getByText("No subcategories yet. Add the first one below.")).toBeInTheDocument();
  });

  it("deletes a subcategory after asking, with its rules", async () => {
    vi.mocked(subcategoriesApi.remove).mockResolvedValue(undefined);
    renderAt("/categorization?s=10");
    await userEvent.click(await screen.findByRole("button", { name: "Delete subcategory" }));

    const dialog = screen.getByRole("dialog", { name: "Delete Food?" });
    expect(dialog).toHaveTextContent("Its 1 rule is deleted too. Its transactions move to Outros.");
    await userEvent.click(within(dialog).getByRole("button", { name: "Delete subcategory" }));

    expect(subcategoriesApi.remove).toHaveBeenCalledWith(10);
    expect(await within(panel()).findByRole("heading", { name: "Conforto" })).toBeInTheDocument();
    expect(within(tree()).queryByRole("button", { name: /Food/ })).not.toBeInTheDocument();
    expect(screen.getByText("Rules").nextSibling).toHaveTextContent("1");
  });

  it("keeps the dialog open with the API's reason when a delete is refused", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { ApiError } = await import("../api");
    vi.mocked(categoriesApi.remove).mockRejectedValue(new ApiError(422, { errors: ["Outros can't be deleted"] }));
    renderAt("/categorization?c=1");
    await userEvent.click(await screen.findByRole("button", { name: "Delete category" }));
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete category" }));

    expect(await within(screen.getByRole("dialog")).findByText("Outros can't be deleted")).toBeInTheDocument();
    expect(within(tree()).getByRole("button", { name: /Conforto/ })).toBeInTheDocument();
  });

  it("adds a rule to the open subcategory", async () => {
    vi.mocked(keywordsApi.create).mockResolvedValue(keyword({ id: 102, name: "RAPPI" }));
    renderAt("/categorization?s=10");
    await userEvent.click(await screen.findByRole("button", { name: "+ Add rule" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByLabelText("Subcategory")).toHaveValue("10");
    await userEvent.type(within(dialog).getByLabelText("Keyword"), "RAPPI");
    await userEvent.click(within(dialog).getByRole("button", { name: "Add rule" }));

    expect(keywordsApi.create).toHaveBeenCalledWith({ name: "RAPPI", subcategory_id: 10, min_amount: null, max_amount: null });
    expect(await within(panel()).findByText("RAPPI")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lists every rule with its health and filters the ones that need attention", async () => {
    vi.mocked(keywordsApi.health).mockResolvedValue([
      keywordHealth(),
      keywordHealth({ keyword_id: 101, matches: 4, overrides: 6, flags: ["overridden", "overlapping"], pending_suggestion_ids: [9] }),
    ]);
    renderAt("/categorization?tab=rules");

    await screen.findByText("Overlaps");
    expect(screen.getByTestId("health-101")).toHaveTextContent("4 matchesOverridden 6×Overlaps");
    expect(within(screen.getByTestId("health-101")).getByRole("link", { name: "Suggested fix →" })).toHaveAttribute("href", "/suggestions?tab=rules");
    expect(screen.getByText("IFOOD").closest("tr")).toHaveTextContent("Conforto › Food");

    await userEvent.click(screen.getByLabelText("Only rules that need attention (1)"));
    expect(screen.queryByText("IFOOD")).not.toBeInTheDocument();
    expect(screen.getByText("UBER")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Open Uber" }));
    expect(screen.getByRole("tab", { name: "Categories" })).toHaveAttribute("aria-selected", "true");
    expect(within(panel()).getByRole("heading", { name: "Uber" })).toBeInTheDocument();
  });

  it("jumps to the rules that need attention from the summary", async () => {
    vi.mocked(keywordsApi.health).mockResolvedValue([keywordHealth({ flags: ["unused"] })]);
    renderAt();

    await userEvent.click(await screen.findByRole("button", { name: "Need attention: 1" }));

    expect(screen.getByLabelText("Only rules that need attention (1)")).toBeChecked();
    expect(screen.queryByText("UBER")).not.toBeInTheDocument();
  });

  it("edits and deletes rules from the table", async () => {
    vi.mocked(keywordsApi.update).mockResolvedValue(keyword({ name: "IFOOD SP", min_amount: 1000 }));
    vi.mocked(keywordsApi.remove).mockResolvedValue(undefined);
    renderAt("/categorization?tab=rules");

    await userEvent.click(await screen.findByRole("button", { name: "Edit IFOOD" }));
    const dialog = screen.getByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Keyword"), " SP");
    await userEvent.type(within(dialog).getByLabelText("Minimum amount"), "1.000,00");
    await userEvent.click(within(dialog).getByRole("button", { name: "Save rule" }));
    expect(keywordsApi.update).toHaveBeenCalledWith(100, { name: "IFOOD SP", subcategory_id: 10, min_amount: 1000, max_amount: null });
    expect((await screen.findByText("IFOOD SP")).closest("tr")).toHaveTextContent(/from R\$\s?1\.000,00/);

    await userEvent.click(screen.getByRole("button", { name: "Delete UBER" }));
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }));
    expect(keywordsApi.remove).toHaveBeenCalledWith(101);
    expect(screen.queryByText("UBER")).not.toBeInTheDocument();
  });

  it("refuses an inverted amount range inside the dialog", async () => {
    renderAt("/categorization?tab=rules");
    await userEvent.click(await screen.findByRole("button", { name: "+ Add rule" }));

    const dialog = screen.getByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Keyword"), "AMAZON");
    await userEvent.selectOptions(within(dialog).getByLabelText("Subcategory"), "20");
    await userEvent.type(within(dialog).getByLabelText("Minimum amount"), "200");
    await userEvent.type(within(dialog).getByLabelText("Maximum amount"), "100");
    await userEvent.click(within(dialog).getByRole("button", { name: "Add rule" }));

    expect(within(dialog).getByText("The minimum amount can't be above the maximum.")).toBeInTheDocument();
    expect(keywordsApi.create).not.toHaveBeenCalled();
  });

  it("applies a color theme and shows the new colors everywhere", async () => {
    vi.mocked(categoriesApi.update).mockResolvedValue(conforto);
    vi.mocked(subcategoriesApi.update).mockResolvedValue(food);
    renderAt("/categorization?tab=colors");

    await userEvent.click(await screen.findByRole("radio", { name: /Ocean/ }));
    await userEvent.click(screen.getByRole("button", { name: "Apply Ocean" }));
    await userEvent.click(screen.getByRole("button", { name: "Apply theme" }));
    await screen.findByText("Ocean applied to every category and subcategory.");

    const plan = planTheme(COLOR_THEMES.find((theme) => theme.id === "ocean")!, [conforto, lazer]);
    await userEvent.click(screen.getByRole("tab", { name: "Categories" }));
    await userEvent.click(within(tree()).getByRole("button", { name: /Food/ }));
    expect(within(panel()).getByLabelText("Subcategory color")).toHaveValue(plan.subcategories.get(10));
  });

  it("shows a retryable error when loading fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(keywordsApi.list).mockRejectedValueOnce(new Error("Network down"));
    renderAt();

    expect(await screen.findByText("Unable to load your categories and rules.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "Categorization" })).toBeInTheDocument();
  });

  it("speaks Portuguese", async () => {
    render(
      inLocale(
        "pt-BR",
        <MemoryRouter initialEntries={["/categorization"]}>
          <Categorization />
        </MemoryRouter>
      )
    );

    expect(await screen.findByRole("heading", { name: "Categorização" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Todas as regras/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ Nova categoria" })).toBeInTheDocument();
  });
});
