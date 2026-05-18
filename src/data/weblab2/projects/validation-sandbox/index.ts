import type { FileItem } from "../../../../types/file";
import type { WebLab2ValidationReviewConfig } from "../../../../types/validationReview";
import {
  parseAssessmentChecks,
  parseAssessmentGoals,
} from "../validationAssessment";
import validationSandboxAssessmentMarkdown from "./assessment.md?raw";
import indexHtml from "./files/index.html?raw";
import validationSandboxInstructionsMarkdown from "./instructions.md?raw";
import scriptJs from "./files/script.js?raw";
import stylesCss from "./files/style.css?raw";

export const validationSandboxReviewConfig: WebLab2ValidationReviewConfig = {
  mode: "technical",
  title: "Starship loader loop review",
  goals: parseAssessmentGoals(validationSandboxAssessmentMarkdown),
  checks: parseAssessmentChecks(validationSandboxAssessmentMarkdown),
  minimumChangedFiles: 1,
};

export const validationSandboxFileStructure: FileItem[] = [
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

export { validationSandboxInstructionsMarkdown };
