import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { category, subcategory } from "../../test/fixtures";
import SubcategorySelect from "./SubcategorySelect";

describe("SubcategorySelect", () => {
  it("groups subcategories by category", async () => {
    const onChange = vi.fn();
    render(
      <SubcategorySelect
        label="Move to"
        value=""
        onChange={onChange}
        categories={[category({ subcategories: [subcategory({ id: 10, name: "Food" }), subcategory({ id: 11, name: "Bar" })] })]}
      />
    );

    const select = screen.getByLabelText("Move to");
    expect(within(select).getByRole("group", { name: "Conforto" })).toBeInTheDocument();
    await userEvent.selectOptions(select, "11");
    expect(onChange).toHaveBeenCalledWith("11");
  });

  it("offers to create a new subcategory instead of selecting one", async () => {
    const onChange = vi.fn();
    const onCreateNew = vi.fn();
    render(<SubcategorySelect label="Move to" value="10" onChange={onChange} onCreateNew={onCreateNew} categories={[category()]} />);

    await userEvent.selectOptions(screen.getByLabelText("Move to"), "+ New subcategory…");

    expect(onCreateNew).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
