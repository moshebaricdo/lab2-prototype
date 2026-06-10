import { afterEach, describe, expect, it, vi } from "vitest";

import {
  classifyEditClarificationNeedWithModel,
  failOpenEditClarificationNeed,
  hasHardSkipEditClarification,
  resolveEditClarificationNeed,
} from "./editClarificationClassifier";
import { EDIT_CLARIFICATION_FIXTURES } from "./editClarificationFixtures";
import type { TutorEditClarificationNeedProvider } from "../provider/openAiProvider";
import type { TutorEditClarificationNeedResponse } from "../types";

vi.mock("../../../hooks/useTutorApiSettings", () => ({
  getTutorApiKey: () => "",
  getTutorCodeModel: () => "gpt-4.1",
}));

function mockProvider(
  response: TutorEditClarificationNeedResponse | null,
): TutorEditClarificationNeedProvider {
  return {
    requestEditClarificationNeed: vi.fn(async () => response),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("hasHardSkipEditClarification", () => {
  it("skips when the workflow already resolved a direction", () => {
    expect(hasHardSkipEditClarification("make the buttons better", {
      skipEditClarification: true,
    })).toBe(true);
  });

  it("does not skip concrete CSS directives — the model decides those", () => {
    expect(hasHardSkipEditClarification("make all buttons blue", {})).toBe(false);
  });
});

describe("classifyEditClarificationNeedWithModel", () => {
  it("fail-opens when the real provider has no API key", async () => {
    const result = await classifyEditClarificationNeedWithModel({
      message: "make the buttons better",
    });

    expect(result).toEqual(failOpenEditClarificationNeed());
  });

  it("uses the model verdict when shouldClarify is high confidence", async () => {
    const provider = mockProvider({
      shouldClarify: true,
      confidence: "high",
      reason: "open-ended feature add",
    });

    const result = await classifyEditClarificationNeedWithModel({
      message: "I want to add a navbar",
      context: { supportContext: "curriculum-level" },
      provider,
    });

    expect(result.source).toBe("model");
    expect(result.shouldClarify).toBe(true);
    expect(provider.requestEditClarificationNeed).toHaveBeenCalledOnce();
  });

  it("fail-opens to direct edit when the model is low confidence", async () => {
    const provider = mockProvider({
      shouldClarify: true,
      confidence: "low",
    });

    const result = await classifyEditClarificationNeedWithModel({
      message: "add a footer with my name",
      provider,
    });

    expect(result.source).toBe("model");
    expect(result.shouldClarify).toBe(false);
  });

  it("respects a high-confidence model skip", async () => {
    const provider = mockProvider({
      shouldClarify: false,
      confidence: "high",
    });

    const result = await classifyEditClarificationNeedWithModel({
      message: "make all buttons blue",
      provider,
    });

    expect(result.source).toBe("model");
    expect(result.shouldClarify).toBe(false);
  });

  it("fail-opens when the provider throws", async () => {
    const provider: TutorEditClarificationNeedProvider = {
      requestEditClarificationNeed: vi.fn(async () => {
        throw new Error("network down");
      }),
    };

    const result = await classifyEditClarificationNeedWithModel({
      message: "make the buttons better",
      provider,
    });

    expect(result).toEqual(failOpenEditClarificationNeed());
  });
});

describe("edit clarification fixtures (model path plumbing)", () => {
  for (const fixture of EDIT_CLARIFICATION_FIXTURES) {
    it(`routes "${fixture.message}" via the model verdict`, async () => {
      const provider = mockProvider({
        shouldClarify: fixture.expectedShouldClarify,
        confidence: "high",
      });

      const result = await classifyEditClarificationNeedWithModel({
        message: fixture.message,
        context: fixture.context,
        provider,
      });

      expect(result.shouldClarify).toBe(fixture.expectedShouldClarify);
    });
  }

  it("fail-opens without a key for every fixture", async () => {
    for (const fixture of EDIT_CLARIFICATION_FIXTURES) {
      const result = await classifyEditClarificationNeedWithModel({
        message: fixture.message,
        context: fixture.context,
      });
      expect(result).toEqual(failOpenEditClarificationNeed());
    }
  });
});

describe("resolveEditClarificationNeed", () => {
  it("hard-skips build-from-plan requests before calling the model", async () => {
    const provider = mockProvider({ shouldClarify: true, confidence: "high" });

    const result = await resolveEditClarificationNeed({
      message:
        "Build the project described in Plans/PROJECT_PLAN.md. Update the plan status and check off the completed items as part of the proposal.",
      provider,
    });

    expect(result.shouldClarify).toBe(false);
    expect(result.source).toBe("deterministic");
    expect(provider.requestEditClarificationNeed).not.toHaveBeenCalled();
  });

  it("calls the model for concrete CSS directives", async () => {
    const provider = mockProvider({ shouldClarify: false, confidence: "high" });

    await resolveEditClarificationNeed({
      message: "make all buttons blue",
      provider,
    });

    expect(provider.requestEditClarificationNeed).toHaveBeenCalledOnce();
  });
});
