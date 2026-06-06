import { describe, expect, it } from "vitest";

import { featureRouletteReviewConfig } from "../../data/weblab2/projects/feature-roulette";
import { validationLoopStylePolishReviewConfig } from "../../data/weblab2/projects/validation-loop-style-polish";
import { validationPhotoCarouselReviewConfig } from "../../data/weblab2/projects/validation-photo-carousel";
import { validationPromiseTraceReviewConfig } from "../../data/weblab2/projects/validation-promise-trace";
import {
  assessmentNeedsVersionHistorySnapshots,
  resolveGoalEvaluatorKind,
  resolveGoalEvaluators,
} from "./validationGoalEvaluators";

describe("validationGoalEvaluators", () => {
  it("routes version-history workflow goals to deterministic evaluators", () => {
    expect(resolveGoalEvaluatorKind(
      "The student saved a manual version with a description in Version History.",
    )).toBe("version-history-save");
    expect(resolveGoalEvaluatorKind(
      "The student restored a version they saved with a description.",
    )).toBe("version-history-revert");
    expect(resolveGoalEvaluatorKind(
      "The page includes at least one new structural feature.",
    )).toBe("ai");
  });

  it("detects version history snapshots from assessment goals", () => {
    expect(assessmentNeedsVersionHistorySnapshots(featureRouletteReviewConfig)).toBe(true);
    expect(assessmentNeedsVersionHistorySnapshots(validationPhotoCarouselReviewConfig)).toBe(false);
  });

  it("maps each assessment goal index to an evaluator", () => {
    expect(resolveGoalEvaluators(featureRouletteReviewConfig)).toEqual([
      { goalIndex: 0, kind: "ai" },
      { goalIndex: 1, kind: "version-history-save" },
      { goalIndex: 2, kind: "version-history-revert" },
    ]);
    expect(resolveGoalEvaluators(validationLoopStylePolishReviewConfig)).toEqual([
      { goalIndex: 0, kind: "ai" },
    ]);
    expect(resolveGoalEvaluators(validationPromiseTraceReviewConfig).every((entry) => entry.kind === "ai")).toBe(true);
  });
});
