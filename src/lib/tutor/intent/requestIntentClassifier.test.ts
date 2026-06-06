import { afterEach, describe, expect, it, vi } from "vitest";

import {
  classifyTutorRequestIntentWithModel,
  resolveAutoTutorRequestIntent,
  type RequestIntentClassifierContext,
} from "./requestIntentClassifier";
import { classifyTutorRequestIntent } from "./requestIntent";
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
  it("uses the deterministic fallback when the real provider has no API key", async () => {
    // The mocked useTutorApiSettings returns an empty key, so the default
    // (real) provider path must never hit the network and must match the
    // existing regex verdict exactly.
    const message = "add a footer with my name";
    const context: RequestIntentClassifierContext = {
      supportContext: "standalone-project",
    };

    const result = await classifyTutorRequestIntentWithModel({ message, context });

    expect(result.source).toBe("deterministic");
    expect(result.intent).toBe(classifyTutorRequestIntent(message, context));
  });

  it("uses the model verdict when the provider returns a valid intent", async () => {
    const provider = mockProvider({
      intent: "edit",
      isConcept: false,
      asksForAnswer: false,
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

  it("falls back to deterministic when the model returns an invalid intent", async () => {
    const message = "what is a promise?";
    const context: RequestIntentClassifierContext = {
      supportContext: "curriculum-level",
    };
    const provider = mockProvider({
      intent: "nonsense" as TutorRequestIntentResponse["intent"],
    });

    const result = await classifyTutorRequestIntentWithModel({
      message,
      context,
      provider,
    });

    expect(result.source).toBe("deterministic");
    expect(result.intent).toBe(classifyTutorRequestIntent(message, context));
  });

  it("falls back to deterministic when the provider throws", async () => {
    const message = "how do I fix this?";
    const context: RequestIntentClassifierContext = {
      supportContext: "curriculum-level",
    };
    const provider: TutorRequestIntentProvider = {
      requestIntentClassification: vi.fn(async () => {
        throw new Error("network down");
      }),
    };

    const result = await classifyTutorRequestIntentWithModel({
      message,
      context,
      provider,
    });

    expect(result.source).toBe("deterministic");
    expect(result.intent).toBe(classifyTutorRequestIntent(message, context));
  });

  it("falls back to deterministic concept/answer flags when the model omits them", async () => {
    const provider = mockProvider({ intent: "guidance" });

    const result = await classifyTutorRequestIntentWithModel({
      message: "what is a closure?",
      context: { supportContext: "curriculum-level" },
      provider,
    });

    expect(result.source).toBe("model");
    expect(result.intent).toBe("guidance");
    // Model omitted isConcept; fallback lexicon fills it in.
    expect(result.isConcept).toBe(true);
  });
});

describe("resolveAutoTutorRequestIntent (ambiguity gate)", () => {
  it("skips the model for a confident imperative edit", async () => {
    const provider = mockProvider({ intent: "guidance" });

    const result = await resolveAutoTutorRequestIntent({
      message: "add a footer with my name and the year",
      context: { supportContext: "standalone-project" },
      provider,
    });

    expect(provider.requestIntentClassification).not.toHaveBeenCalled();
    expect(result.source).toBe("deterministic");
    expect(result.intent).toBe("edit");
  });

  it("skips the model for an explicit guidance question", async () => {
    const provider = mockProvider({ intent: "edit" });

    const result = await resolveAutoTutorRequestIntent({
      message: "can you explain what a closure is?",
      context: { supportContext: "curriculum-level" },
      provider,
    });

    expect(provider.requestIntentClassification).not.toHaveBeenCalled();
    expect(result.intent).toBe("guidance");
  });

  it("calls the model for an ambiguous indirect request", async () => {
    const provider = mockProvider({ intent: "edit" });

    const result = await resolveAutoTutorRequestIntent({
      message: "the heading feels way too small and cramped",
      context: { supportContext: "standalone-project" },
      provider,
    });

    expect(provider.requestIntentClassification).toHaveBeenCalledOnce();
    expect(result.source).toBe("model");
    expect(result.intent).toBe("edit");
  });

  it("applies the plan-revision override after the model verdict", async () => {
    // Model says "edit", but an active plan + a pending planning question in a
    // standalone project means the message is a plan revision.
    const provider = mockProvider({ intent: "edit" });

    const result = await resolveAutoTutorRequestIntent({
      message: "i think it should feel more playful and energetic",
      context: {
        supportContext: "standalone-project",
        hasActivePlan: true,
        lastAssistantAskedPlanningQuestion: true,
      },
      provider,
    });

    expect(provider.requestIntentClassification).toHaveBeenCalledOnce();
    expect(result.intent).toBe("planning");
  });
});

describe("request intent fixtures (model path plumbing)", () => {
  // With a model that returns the labeled answer, the classifier must surface
  // it unchanged — this proves the wiring/normalization for every fixture,
  // including the ones the regex cascade is known to get wrong.
  for (const fixture of REQUEST_INTENT_FIXTURES) {
    it(`routes "${fixture.message}" via the model verdict`, async () => {
      const provider = mockProvider({
        intent: fixture.expectedIntent,
        isConcept: fixture.expectedIsConcept ?? false,
        asksForAnswer: fixture.expectedAsksForAnswer ?? false,
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

  it("deterministic fallback never crashes and always yields a valid intent", async () => {
    for (const fixture of REQUEST_INTENT_FIXTURES) {
      const result = await classifyTutorRequestIntentWithModel({
        message: fixture.message,
        context: fixture.context,
        // Default provider + mocked empty key -> deterministic path.
      });
      expect(["guidance", "planning", "edit"]).toContain(result.intent);
      expect(result.source).toBe("deterministic");
    }
  });

  it("documents that the regex cascade mis-routes the flagged fixtures", () => {
    // Sanity check that our `regexKnownWrong` annotations are accurate: the
    // deterministic intent should NOT equal the expected intent for those.
    // This keeps the fixture file honest as P3's motivation/baseline.
    for (const fixture of REQUEST_INTENT_FIXTURES) {
      if (!fixture.regexKnownWrong) continue;
      const regexIntent = classifyTutorRequestIntent(fixture.message, fixture.context);
      expect(
        regexIntent,
        `expected regex to mis-route "${fixture.message}" (annotated regexKnownWrong)`,
      ).not.toBe(fixture.expectedIntent);
    }
  });
});
