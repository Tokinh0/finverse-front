import { describe, expect, it } from "vitest";
import { profile } from "../test/fixtures";
import { apiErrorText, avatarColor, initials } from "./profiles";

describe("profiles utils", () => {
  it("uses the profile's color, else a stable one from its id", () => {
    expect(avatarColor(profile({ color_code: "#123456" }))).toBe("#123456");
    expect(avatarColor(profile({ id: 3 }))).toBe(avatarColor(profile({ id: 3 })));
    expect(avatarColor(profile({ id: 3 }))).not.toBe(avatarColor(profile({ id: 4 })));
  });

  it("makes up to two initials", () => {
    expect(initials("blake")).toBe("B");
    expect(initials(" Alex  Rae Silva ")).toBe("AR");
  });

  it("joins the API's errors, else uses the fallback", () => {
    expect(apiErrorText({ errors: ["Wrong password"] }, "x")).toBe("Wrong password");
    expect(apiErrorText({ errors: [] }, "fallback")).toBe("fallback");
    expect(apiErrorText(undefined, "fallback")).toBe("fallback");
  });
});
