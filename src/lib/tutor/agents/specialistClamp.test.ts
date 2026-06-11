import { describe, expect, it } from "vitest";
import {
  clampSpecialistChanges,
  formatBlockedScopeNote,
} from "./specialistRun";
import { designerSpecialist } from "../../../data/agentic/specialists";
import type { TutorValidatedChange } from "../types";

const change = (fileName: string): TutorValidatedChange => ({
  fileName,
  status: "modified",
  content: "x",
});

describe("write-scope clamp (spec V4, item 4)", () => {
  it("allows writes inside scope and blocks the rest", () => {
    // Style agent may only write styles.css.
    const { allowed, blocked } = clampSpecialistChanges(
      [change("styles.css"), change("script.js")],
      designerSpecialist,
    );
    expect(allowed.map((c) => c.fileName)).toEqual(["styles.css"]);
    expect(blocked.map((c) => c.fileName)).toEqual(["script.js"]);
  });

  it("matches paths carrying the project root or bare basename", () => {
    const { allowed } = clampSpecialistChanges(
      [change("My Portfolio/styles.css")],
      designerSpecialist,
    );
    expect(allowed.map((c) => c.fileName)).toEqual(["My Portfolio/styles.css"]);
  });

  it("formats a student-facing note naming blocked files", () => {
    expect(formatBlockedScopeNote([])).toBe("");
    const note = formatBlockedScopeNote([change("script.js")]);
    expect(note).toContain("`script.js`");
    expect(note).toContain("is outside this agent's write scope");
    const plural = formatBlockedScopeNote([change("script.js"), change("data.json")]);
    expect(plural).toContain("are outside this agent's write scope");
  });
});
