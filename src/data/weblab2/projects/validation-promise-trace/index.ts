import type { FileItem } from "../../../../types/file";
import { buildValidationReviewConfig } from "../validationAssessment";
import validationPromiseTraceAssessmentMarkdown from "./assessment.md?raw";
import indexHtml from "./files/index.html?raw";
import validationPromiseTraceInstructionsMarkdown from "./instructions.md?raw";
import scriptJs from "./files/script.js?raw";
import stylesCss from "./files/style.css?raw";

export const validationPromiseTraceReviewConfig = buildValidationReviewConfig(
  validationPromiseTraceAssessmentMarkdown,
);

export const validationPromiseTraceFileStructure: FileItem[] = [
  {
    name: "Promise Trace Tool",
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

export { validationPromiseTraceInstructionsMarkdown };

export const validationPromiseTraceInitialOpenFiles = ["script.js", "index.html"];
