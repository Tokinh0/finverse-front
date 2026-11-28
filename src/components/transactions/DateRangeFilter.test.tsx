import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DateRangeFilter from "./DateRangeFilter";
import { inLocale } from "../../test/i18n";

const today = new Date(2026, 1, 14);
const months = ["2026-02", "2026-01"];

describe("DateRangeFilter", () => {
  it("offers presets and each month with data", async () => {
    const onChange = vi.fn();
    render(<DateRangeFilter range={{ from: "", to: "" }} months={months} onChange={onChange} today={today} />);

    const quick = screen.getByLabelText("Quick date range");
    expect(quick).toHaveValue("");
    expect(within(quick).getByRole("group", { name: "Months" })).toHaveTextContent("02/2026");

    await userEvent.selectOptions(quick, "Last 3 months");
    expect(onChange).toHaveBeenLastCalledWith({ from: "2025-12-01", to: "2026-02-28" });

    await userEvent.selectOptions(quick, "01/2026");
    expect(onChange).toHaveBeenLastCalledWith({ from: "2026-01-01", to: "2026-01-31" });
  });

  it("edits either end of the range, bounded by the data", () => {
    const onChange = vi.fn();
    render(
      <DateRangeFilter range={{ from: "2026-01-01", to: "2026-01-31" }} months={months} min="2024-05-02" max="2026-02-10" onChange={onChange} today={today} />
    );

    expect(screen.getByLabelText("Quick date range")).toHaveValue("lastMonth"); // presets win over the same month
    const from = screen.getByLabelText("From");
    expect(from).toHaveAttribute("min", "2024-05-02");
    expect(from).toHaveAttribute("max", "2026-01-31");
    expect(screen.getByLabelText("To")).toHaveAttribute("max", "2026-02-10");

    fireEvent.change(from, { target: { value: "2026-01-10" } });
    expect(onChange).toHaveBeenLastCalledWith({ from: "2026-01-10", to: "2026-01-31" });
  });

  it("shows a custom range as such", () => {
    render(<DateRangeFilter range={{ from: "2026-01-10", to: "" }} months={months} onChange={vi.fn()} today={today} />);

    expect(screen.getByLabelText("Quick date range")).toHaveValue("custom");
    expect(screen.getByRole("option", { name: "Custom range" })).toBeInTheDocument();
  });

  it("is shown in Portuguese", () => {
    render(inLocale("pt-BR", <DateRangeFilter range={{ from: "", to: "" }} months={months} onChange={vi.fn()} today={today} />));

    expect(screen.getByLabelText("Período rápido")).toHaveTextContent("Últimos 3 meses");
    expect(screen.getByLabelText("De")).toBeInTheDocument();
    expect(screen.getByLabelText("Até")).toBeInTheDocument();
  });
});
