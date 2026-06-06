import { describe, expect, it } from "vitest";
import { featureRouletteInstructionsMarkdown } from "../../../data/weblab2/projects/feature-roulette";
import { buildInstructionGuide } from "./instructionGuide";
import { buildProgrammaticInstructionOpening } from "./instructionOpeningRunner";

describe("buildProgrammaticInstructionOpening", () => {
  it("builds step summaries keyed to the guide", () => {
    const guide = buildInstructionGuide(featureRouletteInstructionsMarkdown);
    const result = buildProgrammaticInstructionOpening(
      featureRouletteInstructionsMarkdown,
      guide,
    );

    expect(result.content.length).toBeGreaterThan(0);
    if (guide.type === "linear") {
      expect(result.stepSummaries.map((step) => step.id)).toEqual(
        guide.steps.map((step) => step.id),
      );
    }
  });
});
