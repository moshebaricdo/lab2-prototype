import { describe, expect, it, vi } from "vitest";
import type { TutorPolicy } from "../../../types/tutor";
import { resolveTutorAction } from "./tutorAction";

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

const validationReviewYes = {
  requestValidationReviewIntent: vi.fn(async () => ({
    shouldRunReview: true,
    confidence: "high" as const,
  })),
};

const intentEdit = {
  requestIntentClassification: vi.fn(async () => ({
    intent: "edit" as const,
    confidence: "high" as const,
  })),
};

const intentGuidance = {
  requestIntentClassification: vi.fn(async () => ({
    intent: "guidance" as const,
    confidence: "high" as const,
  })),
};

const editClarifyYes = {
  requestEditClarificationNeed: vi.fn(async () => ({
    shouldClarify: true,
    confidence: "high" as const,
  })),
};

describe("resolveTutorAction", () => {
  it("routes ambiguous readiness messages to validation review in checkpoint levels", async () => {
    expect(await resolveTutorAction({
      message: "Can I continue?",
      policy: basePolicy,
      validationReviewIntentProvider: validationReviewYes,
    })).toMatchObject({
      kind: "validationReview",
      source: "review-offer",
    });
  });

  it("routes readiness messages to validation review whenever review is enabled", async () => {
    const guidedPolicy: TutorPolicy = {
      ...basePolicy,
      routingProfile: "guided-level",
    };

    expect(await resolveTutorAction({
      message: "I'm done",
      policy: guidedPolicy,
      validationReviewIntentProvider: validationReviewYes,
    })).toMatchObject({
      kind: "validationReview",
      source: "review-offer",
    });
  });

  it("routes readiness messages to validation review even when composer is stuck in build mode", async () => {
    expect(await resolveTutorAction({
      message: "I'm done!",
      requestMode: "build",
      policy: basePolicy,
      validationReviewIntentProvider: validationReviewYes,
    })).toMatchObject({
      kind: "validationReview",
      source: "review-offer",
    });
  });

  it("routes natural fixed-it updates directly to validation review offers", async () => {
    expect(await resolveTutorAction({
      message: "I got the Next button working.",
      policy: basePolicy,
      validationReviewIntentProvider: validationReviewYes,
    })).toMatchObject({
      kind: "validationReview",
      source: "review-offer",
    });

    expect(await resolveTutorAction({
      message: "That seems to work now.",
      policy: basePolicy,
      validationReviewIntentProvider: validationReviewYes,
    })).toMatchObject({
      kind: "validationReview",
      source: "review-offer",
    });
  });

  it("does not let validation checkpoint routing override debugging help", async () => {
    expect(await resolveTutorAction({
      message: "Can you check why this button is broken?",
      policy: basePolicy,
    })).toMatchObject({
      kind: "guidance",
    });
  });

  it("keeps clear edit requests on the edit action when edits are allowed", async () => {
    expect(await resolveTutorAction({
      message: "Improve the nav link hover styles.",
      policy: basePolicy,
      intentProvider: intentEdit,
    })).toMatchObject({
      kind: "edit",
    });
  });

  it("returns edit clarification when the model gate says to clarify", async () => {
    expect(await resolveTutorAction({
      message: "make all of the buttons more exciting",
      policy: basePolicy,
      intentProvider: intentEdit,
      editClarificationProvider: editClarifyYes,
    })).toMatchObject({
      kind: "editClarification",
      message: "make all of the buttons more exciting",
    });

    expect(await resolveTutorAction({
      message: "Let's refine the buttons",
      policy: basePolicy,
      intentProvider: intentEdit,
      editClarificationProvider: editClarifyYes,
    })).toMatchObject({
      kind: "editClarification",
      message: "Let's refine the buttons",
    });
  });

  it("fail-closes to guidance without a key when providers are not injected", async () => {
    expect(await resolveTutorAction({
      message: "make all of the buttons more exciting",
      policy: basePolicy,
    })).toMatchObject({
      kind: "guidance",
    });
  });

  it("returns edit clarification for broad build-mode requests when the model gate says to clarify", async () => {
    expect(await resolveTutorAction({
      message: "make the buttons better",
      requestMode: "build",
      policy: basePolicy,
      editClarificationProvider: editClarifyYes,
    })).toMatchObject({
      kind: "editClarification",
    });
  });

  it("skips edit clarification when the workflow already resolved a direction", async () => {
    expect(await resolveTutorAction({
      message: "make the buttons more exciting. Use this direction: update the buttons with bolder color.",
      requestMode: "build",
      policy: basePolicy,
      workflow: {
        skipEditClarification: true,
      },
    })).toMatchObject({
      kind: "edit",
    });
  });

  it("does not clarify concrete build-from-plan requests", async () => {
    expect(await resolveTutorAction({
      message: "Build the project described in Plans/PROJECT_PLAN.md. Update the plan status and check off the completed items as part of the proposal.",
      requestMode: "build",
      policy: basePolicy,
    })).toMatchObject({
      kind: "edit",
    });
  });

  it("returns a student-facing denied action when edits are disabled", async () => {
    const policy: TutorPolicy = {
      ...basePolicy,
      capabilities: {
        ...basePolicy.capabilities,
        workspaceEdits: false,
      },
    };

    expect(await resolveTutorAction({
      message: "Improve the nav link hover styles.",
      policy,
      intentProvider: intentEdit,
    })).toMatchObject({
      kind: "denied",
      requested: "edit",
      fallback: "guidance",
      disabledReason: "capability-disabled",
    });
  });

  it("returns a student-facing denied action when help is disabled", async () => {
    const policy: TutorPolicy = {
      ...basePolicy,
      capabilities: {
        ...basePolicy.capabilities,
        guidance: false,
      },
    };

    expect(await resolveTutorAction({
      message: "Can you explain what the instructions mean?",
      policy,
    })).toMatchObject({
      kind: "denied",
      requested: "guidance",
      fallback: "message",
      disabledReason: "capability-disabled",
    });
  });

  it("routes do-that follow-ups to edit after editable guidance", async () => {
    expect(await resolveTutorAction({
      message: "please do that",
      policy: basePolicy,
      workflow: {
        lastAssistantSuggestedEditableWork: true,
      },
    })).toMatchObject({
      kind: "edit",
    });
  });

  it("defers an ambiguous indirect edit request to the injected model classifier", async () => {
    const intentProvider = {
      requestIntentClassification: vi.fn(async () => ({ intent: "edit" as const })),
    };

    const action = await resolveTutorAction({
      message: "the hero heading feels kind of plain honestly",
      policy: { ...basePolicy, supportContext: "standalone-project" },
      workflow: { skipEditClarification: true },
      intentProvider,
    });

    expect(intentProvider.requestIntentClassification).toHaveBeenCalledOnce();
    expect(action).toMatchObject({ kind: "edit" });
  });

  it("triggers a validation review when the student affirms a review Tutor just offered", async () => {
    expect(await resolveTutorAction({
      message: "yes",
      policy: basePolicy,
      workflow: { lastAssistantOfferedReview: true },
    })).toMatchObject({
      kind: "validationReview",
      source: "review-offer",
    });

    expect(await resolveTutorAction({
      message: "sure, go ahead",
      policy: basePolicy,
      workflow: { lastAssistantOfferedReview: true },
    })).toMatchObject({
      kind: "validationReview",
      source: "review-offer",
    });
  });

  it("routes chat-log echo phrases through the validation intent classifier when keyed", async () => {
    expect(await resolveTutorAction({
      message: "ready to request a review",
      policy: basePolicy,
      workflow: { lastAssistantOfferedReview: true },
      validationReviewIntentProvider: validationReviewYes,
    })).toMatchObject({
      kind: "validationReview",
      source: "review-offer",
    });
  });

  it("does not treat a bare affirmation as a review when no review was offered", async () => {
    const action = await resolveTutorAction({
      message: "yes",
      policy: basePolicy,
      workflow: { lastAssistantOfferedReview: false },
      intentProvider: intentGuidance,
    });
    expect(action.kind).not.toBe("validationReview");
  });

  it("routes imperative edit requests through the injected intent classifier", async () => {
    const intentProvider = {
      requestIntentClassification: vi.fn(async () => ({
        intent: "edit" as const,
        confidence: "high" as const,
      })),
    };

    const action = await resolveTutorAction({
      message: "add a footer with my name and the year",
      policy: { ...basePolicy, supportContext: "standalone-project" },
      intentProvider,
    });

    expect(intentProvider.requestIntentClassification).toHaveBeenCalledOnce();
    expect(action).toMatchObject({ kind: "edit" });
  });
});
