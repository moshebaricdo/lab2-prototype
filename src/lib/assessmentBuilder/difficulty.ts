import type { QuestionDifficulty } from "../../types/assessmentBuilder";

export const QUESTION_DIFFICULTIES: QuestionDifficulty[] = [
  "beginner",
  "intermediate",
  "advanced",
];

export const QUESTION_DIFFICULTY_LABELS: Record<QuestionDifficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};
