import featureRouletteAssessmentMarkdown from "../../../data/weblab2/projects/feature-roulette/assessment.md?raw";
import { featureRouletteInstructionsMarkdown } from "../../../data/weblab2/projects/feature-roulette";
import validationLoopStylePolishAssessmentMarkdown from "../../../data/weblab2/projects/validation-loop-style-polish/assessment.md?raw";
import { validationLoopStylePolishInstructionsMarkdown } from "../../../data/weblab2/projects/validation-loop-style-polish";
import validationPhotoCarouselAssessmentMarkdown from "../../../data/weblab2/projects/validation-photo-carousel/assessment.md?raw";
import { validationPhotoCarouselInstructionsMarkdown } from "../../../data/weblab2/projects/validation-photo-carousel";
import validationPromiseTraceAssessmentMarkdown from "../../../data/weblab2/projects/validation-promise-trace/assessment.md?raw";
import { validationPromiseTraceInstructionsMarkdown } from "../../../data/weblab2/projects/validation-promise-trace";
import validationStarshipLoaderAssessmentMarkdown from "../../../data/weblab2/projects/validation-starship-loader/assessment.md?raw";
import { validationStarshipLoaderInstructionsMarkdown } from "../../../data/weblab2/projects/validation-starship-loader";
import { buildValidationReviewConfig } from "../../../data/weblab2/projects/validationAssessment";
import type { InstructionAnalysisAssessment } from "./instructionAnalysisRunner";

export interface InstructionAnalysisFixture {
  id: string;
  markdown: string;
  assessment: InstructionAnalysisAssessment;
  expectedMode: "linear" | "open-ended";
  /** When true, live eval omits assessment goals (instructions-only inference). */
  instructionsOnly?: boolean;
  /** True when the deterministic regex derivation infers the wrong shape today. */
  regexKnownWrong?: boolean;
  note: string;
}

function assessmentFromMarkdown(assessmentMarkdown: string): InstructionAnalysisAssessment {
  const config = buildValidationReviewConfig(assessmentMarkdown);
  return {
    goals: config.goals,
    goalLabels: config.goalLabels,
  };
}

/**
 * Labeled real-level instructions + parsed assessment used to evaluate
 * guide-shape inference. The `expectedMode` is the human-judged shape;
 * `regexKnownWrong` flags where deterministic derivation disagrees.
 */
export const instructionAnalysisFixtures: InstructionAnalysisFixture[] = [
  {
    id: "feature-roulette",
    markdown: featureRouletteInstructionsMarkdown,
    assessment: assessmentFromMarkdown(featureRouletteAssessmentMarkdown),
    expectedMode: "open-ended",
    regexKnownWrong: true,
    note: "Hard edge case: open assignment with a numbered procedural tail (save/revert). Assessment goal is create-a-feature; version history is out-of-band for coaching.",
  },
  {
    id: "loop-style-polish",
    markdown: validationLoopStylePolishInstructionsMarkdown,
    assessment: assessmentFromMarkdown(validationLoopStylePolishAssessmentMarkdown),
    expectedMode: "open-ended",
    note: "\"Try these prompts\" with several style focus areas the student may pick in any order.",
  },
  {
    id: "promise-trace",
    markdown: validationPromiseTraceInstructionsMarkdown,
    assessment: assessmentFromMarkdown(validationPromiseTraceAssessmentMarkdown),
    expectedMode: "linear",
    note: "Identify each Promise state then describe it — a fixed two-part procedure per comment.",
  },
  {
    id: "starship-loader",
    markdown: validationStarshipLoaderInstructionsMarkdown,
    assessment: assessmentFromMarkdown(validationStarshipLoaderAssessmentMarkdown),
    expectedMode: "linear",
    note: "Find the loop, write the missing code, run to verify — an ordered debug fix.",
  },
  {
    id: "photo-carousel",
    markdown: validationPhotoCarouselInstructionsMarkdown,
    assessment: assessmentFromMarkdown(validationPhotoCarouselAssessmentMarkdown),
    expectedMode: "linear",
    note: "Test, check the basics, ask for help, fix and verify — a guided debugging sequence.",
  },
  {
    id: "promise-trace-instructions-only",
    markdown: validationPromiseTraceInstructionsMarkdown,
    assessment: { goals: [], goalLabels: [] },
    expectedMode: "linear",
    instructionsOnly: true,
    note: "Instructions-only inference: label/describe each numbered Promise state in order.",
  },
];
