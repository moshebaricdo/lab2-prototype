import { describe, expect, it, vi } from "vitest";
import type { TutorPolicy } from "../../../types/tutor";
import { buildInstructionGuide } from "../instruction/instructionGuide";
import { createInitialInstructionGuideState } from "../instruction/instructionCoach";
import { resolveTutorTurn } from "./resolveTutorTurn";

vi.mock("../../../hooks/useTutorApiSettings", () => ({
  getTutorApiKey: () => "",
  getTutorCodeModel: () => "gpt-4.1",
}));

const basePolicy: TutorPolicy = {
  lab: "weblab2",
  supportContext: "curriculum-level",
  capabilities: {
    guidance: true,
    planning: false,
    workspaceEdits: true,
    validationReview: true,
    proposalReview: true,
  },
  pedagogy: {
    mode: "curriculum-socratic",
    revealPolicy: "hint-first",
  },
  routingProfile: "validation-checkpoint",
};

const polishGuideMarkdown = `
# Polish the Style
**Improve the links and buttons while keeping the page usable.**

**Try these prompts:**
* *Make the nav bar links feel interactive.*
* *Improve the main button hover style.*
`;

describe("resolveTutorTurn", () => {
  it("routes readiness before sticky build mode (log 15)", async () => {
    const turn = await resolveTutorTurn({
      message: "I'm done!",
      requestMode: "build",
      policy: basePolicy,
    });

    expect(turn.action).toMatchObject({
      kind: "validationReview",
      source: "review-offer",
    });
  });

  it("returns edit clarification for vague edit requests (log 13)", async () => {
    const turn = await resolveTutorTurn({
      message: "Let's refine the buttons",
      policy: basePolicy,
    });

    expect(turn.action).toMatchObject({
      kind: "editClarification",
      source: "message",
    });
  });

  it("upgrades a short focus pick to edit clarification (log 14)", async () => {
    const guide = buildInstructionGuide(polishGuideMarkdown);
    const guideState = createInitialInstructionGuideState(guide);

    const turn = await resolveTutorTurn({
      message: "nav links",
      policy: basePolicy,
      instruction: { guide, guideState },
    });

    expect(turn.action).toMatchObject({
      kind: "editClarification",
      source: "focus-pick",
    });
    expect(turn.instructionCoachResult?.guideState.activeOptionId).toBe("polish-nav-links");
    expect(turn.action.message).toContain("nav links");
  });

  it("does not upgrade readiness phrasing to a focus pick", async () => {
    const guide = buildInstructionGuide(polishGuideMarkdown);
    const guideState = createInitialInstructionGuideState(guide);

    const turn = await resolveTutorTurn({
      message: "I'm done",
      policy: basePolicy,
      instruction: { guide, guideState },
    });

    expect(turn.action.kind).toBe("validationReview");
  });
});
