import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SummaryLinePresenter } from "../presenters/SummaryLinePresenter";
import UploadSummaryModal from "./UploadSummaryModal";

describe("UploadSummaryModal", () => {
  it("splits processed and skipped lines", () => {
    const lines = SummaryLinePresenter.parseMany([
      { id: 1, status: "processed", content: '["05/01/2025","IFOOD"]', parsed_transaction: { parsed_name: "IFOOD", amount: 60.28, subcategory_name: "Food" } },
      { id: 2, status: "skipped", error: "malformed_row", content: '["Total","x","y","z"]' },
    ]);

    render(<UploadSummaryModal show onHide={vi.fn()} lines={lines} />);

    const [processed, skipped] = screen.getAllByRole("table");
    expect(within(processed).getByText("R$ 60.28")).toBeInTheDocument();
    expect(within(processed).getByText("Food")).toBeInTheDocument();
    expect(within(skipped).getByText("malformed_row")).toBeInTheDocument();
    expect(within(skipped).getByText("y / z")).toBeInTheDocument();
  });
});
