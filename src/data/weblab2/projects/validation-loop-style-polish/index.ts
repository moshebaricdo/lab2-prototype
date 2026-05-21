import type { FileItem } from "../../../../types/file";
import type { WebLab2ValidationReviewConfig } from "../../../../types/validationReview";
import {
  parseAssessmentChecks,
  parseAssessmentGoalLabels,
  parseAssessmentGoals,
} from "../validationAssessment";
import validationLoopStylePolishAssessmentMarkdown from "./assessment.md?raw";
import indexHtml from "./files/index.html?raw";
import validationLoopStylePolishInstructionsMarkdown from "./instructions.md?raw";
import stylesCss from "./files/style.css?raw";

export const validationLoopStylePolishReviewConfig: WebLab2ValidationReviewConfig = {
  mode: "open-ended",
  title: "Loop style polish review",
  goals: parseAssessmentGoals(validationLoopStylePolishAssessmentMarkdown),
  goalLabels: parseAssessmentGoalLabels(validationLoopStylePolishAssessmentMarkdown),
  checks: parseAssessmentChecks(validationLoopStylePolishAssessmentMarkdown),
  effortPolicy: "required",
  minimumChangedFiles: 1,
  followUpPreference: "suggestion",
};

export const validationLoopStylePolishFileStructure: FileItem[] = [
  {
    name: "Loop Style Polish",
    type: "folder",
    children: [
      {
        name: "index.html",
        type: "html",
        content: indexHtml,
      },
      {
        name: "style.css",
        type: "css",
        content: stylesCss,
      },
    ],
  },
];

export { validationLoopStylePolishInstructionsMarkdown };

export const validationLoopStylePolishInitialOpenFiles = ["index.html", "style.css"];
