import { describe, expect, it, vi } from "vitest";
import { featureRouletteInstructionsMarkdown } from "../../data/weblab2/projects/feature-roulette";
import { buildInstructionGuide } from "./instructionGuide";
import {
  buildProgrammaticInstructionOpening,
  runInstructionOpening,
} from "./instructionOpeningRunner";
import type { TutorInstructionOpeningProvider } from "./openAiProvider";
import type { TutorInstructionOpeningResponse } from "./types";

vi.mock("../../hooks/useTutorApiSettings", () => ({
  getTutorApiKey: () => "test-key",
}));

class OpeningProvider implements TutorInstructionOpeningProvider {
  calls = 0;

  constructor(private readonly response: TutorInstructionOpeningResponse | null) {}

  async requestInstructionOpening() {
    this.calls += 1;
    return this.response;
  }
}

describe("runInstructionOpening", () => {
  const guide = buildInstructionGuide(featureRouletteInstructionsMarkdown);

  it("returns a faithful LLM-authored opening and step summaries keyed by guide ids", async () => {
    const provider = new OpeningProvider({
      tone: "procedure",
      goal: "Try bold features with version history as your safety net.",
      success: "You save versions with comments and can revert when needed.",
      firstMove: "Draw a card, then ask AI to build that feature in your page.",
      steps: [
        {
          id: guide.type === "linear" ? guide.steps[0]!.id : "unused",
          shortLabel: "Create a feature",
          summary: "Use a card prompt to generate a new feature with AI.",
        },
        {
          id: guide.type === "linear" ? guide.steps[1]!.id : "unused",
          shortLabel: "Save a version",
          summary: "Save in Version History with a short comment.",
        },
        {
          id: guide.type === "linear" ? guide.steps[2]!.id : "unused",
          shortLabel: "Revert if needed",
          summary: "Revert to your last described save when prompted.",
        },
      ],
    });

    const result = await runInstructionOpening({
      instructionsMarkdown: featureRouletteInstructionsMarkdown,
      guide,
      provider,
    });

    expect(provider.calls).toBe(1);
    expect(result.content).toContain("Try bold features");
    expect(result.content).toContain("Draw a card");
    expect(result.content).not.toMatch(/1:\s*Create a New Feature/);
    expect(result.stepSummaries).toHaveLength(3);
    expect(result.stepSummaries.map((step) => step.id)).toEqual(
      guide.type === "linear" ? guide.steps.map((step) => step.id) : [],
    );
    expect(result.stepSummaries[0]?.shortLabel).toBe("Create a feature");
  });

  it("uses the model sentences verbatim without re-wrapping them in tone templates", async () => {
    const provider = new OpeningProvider({
      tone: "creative",
      goal: "Polish the look and feel of your buttons and links so they feel on-brand.",
      success: "When your buttons and links look great and feel easy to use, you're on track.",
      firstMove: "Let's start with your nav links—try giving them a cool hover effect!",
      steps: [
        {
          id: guide.type === "linear" ? guide.steps[0]!.id : "unused",
          shortLabel: "Polish the styles",
          summary: "Refine button and link styling.",
        },
        {
          id: guide.type === "linear" ? guide.steps[1]!.id : "unused",
          shortLabel: "Save a version",
          summary: "Save your progress with a comment.",
        },
        {
          id: guide.type === "linear" ? guide.steps[2]!.id : "unused",
          shortLabel: "Revert if needed",
          summary: "Revert to a saved version when needed.",
        },
      ],
    });

    const result = await runInstructionOpening({
      instructionsMarkdown: featureRouletteInstructionsMarkdown,
      guide,
      provider,
    });

    expect(result.content).not.toContain("This level is about");
    expect(result.content).not.toContain("Aim for a page where");
    expect(result.content).not.toContain("You'll know you're on track when");
    expect(result.content).not.toMatch(/\.\./);
    expect(result.content).toBe(
      "Polish the look and feel of your buttons and links so they feel on-brand. When your buttons and links look great and feel easy to use, you're on track.\n\nLet's start with your nav links—try giving them a cool hover effect!",
    );
  });

  it("falls back to the programmatic opening when the model response is incomplete", async () => {
    const provider = new OpeningProvider({
      tone: "procedure",
      goal: "",
      firstMove: "",
      steps: [],
    });

    const result = await runInstructionOpening({
      instructionsMarkdown: featureRouletteInstructionsMarkdown,
      guide,
      provider,
    });
    const fallback = buildProgrammaticInstructionOpening(
      featureRouletteInstructionsMarkdown,
      guide,
    );

    expect(provider.calls).toBe(1);
    expect(result.content).toBe(fallback.content);
    expect(result.stepSummaries).toHaveLength(fallback.stepSummaries.length);
  });

  it("falls back when the provider throws", async () => {
    const provider: TutorInstructionOpeningProvider = {
      async requestInstructionOpening() {
        throw new Error("network");
      },
    };

    await expect(
      runInstructionOpening({
        instructionsMarkdown: featureRouletteInstructionsMarkdown,
        guide,
        provider,
      }),
    ).rejects.toThrow("network");
  });
});
