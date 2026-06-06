import { buildTutorOpening, formatTutorOpening } from "./tutorOpening";
import type { InstructionGuide, InstructionOpeningStepSummary } from "../../../types/tutor";

/** Programmatic fallback when instruction analysis is unkeyed or fails. */
export function buildProgrammaticInstructionOpening(
  instructionsMarkdown: string,
  guide: InstructionGuide,
): {
  opening: ReturnType<typeof buildTutorOpening>;
  content: string;
  stepSummaries: InstructionOpeningStepSummary[];
} {
  const opening = buildTutorOpening(instructionsMarkdown, guide);
  const stepSummaries =
    guide.type === "linear"
      ? guide.steps.map((step) => ({
          id: step.id,
          shortLabel: step.title.replace(/^\d+\s*:\s*/i, "").trim(),
          summary: step.prompt && step.prompt !== step.title ? step.prompt : step.title,
        }))
      : guide.options.map((option) => ({
          id: option.id,
          shortLabel: option.label,
          summary: option.prompt,
        }));

  return {
    opening,
    content: formatTutorOpening(opening),
    stepSummaries,
  };
}
