import type { FileItem } from "../../../../types/file";
import type { WebLab2ValidationReviewConfig } from "../../../../types/validationReview";
import {
  parseAssessmentChecks,
  parseAssessmentGoalLabels,
  parseAssessmentGoals,
} from "../validationAssessment";
import validationStarshipLoaderAssessmentMarkdown from "./assessment.md?raw";
import indexHtml from "./files/index.html?raw";
import validationStarshipLoaderInstructionsMarkdown from "./instructions.md?raw";
import scriptJs from "./files/script.js?raw";
import stylesCss from "./files/style.css?raw";

export const validationStarshipLoaderReviewConfig: WebLab2ValidationReviewConfig = {
  mode: "technical",
  title: "Starship loader loop review",
  goals: parseAssessmentGoals(validationStarshipLoaderAssessmentMarkdown),
  goalLabels: parseAssessmentGoalLabels(validationStarshipLoaderAssessmentMarkdown),
  checks: parseAssessmentChecks(validationStarshipLoaderAssessmentMarkdown),
  minimumChangedFiles: 1,
  followUpPreference: "debug",
};

export const validationStarshipLoaderFileStructure: FileItem[] = [
  {
    name: "Starship Odyssey",
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
      {
        name: "script.js",
        type: "file",
        content: scriptJs,
      },
    ],
  },
];

export { validationStarshipLoaderInstructionsMarkdown };

export const validationStarshipLoaderInitialOpenFiles = ["script.js", "index.html"];
