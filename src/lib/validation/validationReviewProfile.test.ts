import { describe, expect, it } from "vitest";

import { featureRouletteInstructionsMarkdown } from "../../data/weblab2/projects/feature-roulette";
import { featureRouletteReviewConfig } from "../../data/weblab2/projects/feature-roulette";
import { validationLoopStylePolishInstructionsMarkdown } from "../../data/weblab2/projects/validation-loop-style-polish";
import { validationLoopStylePolishReviewConfig } from "../../data/weblab2/projects/validation-loop-style-polish";
import { validationPhotoCarouselInstructionsMarkdown } from "../../data/weblab2/projects/validation-photo-carousel";
import { validationPhotoCarouselReviewConfig } from "../../data/weblab2/projects/validation-photo-carousel";
import { validationPromiseTraceInstructionsMarkdown } from "../../data/weblab2/projects/validation-promise-trace";
import { validationPromiseTraceReviewConfig } from "../../data/weblab2/projects/validation-promise-trace";
import {
  deriveValidationEffortPolicy,
  deriveValidationReviewMode,
  instructionsMentionVersionHistory,
  resolveValidationReviewProfile,
} from "./validationReviewProfile";

describe("validationReviewProfile", () => {
  it("derives effort policy from assessment goals", () => {
    expect(deriveValidationEffortPolicy(validationPromiseTraceReviewConfig.goals)).toBe("none");
    expect(deriveValidationEffortPolicy(validationLoopStylePolishReviewConfig.goals)).toBe("required");
    expect(deriveValidationEffortPolicy(validationPhotoCarouselReviewConfig.goals)).toBe("none");
    expect(deriveValidationEffortPolicy(featureRouletteReviewConfig.goals)).toBe("required");
  });

  it("detects version history workflow from instructions", () => {
    expect(instructionsMentionVersionHistory(featureRouletteInstructionsMarkdown)).toBe(true);
    expect(instructionsMentionVersionHistory(validationPhotoCarouselInstructionsMarkdown)).toBe(false);
  });

  it("derives review titles from instructions headings", () => {
    const profile = resolveValidationReviewProfile(validationPromiseTraceReviewConfig, {
      instructionsMarkdown: validationPromiseTraceInstructionsMarkdown,
    });
    expect(profile.title).toBe("Trace a Promise review");
  });

  it("derives review mode from assessment goals", () => {
    expect(
      resolveValidationReviewProfile(validationLoopStylePolishReviewConfig).reviewMode,
    ).toBe("open-ended");
    expect(
      resolveValidationReviewProfile(validationPhotoCarouselReviewConfig).reviewMode,
    ).toBe("technical");
    expect(
      resolveValidationReviewProfile(validationPromiseTraceReviewConfig).reviewMode,
    ).toBe("hybrid");
  });

  it("enables version history evaluation when assessment includes workflow goals", () => {
    expect(
      resolveValidationReviewProfile(featureRouletteReviewConfig).evaluateVersionHistory,
    ).toBe(true);
    expect(
      resolveValidationReviewProfile(validationPhotoCarouselReviewConfig).evaluateVersionHistory,
    ).toBe(false);
  });
});

describe("deriveValidationReviewMode", () => {
  it("maps creative goals to open-ended and comprehension goals to hybrid", () => {
    expect(deriveValidationReviewMode(["Make one intentional style refinement."])).toBe("open-ended");
    expect(deriveValidationReviewMode(["Label and explain each Promise state."])).toBe("hybrid");
    expect(deriveValidationReviewMode(["Fix the Next button selector."])).toBe("technical");
  });
});
