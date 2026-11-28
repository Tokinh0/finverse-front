import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { profile } from "../../test/fixtures";
import ProfileAvatar from "./ProfileAvatar";

describe("ProfileAvatar", () => {
  it("shows the initials on the profile's color, hidden from screen readers", () => {
    const { container } = render(<ProfileAvatar profile={profile({ name: "Blake", color_code: "#112233" })} size={40} />);
    const avatar = container.querySelector(".profile-avatar")!;

    expect(avatar).toHaveTextContent("B");
    expect(avatar).toHaveAttribute("aria-hidden", "true");
    expect(avatar).toHaveStyle({ background: "#112233", width: "40px" });
  });
});
