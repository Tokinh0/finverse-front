import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { categoriesApi, subcategoriesApi } from "../../api";
import { category, subcategory } from "../../test/fixtures";
import { inLocale } from "../../test/i18n";
import { COLOR_THEMES, planTheme, withPlanColors } from "../../utils/colorThemes";
import ColorThemePicker from "./ColorThemePicker";

vi.mock("../../api", async () => (await import("../../test/mockApi")).mockApiModule());

const categories = [
  category({ id: 1, name: "GANHOS", subcategories: [subcategory({ id: 10, name: "SALARIO", subcategory_type: "gain", category: undefined })] }),
  category({
    id: 2,
    name: "LAZER",
    subcategories: [
      subcategory({ id: 20, name: "CINEMA", category: undefined }),
      subcategory({ id: 21, name: "BAR", subcategory_type: "", category: undefined }),
    ],
  }),
];
const pastel = COLOR_THEMES.find((theme) => theme.id === "pastel")!;

describe("ColorThemePicker", () => {
  it("shows every theme and a preview of the categories in the selected one", async () => {
    render(<ColorThemePicker categories={categories} onApplied={() => {}} />);

    expect(screen.getAllByRole("radio").map((r) => r.querySelector("strong")?.textContent)).toEqual(["Vivid", "Pastel", "Ocean", "Earth"]);
    expect(screen.getByText("Your colors don't match any theme (picked by hand).")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("radio", { name: /Pastel/ }));
    expect(screen.getByRole("radio", { name: /Pastel/ })).toHaveAttribute("aria-checked", "true");
    const preview = screen.getByRole("region", { name: "Preview: Pastel" });
    expect(within(preview).getByText("GANHOS").nextSibling).toHaveTextContent("Gains");
    expect(within(preview).getByText("LAZER").nextSibling).toHaveTextContent("Expenses");
    expect(within(preview).getByText("BAR")).toBeInTheDocument();
  });

  it("asks before replacing colors, then saves only the ones that change", async () => {
    vi.mocked(categoriesApi.update).mockResolvedValue(categories[0]);
    vi.mocked(subcategoriesApi.update).mockResolvedValue(categories[0].subcategories[0]);
    const onApplied = vi.fn();
    render(<ColorThemePicker categories={categories} onApplied={onApplied} />);

    await userEvent.click(screen.getByRole("radio", { name: /Pastel/ }));
    await userEvent.click(screen.getByRole("button", { name: "Apply Pastel" }));
    expect(screen.getByText(/This changes the color of 5 items/)).toBeInTheDocument();
    expect(categoriesApi.update).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Apply theme" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Pastel applied to every category and subcategory.");
    const plan = planTheme(pastel, categories);
    expect(categoriesApi.update).toHaveBeenCalledWith(1, { name: "GANHOS", color_code: plan.categories.get(1) });
    expect(subcategoriesApi.update).toHaveBeenCalledWith(21, {
      name: "BAR",
      color_code: plan.subcategories.get(21),
      subcategory_type: "",
      category_id: 2,
    });
    expect(categoriesApi.update).toHaveBeenCalledTimes(2);
    expect(subcategoriesApi.update).toHaveBeenCalledTimes(3);
    expect(onApplied).toHaveBeenCalledWith(withPlanColors(plan, categories));
  });

  it("can cancel", async () => {
    render(<ColorThemePicker categories={categories} onApplied={() => {}} />);

    await userEvent.click(screen.getByRole("button", { name: "Apply Vivid" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("button", { name: "Apply Vivid" })).toBeInTheDocument();
    expect(categoriesApi.update).not.toHaveBeenCalled();
  });

  it("reports colors that could not be saved and keeps only the saved ones", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(categoriesApi.update).mockRejectedValue(new Error("boom"));
    vi.mocked(subcategoriesApi.update).mockResolvedValue(categories[0].subcategories[0]);
    const onApplied = vi.fn();
    render(<ColorThemePicker categories={categories} onApplied={onApplied} />);

    await userEvent.click(screen.getByRole("button", { name: "Apply Vivid" }));
    await userEvent.click(screen.getByRole("button", { name: "Apply theme" }));

    expect(await screen.findByRole("status")).toHaveTextContent("2 colors could not be saved");
    const [updated] = onApplied.mock.calls[0];
    expect(updated[0].color_code).toBe(categories[0].color_code); // the category failed
    expect(updated[0].subcategories[0].color_code).not.toBe(categories[0].subcategories[0].color_code);
  });

  it("marks the theme in use and has nothing to apply for it", () => {
    const themed = withPlanColors(planTheme(pastel, categories), categories);
    render(<ColorThemePicker categories={themed} onApplied={() => {}} />);

    expect(screen.getByText("Your colors use the Pastel theme.")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Pastel/ })).toHaveAttribute("aria-checked", "true");
    expect(within(screen.getByRole("radio", { name: /Pastel/ })).getByText("Current")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Already applied" })).toBeDisabled();
  });

  it("speaks Portuguese", () => {
    render(inLocale("pt-BR", <ColorThemePicker categories={categories} onApplied={() => {}} />));
    expect(screen.getByRole("radio", { name: /Vibrante/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aplicar Vibrante" })).toBeInTheDocument();
  });
});
