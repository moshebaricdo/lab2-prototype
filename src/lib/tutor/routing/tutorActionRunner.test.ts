import { describe, expect, it } from "vitest";
import {
  runnerAllowsPlanEdits,
  runnerAllowsWorkspaceEdits,
  runnerIntentFromTutorAction,
} from "./tutorActionRunner";

describe("tutorActionRunner", () => {
  it("maps runner actions to intents", () => {
    expect(runnerIntentFromTutorAction({ kind: "guidance", source: "message", message: "hi" })).toBe("guidance");
    expect(runnerIntentFromTutorAction({ kind: "plan", source: "ui", message: "plan" })).toBe("planning");
    expect(runnerIntentFromTutorAction({ kind: "edit", source: "message", message: "edit" })).toBe("edit");
    expect(runnerIntentFromTutorAction({
      kind: "editClarification",
      source: "focus-pick",
      message: "Improve nav links.",
    })).toBeNull();
  });

  it("derives edit permissions from action kind", () => {
    expect(runnerAllowsWorkspaceEdits({ kind: "edit", source: "message", message: "x" })).toBe(true);
    expect(runnerAllowsWorkspaceEdits({ kind: "guidance", source: "message", message: "x" })).toBe(false);
    expect(runnerAllowsPlanEdits({ kind: "plan", source: "message", message: "x" })).toBe(true);
  });
});
