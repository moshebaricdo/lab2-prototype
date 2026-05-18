import type { FileItem } from "../../../../types/file";
import type { WebLab2ValidationReviewConfig } from "../../../../types/validationReview";
import {
  parseAssessmentChecks,
  parseAssessmentGoals,
} from "../validationAssessment";
import validationTestAssessmentMarkdown from "./assessment.md?raw";
import photo1Url from "./files/6ecdd334-d9e8-4425-9468-2976df16571f.png?inline";
import photo2Url from "./files/8435cb23-6c4c-4306-b3a5-c704a344407a.png?inline";
import indexHtml from "./files/index.html?raw";
import validationTestInstructionsMarkdown from "./instructions.md?raw";
import scriptJs from "./files/script.js?raw";
import stylesCss from "./files/style.css?raw";

export const validationTestFileStructure: FileItem[] = [
  {
    name: "Button Fix",
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
      {
        name: "photo1.png",
        type: "image",
        content: photo1Url,
      },
      {
        name: "photo2.png",
        type: "image",
        content: photo2Url,
      },
    ],
  },
];

export { validationTestInstructionsMarkdown };

export const validationTestReviewConfig: WebLab2ValidationReviewConfig = {
  mode: "technical",
  title: "Photo carousel bug review",
  goals: parseAssessmentGoals(validationTestAssessmentMarkdown),
  checks: parseAssessmentChecks(validationTestAssessmentMarkdown),
  minimumChangedFiles: 1,
};
