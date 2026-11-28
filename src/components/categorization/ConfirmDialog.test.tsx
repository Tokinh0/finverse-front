import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ConfirmDialog from "./ConfirmDialog";

const renderDialog = (onConfirm: () => Promise<void>) => {
  const onHide = vi.fn();
  render(<ConfirmDialog title="Delete Food?" body="This can't be undone." confirmLabel="Delete" onConfirm={onConfirm} onHide={onHide} />);
  return onHide;
};

describe("ConfirmDialog", () => {
  it("asks, then runs the action", async () => {
    const onConfirm = vi.fn(async () => {});
    renderDialog(onConfirm);

    expect(screen.getByRole("dialog", { name: "Delete Food?" })).toHaveTextContent("This can't be undone.");
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("shows why it failed and stays open", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderDialog(async () => {
      throw new Error("boom");
    });

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(await screen.findByText("Could not delete. Try again.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();
  });

  it("can be cancelled", async () => {
    const onHide = renderDialog(vi.fn());
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onHide).toHaveBeenCalled();
  });
});
