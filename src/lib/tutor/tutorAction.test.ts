import { describe, expect, it } from "vitest";
import type { TutorPolicy } from "../../types/tutor";
import { resolveTutorAction } from "./tutorAction";

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

describe("resolveTutorAction", () => {
  it("routes ambiguous readiness messages to validation review in checkpoint levels", () => {
    expect(resolveTutorAction({
      message: "Can I continue?",
      policy: basePolicy,
    })).toMatchObject({
      kind: "validationReview",
      source: "review-offer",
    });
  });

  it("routes natural fixed-it updates directly to validation review offers", () => {
    expect(resolveTutorAction({
      message: "I got the Next button working.",
      policy: basePolicy,
    })).toMatchObject({
      kind: "validationReview",
      source: "review-offer",
    });

    expect(resolveTutorAction({
      message: "That seems to work now.",
      policy: basePolicy,
    })).toMatchObject({
      kind: "validationReview",
      source: "review-offer",
    });
  });

  it("does not let validation checkpoint routing override debugging help", () => {
    expect(resolveTutorAction({
      message: "Can you check why this button is broken?",
      policy: basePolicy,
    })).toMatchObject({
      kind: "guidance",
    });
  });

  it("keeps clear edit requests on the edit action when edits are allowed", () => {
    expect(resolveTutorAction({
      message: "Improve the nav link hover styles.",
      policy: basePolicy,
    })).toMatchObject({
      kind: "edit",
    });
  });

  it("returns a student-facing denied action when edits are disabled", () => {
    const policy: TutorPolicy = {
      ...basePolicy,
      capabilities: {
        ...basePolicy.capabilities,
        workspaceEdits: false,
      },
    };

    expect(resolveTutorAction({
      message: "Improve the nav link hover styles.",
      policy,
    })).toMatchObject({
      kind: "denied",
      requested: "edit",
      fallback: "guidance",
      disabledReason: "capability-disabled",
    });
  });

  it("returns a student-facing denied action when help is disabled", () => {
    const policy: TutorPolicy = {
      ...basePolicy,
      capabilities: {
        ...basePolicy.capabilities,
        guidance: false,
      },
    };

    expect(resolveTutorAction({
      message: "Can you explain what the instructions mean?",
      policy,
    })).toMatchObject({
      kind: "denied",
      requested: "guidance",
      fallback: "message",
      disabledReason: "capability-disabled",
    });
  });

  it("routes do-that follow-ups to edit after editable guidance", () => {
    expect(resolveTutorAction({
      message: "please do that",
      policy: basePolicy,
      workflow: {
        lastAssistantSuggestedEditableWork: true,
      },
    })).toMatchObject({
      kind: "edit",
    });
  });
});
