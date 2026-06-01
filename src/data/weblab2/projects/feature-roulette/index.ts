import type { FileItem } from "../../../../types/file";
import type { WebLab2ValidationReviewConfig } from "../../../../types/validationReview";
import {
  parseAssessmentChecks,
  parseAssessmentGoalLabels,
  parseAssessmentGoals,
} from "../validationAssessment";
import featureRouletteAssessmentMarkdown from "./assessment.md?raw";
import indexHtml from "./files/index.html?raw";
import styleCss from "./files/style.css?raw";
import featureRouletteInstructionsMarkdown from "./instructions.md?raw";

export const featureRouletteReviewConfig: WebLab2ValidationReviewConfig = {
  mode: "hybrid",
  title: "Feature Roulette review",
  goals: parseAssessmentGoals(featureRouletteAssessmentMarkdown),
  goalLabels: parseAssessmentGoalLabels(featureRouletteAssessmentMarkdown),
  checks: parseAssessmentChecks(featureRouletteAssessmentMarkdown),
  effortPolicy: "required",
  minimumChangedFiles: 1,
  followUpPreference: "suggestion",
  versionHistoryWorkflow: true,
};

export const featureRouletteFileStructure: FileItem[] = [
  {
    name: "index.html",
    type: "html",
    content: indexHtml,
  },
  {
    name: "style.css",
    type: "css",
    content: styleCss,
  },
];

export { featureRouletteInstructionsMarkdown };

export const featureRouletteInitialOpenFiles = ["index.html"];
