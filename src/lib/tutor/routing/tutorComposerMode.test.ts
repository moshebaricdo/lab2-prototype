import { describe, expect, it } from "vitest";
import {
  composerModeAfterCardAction,
  composerModeForSend,
  DEFAULT_COMPOSER_REQUEST_MODE,
} from "./tutorComposerMode";

describe("tutorComposerMode", () => {
  it("resets to auto after card actions", () => {
    expect(composerModeAfterCardAction()).toBe("auto");
    expect(DEFAULT_COMPOSER_REQUEST_MODE).toBe("auto");
  });

  it("uses one-shot mode for curriculum composer sends", () => {
    expect(composerModeForSend("build")).toEqual({
      modeForRequest: "build",
      modeAfterSend: "auto",
    });
  });

  it("keeps dev model selector modes sticky when requested", () => {
    expect(composerModeForSend("build", { persistNonAutoMode: true })).toEqual({
      modeForRequest: "build",
      modeAfterSend: "build",
    });
  });

  it("leaves auto mode unchanged", () => {
    expect(composerModeForSend("auto")).toEqual({
      modeForRequest: "auto",
      modeAfterSend: "auto",
    });
  });
});
