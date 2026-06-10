import { describe, expect, it } from "vitest";
import { applyPlanRevisionOverride } from "./requestIntent";

describe("applyPlanRevisionOverride", () => {
  it("revises the plan when the student answers a planning question in a standalone project", () => {
    expect(applyPlanRevisionOverride("edit", "more playful and colorful", {
      supportContext: "standalone-project",
      hasActivePlan: true,
      lastAssistantAskedPlanningQuestion: true,
    })).toBe("planning");
  });

  it("allows build-from-plan requests through as edit", () => {
    expect(applyPlanRevisionOverride("edit", "I'm ready to build the project from this plan.", {
      supportContext: "standalone-project",
      hasActivePlan: true,
      lastAssistantAskedPlanningQuestion: true,
    })).toBe("edit");
  });

  it("does not override curriculum-level edit requests", () => {
    expect(applyPlanRevisionOverride("edit", "make the nav blue", {
      supportContext: "curriculum-level",
      hasActivePlan: true,
      lastAssistantAskedPlanningQuestion: true,
    })).toBe("edit");
  });
});
