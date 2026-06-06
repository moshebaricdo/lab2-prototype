import type { FileItem } from "../../../../types/file";
import { buildValidationReviewConfig } from "../validationAssessment";
import validationLoopStylePolishAssessmentMarkdown from "./assessment.md?raw";
import indexHtml from "./files/index.html?raw";
import validationLoopStylePolishInstructionsMarkdown from "./instructions.md?raw";
import stylesCss from "./files/style.css?raw";

export const validationLoopStylePolishReviewConfig = buildValidationReviewConfig(
  validationLoopStylePolishAssessmentMarkdown,
);

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
