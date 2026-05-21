import { describe, expect, it } from "vitest";
import {
  buildRunnerSystemPromptAddendum,
  getTutorRunnerContract,
  getTutorRunnerStyleContract,
} from "./runnerContracts";

describe("Tutor runner contracts", () => {
  it("selects only the contract for the resolved runner intent", () => {
    const contracts = {
      help: "Help with hints first.",
      plan: "Ask planning questions before writing the plan.",
      build: "Return runnable HTML, CSS, and JS changes.",
    };

    expect(getTutorRunnerContract("guidance", contracts)).toBe("Help with hints first.");
    expect(getTutorRunnerContract("planning", contracts)).toBe(
      "Ask planning questions before writing the plan.",
    );
    expect(getTutorRunnerContract("edit", contracts)).toBe(
      "Return runnable HTML, CSS, and JS changes.",
    );
  });

  it("provides built-in response style contracts per runner intent", () => {
    expect(getTutorRunnerStyleContract("guidance")).toContain("Answer the student's immediate question");
    expect(getTutorRunnerStyleContract("planning")).toContain("quick project-coach handoff");
    expect(getTutorRunnerStyleContract("edit")).toContain("quick edit handoff");
  });

  it("appends the selected contract after any legacy base addendum", () => {
    const addendum = buildRunnerSystemPromptAddendum({
      basePrompt: "Preserve existing classroom vocabulary.",
      intent: "guidance",
      contracts: {
        help: "Give one small next step.",
        build: "Do not leak into help.",
      },
    });

    expect(addendum).toContain("Preserve existing classroom vocabulary.");
    expect(addendum).toContain("Help response style:");
    expect(addendum).toContain("Give one small next step.");
    expect(addendum).not.toContain("Do not leak into help.");
  });
});
