import { describe, expect, it } from "vitest";
import {
  allowsLockedProgressionNavigation,
  getLevelShareModeSearchParams,
} from "../hooks/useLevelShareMode";

describe("getLevelShareModeSearchParams", () => {
  it("parses locked level and locked progression modes", () => {
    expect(
      getLevelShareModeSearchParams(new URLSearchParams("share=locked-level")),
    ).toBe("locked-level");
    expect(
      getLevelShareModeSearchParams(
        new URLSearchParams("share=locked-progression"),
      ),
    ).toBe("locked-progression");
  });
});

describe("allowsLockedProgressionNavigation", () => {
  it("allows legacy locked and locked progression on progression routes", () => {
    expect(allowsLockedProgressionNavigation("locked", true)).toBe(true);
    expect(allowsLockedProgressionNavigation("locked-progression", true)).toBe(
      true,
    );
  });

  it("blocks locked level even on progression routes", () => {
    expect(allowsLockedProgressionNavigation("locked-level", true)).toBe(false);
  });
});
