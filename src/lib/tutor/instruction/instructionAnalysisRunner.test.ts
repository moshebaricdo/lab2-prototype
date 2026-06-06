import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildInstructionAnalysisUserPayload,
  buildProgrammaticInstructionAnalysis,
  INSTRUCTION_ANALYSIS_SYSTEM_PROMPT,
  runInstructionAnalysis,
} from "./instructionAnalysisRunner";
import { instructionAnalysisFixtures } from "./instructionAnalysisFixtures";
import type { TutorInstructionAnalysisProvider } from "../provider/openAiProvider";
import type { TutorInstructionAnalysisResponse } from "../types";

vi.mock("../../../hooks/useTutorApiSettings", () => ({
  getTutorApiKey: () => "",
  getTutorCodeModel: () => "gpt-4.1",
}));

function mockProvider(
  response: TutorInstructionAnalysisResponse | null,
): TutorInstructionAnalysisProvider {
  return {
    requestInstructionAnalysis: vi.fn(async () => response),
  };
}

const LINEAR_RESPONSE: TutorInstructionAnalysisResponse = {
  mode: "linear",
  tone: "debug",
  overview: "Fix the infinite loader",
  goal: "Let's find why the loader never finishes and fix it together.",
  success: "You'll know it's working when the ship fills to 800 tons without freezing.",
  firstMove: "Take a look at the while loop inside the runBtn listener.",
  steps: [
    { title: "Find the loop", intent: "inspect", shortLabel: "Find the loop", summary: "Locate the while loop in the listener." },
    { title: "Write the missing code", prompt: "Push the crate and increment i", intent: "fix", editOriented: true, shortLabel: "Write the fix", summary: "Add the push and increment." },
    { title: "Run to verify", intent: "verify", shortLabel: "Verify it", summary: "Run the loader and watch it fill." },
  ],
};

