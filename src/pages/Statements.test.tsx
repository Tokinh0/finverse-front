import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ApiError, statementsApi } from "../api";
import Statements from "./Statements";

vi.mock("../api", async () => (await import("../test/mockApi")).mockApiModule());

const statement = (id: number, first: string) => ({
  id,
  filename: `fatura-${id}.csv`,
  created_at: "2025-03-01",
  first_transaction_date: first,
  last_transaction_date: first,
  status: "processed",
});

describe("Statements", () => {
  beforeEach(() => {
    vi.mocked(statementsApi.list).mockResolvedValue([statement(2, "2025-02-01"), statement(1, "2025-01-01")]);
  });

  it("lists statements ordered by first transaction date", async () => {
    render(<Statements />);

    await screen.findByText("fatura-1.csv");
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows.map((r) => within(r).getAllByRole("cell")[0].textContent)).toEqual(["fatura-1.csv", "fatura-2.csv"]);
  });

  it("uploads a file and shows the import summary", async () => {
    vi.mocked(statementsApi.upload).mockResolvedValue({
      statement: statement(3, "2025-03-01"),
      summary_lines: [{ id: 1, status: "processed", content: '["01/03/2025","IFOOD"]', parsed_transaction: { parsed_name: "IFOOD", amount: 9.9 } }],
    });
    render(<Statements />);
    await screen.findByText("fatura-1.csv");

    const upload = screen.getByRole("button", { name: "Upload" });
    expect(upload).toBeDisabled();
    await userEvent.upload(screen.getByLabelText("Statement file"), new File(["x"], "march.csv", { type: "text/csv" }));
    await userEvent.click(upload);

    expect(statementsApi.upload).toHaveBeenCalledWith(expect.objectContaining({ name: "march.csv" }));
    expect(await screen.findByText("Upload Summary")).toBeInTheDocument();
    expect(screen.getByText("R$ 9.90")).toBeInTheDocument();
  });

  it("alerts when the upload fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.mocked(statementsApi.upload).mockRejectedValue(new Error("422"));
    render(<Statements />);
    await screen.findByText("fatura-1.csv");

    await userEvent.upload(screen.getByLabelText("Statement file"), new File(["x"], "bad.csv", { type: "text/csv" }));
    await userEvent.click(screen.getByRole("button", { name: "Upload" }));

    expect(alert).toHaveBeenCalledWith("Failed to upload file.");
  });

  it("deletes a statement after confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(statementsApi.remove).mockResolvedValue(undefined);
    render(<Statements />);
    await screen.findByText("fatura-1.csv");

    await userEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);

    expect(statementsApi.remove).toHaveBeenCalledWith(1);
    await screen.findByText("fatura-2.csv");
    expect(screen.queryByText("fatura-1.csv")).not.toBeInTheDocument();
  });

  it("explains why the API refused the upload", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const body = { file: ["This file was already imported (statement #2)"] };
    // The mocked ApiError ignores its arguments, so set the body explicitly.
    const error = Object.assign(new ApiError(422, body), { body });
    vi.mocked(statementsApi.upload).mockRejectedValue(error);
    render(<Statements />);
    await screen.findByText("fatura-1.csv");

    await userEvent.upload(screen.getByLabelText("Statement file"), new File(["x"], "again.csv", { type: "text/csv" }));
    await userEvent.click(screen.getByRole("button", { name: "Upload" }));

    expect(alert).toHaveBeenCalledWith("Failed to upload file: This file was already imported (statement #2)");
  });

  it("mentions the suggestions being generated after an upload", async () => {
    vi.mocked(statementsApi.upload).mockResolvedValue({
      statement: statement(3, "2025-03-01"),
      summary_lines: [],
      suggestion_run: { id: 1 } as never,
    });
    render(
      <MemoryRouter>
        <Statements />
      </MemoryRouter>
    );
    await screen.findByText("fatura-1.csv");

    await userEvent.upload(screen.getByLabelText("Statement file"), new File(["x"], "april.csv", { type: "text/csv" }));
    await userEvent.click(screen.getByRole("button", { name: "Upload" }));

    expect(await screen.findByTestId("suggesting-note")).toBeInTheDocument();
  });
});
