import InsightsOutlined from "@mui/icons-material/InsightsOutlined";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import InfoTip from "./InfoTip";
import SectionTitle from "./SectionTitle";

describe("InfoTip and SectionTitle", () => {
  it("explains on hover and keyboard focus", async () => {
    render(<InfoTip label="confidence">How sure it is.</InfoTip>);

    await userEvent.tab();
    expect(screen.getByRole("button", { name: "About confidence" })).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("How sure it is.");
  });

  it("renders a titled section heading with an icon and help", () => {
    render(<SectionTitle icon={<InsightsOutlined />} title="Progress" help="What it means" guide="progress" />);

    const heading = screen.getByRole("heading", { name: /Progress/ });
    expect(heading).toHaveAttribute("data-guide", "progress");
    expect(screen.getByRole("button", { name: "About Progress" })).toBeInTheDocument();
  });
});