const OPEN_ENDED_RESPONSE: TutorInstructionAnalysisResponse = {
  mode: "open-ended",
  tone: "creative",
  overview: "Polish the page styling",
  goal: "Let's make the buttons and links feel polished and on-brand.",
  success: "A polished version has clear hover and focus states that stay readable.",
  firstMove: "Pick a focus to start — maybe the nav links or the buttons — what sounds fun?",
  constraints: ["Keep the page usable", "Don't hurt contrast"],
  steps: [
    { title: "Polish nav links", prompt: "Add an animated hover underline and a focus outline", intent: "style-polish", editOriented: true, shortLabel: "Nav links", summary: "Give nav links interactive hover and focus." },
    { title: "Improve the buttons", prompt: "Make the primary button distinct", intent: "style-polish", editOriented: true, shortLabel: "Buttons", summary: "Make buttons distinct with safe contrast." },
  ],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("INSTRUCTION_ANALYSIS_SYSTEM_PROMPT", () => {
  it("stays general — no level ids or curriculum-specific examples", () => {
    const prompt = INSTRUCTION_ANALYSIS_SYSTEM_PROMPT.toLowerCase();
    const banned = [
      ...instructionAnalysisFixtures.map((fixture) => fixture.id),
      "feature roulette",
      "roulette",
      "photo carousel",
      "starship",
      "promise trace",
      "polish nav",
      "create a new feature",
    ];
    for (const fragment of banned) {
      expect(prompt, `prompt must not reference "${fragment}"`).not.toContain(fragment);
    }
  });
});

describe("buildInstructionAnalysisUserPayload", () => {
  it("includes assessment goals and version-history scope when provided", () => {
    const payload = JSON.parse(buildInstructionAnalysisUserPayload({
      instructionsMarkdown: "# Feature\n\nSave version when done.",
      assessment: {
        goals: ["The page includes a new structural feature."],
        goalLabels: ["Create a new feature"],
      },
    }));

    expect(payload.assessment.goals).toHaveLength(1);
    expect(payload.assessment.goalLabels).toEqual(["Create a new feature"]);
    expect(payload.assessment.evaluateVersionHistoryAtReview).toBe(true);
    expect(payload.instructionsMarkdown).toContain("Feature");
  });

  it("returns structured instructions-only payload when no assessment goals are provided", () => {
    const payload = JSON.parse(buildInstructionAnalysisUserPayload({
      instructionsMarkdown: "# Trace a Promise\n\n1. Label the state.",
    }));

    expect(payload.instructionsMarkdown).toContain("Trace a Promise");
    expect(payload.assessment).toBeNull();
    expect(payload.inferShapeFromInstructionsOnly).toBe(true);
  });

  it("does not include local validation-check blocks from assessment markdown", () => {
    const payload = buildInstructionAnalysisUserPayload({
      instructionsMarkdown: "# Feature\n\nSave version when done.",
      assessment: {
        goals: ["The page includes a new structural feature."],
        goalLabels: ["Create a new feature"],
      },
    });

    expect(payload).not.toContain("validation-checks");
    expect(payload).not.toContain("querySelector");
    expect(JSON.parse(payload).assessment.goals).toHaveLength(1);
  });
});

describe("runInstructionAnalysis", () => {
  it("passes assessment context to the provider when supplied", async () => {
    const provider = mockProvider(LINEAR_RESPONSE);
    await runInstructionAnalysis({
      instructionsMarkdown: "# Trace a Promise\n\n1. Label the state.",
      assessment: {
        goals: ["Each comment includes a Promise state label and explanation."],
        goalLabels: ["Label and explain what each step is doing"],
      },
      provider,
    });

    const messages = vi.mocked(provider.requestInstructionAnalysis).mock.calls[0]?.[0];
    const payload = JSON.parse((messages?.[1]?.content ?? "{}") as string);
    expect(payload.assessment.goals).toHaveLength(1);
    expect(payload.instructionsMarkdown).toContain("Trace a Promise");
  });

  it("still calls the provider for instructions-only levels when keyed", async () => {
    const provider = mockProvider(LINEAR_RESPONSE);
    await runInstructionAnalysis({
      instructionsMarkdown: "# Trace a Promise\n\n1. Label the state.",
      provider,
    });

    expect(provider.requestInstructionAnalysis).toHaveBeenCalledOnce();
    const userContent = vi.mocked(provider.requestInstructionAnalysis).mock.calls[0]?.[0]?.[1]?.content;
    const payload = JSON.parse(typeof userContent === "string" ? userContent : "{}");
    expect(payload.inferShapeFromInstructionsOnly).toBe(true);
  });

  it("falls back to the deterministic analysis when the default provider has no key", async () => {
    const markdown = "# Trace a Promise\n\n1. Identify the state.\n2. Describe the action.";
    const result = await runInstructionAnalysis({ instructionsMarkdown: markdown });
    const expected = buildProgrammaticInstructionAnalysis(markdown);

    expect(result.guide.type).toBe(expected.guide.type);
    expect(result.content).toBe(expected.content);
    expect(result.stepSummaries.map((s) => s.id)).toEqual(
      expected.stepSummaries.map((s) => s.id),
    );
  });

  it("builds a linear guide and opening from a linear model verdict", async () => {
    const result = await runInstructionAnalysis({
      instructionsMarkdown: "# The Infinite Loader\n\n1. Find the loop.",
      provider: mockProvider(LINEAR_RESPONSE),
    });

    expect(result.guide.type).toBe("linear");
    if (result.guide.type !== "linear") throw new Error("expected linear");
    expect(result.guide.steps).toHaveLength(3);
    expect(result.guide.steps[0]?.id).toBe("find-the-loop");
    expect(result.guide.steps[1]?.intent).toBe("fix");
    expect(result.guide.steps[1]?.expectedStudentMove).toBe("code-change");
    expect(result.opening.tone).toBe("debug");
    expect(result.content).toContain("Let's find why the loader never finishes");
    expect(result.content).toContain("Take a look at the while loop");
    expect(result.stepSummaries).toHaveLength(3);
    expect(result.stepSummaries[0]?.shortLabel).toBe("Find the loop");
  });

  it("builds a choice-based guide from an open-ended model verdict", async () => {
    const result = await runInstructionAnalysis({
      instructionsMarkdown: "# Polish the Style\n\nTry these prompts.",
      provider: mockProvider(OPEN_ENDED_RESPONSE),
    });

    expect(result.guide.type).toBe("choice-based");
    if (result.guide.type !== "choice-based") throw new Error("expected choice-based");
    expect(result.guide.options).toHaveLength(2);
    expect(result.guide.options[0]?.id).toBe("polish-nav-links");
    expect(result.guide.options[0]?.intent).toBe("style-polish");
    expect(result.guide.options[0]?.editOriented).toBe(true);
    expect(result.guide.constraints).toEqual(["Keep the page usable", "Don't hurt contrast"]);
    expect(result.guide.goal).toBe("Polish the page styling");
  });

  it("falls back when the model omits required fields", async () => {
    const markdown = "# Trace a Promise\n\n1. Identify the state.";
    const result = await runInstructionAnalysis({
      instructionsMarkdown: markdown,
      provider: mockProvider({ mode: "linear", steps: [{ title: "X" }] }),
    });

    expect(result.content).toBe(buildProgrammaticInstructionAnalysis(markdown).content);
  });

  it("falls back when the provider throws", async () => {
    const markdown = "# Trace a Promise\n\n1. Identify the state.";
    const provider: TutorInstructionAnalysisProvider = {
      requestInstructionAnalysis: vi.fn(async () => {
        throw new Error("network");
      }),
    };
    const result = await runInstructionAnalysis({ instructionsMarkdown: markdown, provider });

    expect(result.content).toBe(buildProgrammaticInstructionAnalysis(markdown).content);
  });

  it("dedupes ids when steps share a title", async () => {
    const result = await runInstructionAnalysis({
      instructionsMarkdown: "x",
      provider: mockProvider({
        mode: "linear",
        goal: "Let's do the thing.",
        firstMove: "Take a look at the first item.",
        steps: [
          { title: "Refine it", intent: "fix" },
          { title: "Refine it", intent: "fix" },
        ],
      }),
    });

    if (result.guide.type !== "linear") throw new Error("expected linear");
    expect(result.guide.steps.map((s) => s.id)).toEqual(["refine-it", "refine-it-2"]);
  });
});

describe("runInstructionAnalysis — fixture mapping", () => {
  for (const fixture of instructionAnalysisFixtures) {
    it(`maps a ${fixture.expectedMode} verdict for ${fixture.id}`, async () => {
      const provider = mockProvider({
        mode: fixture.expectedMode,
        tone: "procedure",
        overview: `Work on ${fixture.id}`,
        goal: "Let's work through this level together.",
        firstMove:
          fixture.expectedMode === "linear"
            ? "Take a look at the first step to get going."
            : "Pick a focus area that interests you to start.",
        steps: [
          { title: "First thing", intent: fixture.expectedMode === "linear" ? "inspect" : "style-polish" },
          { title: "Second thing", intent: fixture.expectedMode === "linear" ? "fix" : "content-choice" },
        ],
      });

      const result = await runInstructionAnalysis({
        instructionsMarkdown: fixture.markdown,
        assessment: fixture.assessment,
        provider,
      });

      const expectedType = fixture.expectedMode === "linear" ? "linear" : "choice-based";
      expect(result.guide.type).toBe(expectedType);
    });
  }
});
