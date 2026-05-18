import type { FileItem } from "../../../../types/file";
import type { WebLab2ValidationReviewConfig } from "../../../../types/validationReview";
import {
  parseAssessmentChecks,
  parseAssessmentGoals,
} from "../validationAssessment";
import validationOpenEndedAssessmentMarkdown from "./assessment.md?raw";
import indexHtml from "./files/index.html?raw";
import validationOpenEndedInstructionsMarkdown from "./instructions.md?raw";
import stylesCss from "./files/style.css?raw";

export const validationOpenEndedReviewConfig: WebLab2ValidationReviewConfig = {
  mode: "open-ended",
  title: "Loop style polish review",
  goals: parseAssessmentGoals(validationOpenEndedAssessmentMarkdown),
  checks: parseAssessmentChecks(validationOpenEndedAssessmentMarkdown),
  effortPolicy: "required",
  minimumChangedFiles: 1,
};

export const validationOpenEndedFileStructure: FileItem[] = [
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

export { validationOpenEndedInstructionsMarkdown };
