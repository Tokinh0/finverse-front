import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ApiError, statementsApi } from "../../api";
import { MonthlyStatementPresenter, type RawMonthlyStatement } from "../../presenters/MonthlyStatementPresenter";
import StatementsPanel from "./StatementsPanel";

vi.mock("../../api", async () => (await import("../../test/mockApi")).mockApiModule());

const raw = (id: number, first: string, extra: Partial<RawMonthlyStatement> = {}): RawMonthlyStatement => ({
  id,
  filename: `fatura-${id}.csv`,
  created_at: "2025-03-01",
  first_transaction_date: first,
  last_transaction_date: first.replace(/-01$/, "-28"),
  status: "processed",
  transactions_count: id * 10,
  ...extra,
});

const statements = () => MonthlyStatementPresenter.parseMany([raw(1, "2025-01-01"), raw(2, "2025-02-01")]);

const renderPanel = (props: Partial<React.ComponentProps<typeof StatementsPanel>> = {}) => {
  const handlers = { onSelect: vi.fn(), onChanged: vi.fn() };
  render(
    <MemoryRouter>
      <StatementsPanel statements={statements()} selectedId={null} defaultOpen {...handlers} {...props} />
    </MemoryRouter>
  );
  return handlers;
};

const pick = (name: string) => userEvent.upload(screen.getByLabelText("Statement file"), new File(["x"], name, { type: "text/csv" }));

describe("StatementsPanel", () => {
  it("lists statements newest first, with their period and transaction count", () => {
    renderPanel();

    const rows = screen.getAllByRole("row").slice(1);
    expect(rows.map((r) => within(r).getAllByRole("cell")[0].textContent)).toEqual(["fatura-2.csv", "fatura-1.csv"]);
    expect(rows[0]).toHaveTextContent("02/01/2025 – 02/28/2025");
    expect(rows[0]).toHaveTextContent("20");
    expect(rows[0]).toHaveTextContent("processed");
  });

  it("is collapsed unless asked to open, and toggles", async () => {
    renderPanel({ defaultOpen: false });

    const toggle = screen.getByRole("button", { name: /Statements · 2 imported/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("shows one statement's transactions, and marks the one shown", async () => {
    const { onSelect } = renderPanel({ selectedId: "2" });

    expect(screen.getByText("Showing").closest("tr")).toHaveAttribute("aria-current", "true");
    await userEvent.click(screen.getByRole("button", { name: "Show the transactions of fatura-1.csv" }));

    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it("imports a file, shows the summary and reports the change", async () => {
    vi.mocked(statementsApi.upload).mockResolvedValue({
      statement: raw(3, "2025-03-01"),
      summary_lines: [{ id: 1, status: "processed", content: '["01/03/2025","IFOOD"]', parsed_transaction: { parsed_name: "IFOOD", amount: 9.9 } }],
      suggestion_run: { id: 1 } as never,
    });
    const { onChanged } = renderPanel();

    const importButton = screen.getByRole("button", { name: "Import" });
    expect(importButton).toBeDisabled();
    await pick("march.csv");
    await userEvent.click(importButton);

    expect(statementsApi.upload).toHaveBeenCalledWith(expect.objectContaining({ name: "march.csv" }));
    expect(await screen.findByText("Upload Summary")).toBeInTheDocument();
    expect(screen.getByTestId("suggesting-note")).toBeInTheDocument();
    expect(onChanged).toHaveBeenCalledWith({});
  });

  it("explains why the API refused the upload", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.mocked(statementsApi.upload).mockRejectedValue(new ApiError(422, { file: ["This file was already imported (statement #2)"] }));
    const { onChanged } = renderPanel();

    await pick("again.csv");
    await userEvent.click(screen.getByRole("button", { name: "Import" }));

    expect(alert).toHaveBeenCalledWith("Failed to upload file: This file was already imported (statement #2)");
    expect(onChanged).not.toHaveBeenCalled();
  });

  it("alerts when the upload fails for another reason", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.mocked(statementsApi.upload).mockRejectedValue(new Error("boom"));
    renderPanel();

    await pick("bad.csv");
    await userEvent.click(screen.getByRole("button", { name: "Import" }));

    expect(alert).toHaveBeenCalledWith("Failed to upload file.");
  });

  it("deletes a statement after confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(statementsApi.remove).mockResolvedValue(undefined);
    const { onChanged } = renderPanel();

    await userEvent.click(within(screen.getByText("fatura-1.csv").closest("tr")!).getByRole("button", { name: "Delete" }));

    expect(window.confirm).toHaveBeenCalledWith("Delete this statement and all its transactions?");
    expect(statementsApi.remove).toHaveBeenCalledWith(1);
    expect(onChanged).toHaveBeenCalledWith({ deletedId: 1 });
  });

  it("says when there are no statements, or they couldn't load", () => {
    const { unmount } = render(
      <StatementsPanel statements={[]} selectedId={null} defaultOpen onSelect={vi.fn()} onChanged={vi.fn()} />
    );
    expect(screen.getByText("No statements yet. Import your first one above.")).toBeInTheDocument();
    unmount();

    render(<StatementsPanel statements={null} loadError="Could not load the statements." selectedId={null} defaultOpen onSelect={vi.fn()} onChanged={vi.fn()} />);
    expect(screen.getByText("Could not load the statements.")).toBeInTheDocument();
  });
});
