import { afterEach, describe, expect, it, vi } from "vitest";

import {
  classifyTutorRequestIntentWithModel,
  failClosedGuidanceIntent,
  resolveAutoTutorRequestIntent,
  type RequestIntentClassifierContext,
} from "./requestIntentClassifier";
import { REQUEST_INTENT_FIXTURES } from "./requestIntentFixtures";
import type { TutorRequestIntentProvider } from "../provider/openAiProvider";
import type { TutorRequestIntentResponse } from "../types";

vi.mock("../../../hooks/useTutorApiSettings", () => ({
  getTutorApiKey: () => "",
  getTutorCodeModel: () => "gpt-4.1",
}));

function mockProvider(
  response: TutorRequestIntentResponse | null,
): TutorRequestIntentProvider {
  return {
    requestIntentClassification: vi.fn(async () => response),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("classifyTutorRequestIntentWithModel", () => {
  it("fail-closed to guidance when no API key is present", async () => {
    const result = await classifyTutorRequestIntentWithModel({
      message: "add a footer with my name",
      context: { supportContext: "standalone-project" },
    });

    expect(result).toEqual(failClosedGuidanceIntent());
  });

  it("uses the model verdict when the provider returns a valid intent", async () => {
    const provider = mockProvider({
      intent: "edit",
      isConcept: false,
      asksForAnswer: false,
      confidence: "high",
    });

    const result = await classifyTutorRequestIntentWithModel({
      message: "the heading feels too small",
      context: { supportContext: "standalone-project" },
      provider,
    });

    expect(result.source).toBe("model");
    expect(result.intent).toBe("edit");
    expect(provider.requestIntentClassification).toHaveBeenCalledOnce();
  });

  it("fail-closed to guidance when the model returns an invalid intent", async () => {
    const provider = mockProvider({
      intent: "nonsense" as TutorRequestIntentResponse["intent"],
      confidence: "high",
    });

    const result = await classifyTutorRequestIntentWithModel({
      message: "what is a promise?",
      context: { supportContext: "curriculum-level" },
      provider,
    });

    expect(result.intent).toBe("guidance");
    expect(result.reason).toBe("classifier-invalid-output");
  });

  it("fail-closed to guidance when the provider throws", async () => {
    const provider: TutorRequestIntentProvider = {
      requestIntentClassification: vi.fn(async () => {
        throw new Error("network down");
      }),
    };

    const result = await classifyTutorRequestIntentWithModel({
      message: "how do I fix this?",
      context: { supportContext: "curriculum-level" },
      provider,
    });

    expect(result.intent).toBe("guidance");
    expect(result.reason).toBe("classifier-error");
  });

  it("fail-closed to guidance when the model is low confidence", async () => {
    const provider = mockProvider({
      intent: "edit",
      confidence: "low",
    });

    const result = await classifyTutorRequestIntentWithModel({
      message: "maybe change something?",
      provider,
    });

    expect(result.intent).toBe("guidance");
    expect(result.reason).toBe("classifier-low-confidence");
  });
});

describe("resolveAutoTutorRequestIntent", () => {
  it("always calls the model when a provider is injected", async () => {
    const provider = mockProvider({
      intent: "edit",
      confidence: "high",
    });

    const result = await resolveAutoTutorRequestIntent({
      message: "add a footer with my name and the year",
      context: { supportContext: "standalone-project" },
      provider,
    });

    expect(provider.requestIntentClassification).toHaveBeenCalledOnce();
    expect(result.source).toBe("model");
    expect(result.intent).toBe("edit");
  });

  it("applies the plan-revision override after the model verdict", async () => {
    const provider = mockProvider({
      intent: "edit",
      confidence: "high",
    });

    const result = await resolveAutoTutorRequestIntent({
      message: "i think it should feel more playful and energetic",
      context: {
        supportContext: "standalone-project",
        hasActivePlan: true,
        lastAssistantAskedPlanningQuestion: true,
      },
      provider,
    });

    expect(result.intent).toBe("planning");
  });
});

describe("request intent fixtures (model path plumbing)", () => {
  for (const fixture of REQUEST_INTENT_FIXTURES) {
    it(`routes "${fixture.message}" via the model verdict`, async () => {
      const provider = mockProvider({
        intent: fixture.expectedIntent,
        isConcept: fixture.expectedIsConcept ?? false,
        asksForAnswer: fixture.expectedAsksForAnswer ?? false,
        confidence: "high",
      });

      const result = await classifyTutorRequestIntentWithModel({
        message: fixture.message,
        context: fixture.context,
        provider,
      });

      expect(result.intent).toBe(fixture.expectedIntent);
      if (fixture.expectedIsConcept !== undefined) {
        expect(result.isConcept).toBe(fixture.expectedIsConcept);
      }
      if (fixture.expectedAsksForAnswer !== undefined) {
        expect(result.asksForAnswer).toBe(fixture.expectedAsksForAnswer);
      }
    });
  }

  it("returns guidance without an API key for every fixture", async () => {
    for (const fixture of REQUEST_INTENT_FIXTURES) {
      const result = await classifyTutorRequestIntentWithModel({
        message: fixture.message,
        context: fixture.context,
      });
      expect(result.intent).toBe("guidance");
      expect(result.source).toBe("deterministic");
    }
  });
});
