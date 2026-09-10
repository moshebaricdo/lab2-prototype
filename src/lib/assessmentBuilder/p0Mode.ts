import type {
  AssessmentArtifact,
  P0AssessmentMode,
} from "../../types/assessmentBuilder";
import { applyQuizPurpose } from "./quizPurpose";

export { createDefaultQuizIntro as createDefaultExamIntro } from "./quizPurpose";

/** Legacy CFU vs Exam preset. Prefer `applyQuizPurpose` on the final builder. */
export function applyP0ModePreset(
  current: AssessmentArtifact,
  mode: P0AssessmentMode,
): AssessmentArtifact {
  return applyQuizPurpose(
    current,
    mode === "checkpoint" ? "check_for_understanding" : "exam",
  );
}

export const P0_MODE_OPTIONS: Array<{ value: P0AssessmentMode; label: string }> =
  [
    { value: "checkpoint", label: "Checkpoint (CFU)" },
    { value: "exam", label: "Exam" },
  ];
