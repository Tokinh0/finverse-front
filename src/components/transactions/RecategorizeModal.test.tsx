import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError, transactionsApi } from "../../api";
import { category, subcategory, transaction } from "../../test/fixtures";
import RecategorizeModal from "./RecategorizeModal";

vi.mock("../../api", async () => {
  const mock = (await import("../../test/mockApi")).mockApiModule();
  class ApiError extends Error {
    status: number;
    body: unknown;
    constructor(status: number, body: unknown) {
      super("api");
      this.status = status;
      this.body = body;
    }
  }
  return { ...mock, ApiError };
});

const categories = [
  category({ id: 9, name: "Outros", subcategories: [subcategory({ id: 99, name: "Outros" })] }),
  category({ id: 1, name: "Conforto", subcategories: [subcategory({ id: 10, name: "Food" })] }),
];

const renderModal = (onSaved = vi.fn()) =>
  render(<RecategorizeModal transaction={transaction()} categories={categories} showTotals onHide={vi.fn()} onSaved={onSaved} />);

describe("RecategorizeModal", () => {
  it("moves the transaction to another subcategory", async () => {
    const result = { transaction: transaction(), keyword: null, updated_count: 0 };
    vi.mocked(transactionsApi.recategorize).mockResolvedValue(result);
    const onSaved = vi.fn();
    renderModal(onSaved);

    expect(screen.getByText(/now in Outros \/ Outros/)).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText("Subcategory"), "10");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(transactionsApi.recategorize).toHaveBeenCalledWith(1000, { subcategory_id: 10, transaction_type: "debit" });
    expect(onSaved).toHaveBeenCalledWith(result);
  });

  it("creates a keyword and applies it to matching transactions", async () => {
    vi.mocked(transactionsApi.recategorize).mockResolvedValue({ transaction: transaction(), keyword: null, updated_count: 3 });
    renderModal();

    await userEvent.selectOptions(screen.getByLabelText("Subcategory"), "10");
    await userEvent.click(screen.getByLabelText(/Create a keyword/));
    const keyword = screen.getByLabelText(/Keyword/);
    expect(keyword).toHaveValue("LANCHONETE EXEMPLO");
    await userEvent.clear(keyword);
    await userEvent.type(keyword, "IFD");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(transactionsApi.recategorize).toHaveBeenCalledWith(1000, {
      subcategory_id: 10,
      transaction_type: "debit",
      keyword: "IFD",
      apply_to_matching: true,
    });
  });

  it("shows the API errors", async () => {
    vi.mocked(transactionsApi.recategorize).mockRejectedValue(new ApiError(422, { errors: ["Subcategory must exist"] }));
    renderModal();

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Subcategory must exist")).toBeInTheDocument();
  });

  it("sends the owner's reason so future suggestions can use it", async () => {
    vi.mocked(transactionsApi.recategorize).mockResolvedValue({ transaction: transaction(), keyword: null, updated_count: 0 });
    renderModal();

    await userEvent.selectOptions(screen.getByLabelText("Subcategory"), "10");
    await userEvent.type(screen.getByLabelText("Why? (optional)"), "  Snack bar near the office ");
    expect(screen.getByLabelText("Why? (optional)")).toHaveAttribute("maxlength", "300");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(transactionsApi.recategorize).toHaveBeenCalledWith(1000, {
      subcategory_id: 10,
      transaction_type: "debit",
      reason: "Snack bar near the office",
    });
  });

  it("pre-selects a suggested subcategory", () => {
    render(
      <RecategorizeModal transaction={transaction()} initialSubcategoryId={10} categories={categories} showTotals onHide={vi.fn()} onSaved={vi.fn()} />
    );

    expect(screen.getByLabelText("Subcategory")).toHaveValue("10");
  });
});

