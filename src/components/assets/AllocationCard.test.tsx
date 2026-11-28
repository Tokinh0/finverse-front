import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AllocationCard from "./AllocationCard";

const allocation = [
  { type: "criptomoedas", value: 3000, share: 0.75, count: 2 },
  { type: "reserva", value: 1000, share: 0.25, count: 1 },
];
const colors = new Map([
  ["criptomoedas", "#257de0"],
  ["reserva", "#f47230"],
]);

const renderCard = (props: Partial<Parameters<typeof AllocationCard>[0]> = {}) => {
  const onSelect = vi.fn();
  const { container } = render(
    <AllocationCard allocation={allocation} colors={colors} typeLabel={(t) => t.toUpperCase()} showTotals selected={null} onSelect={onSelect} {...props} />
  );
  return { onSelect, container };
};

describe("AllocationCard", () => {
  it("lists every type with its share, value and count, in one 100% bar", () => {
    const { container } = renderCard();

    expect(screen.getByRole("img", { name: "Allocation by asset type" })).toBeInTheDocument();
    expect(container.querySelectorAll(".pf-bar-segment")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /CRIPTOMOEDAS/ })).toHaveTextContent(/CRIPTOMOEDAS2 holdings75\.0%R\$\s?3\.000,00/);
  });

  it("describes the hovered type and hides amounts when asked", async () => {
    renderCard({ showTotals: false });

    expect(screen.getByText("Point at a type to see its share and value.")).toBeInTheDocument();
    await userEvent.hover(screen.getByRole("button", { name: /RESERVA/ }));
    expect(screen.getByText("R$ ••• · 1 holding")).toBeInTheDocument();
  });

  it("selects a type, and clears it when picked again", async () => {
    const { onSelect } = renderCard();
    await userEvent.click(screen.getByRole("button", { name: /RESERVA/ }));
    expect(onSelect).toHaveBeenCalledWith("reserva");

  });

  it("clears the selected type when it is picked again", async () => {
    const { onSelect } = renderCard({ selected: "reserva" });
    await userEvent.click(screen.getByRole("button", { name: /RESERVA/, pressed: true }));
    expect(onSelect).toHaveBeenCalledWith(null);
  });
});
