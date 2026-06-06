import type { FileItem } from "../../../../types/file";
import { buildValidationReviewConfig } from "../validationAssessment";
import featureRouletteAssessmentMarkdown from "./assessment.md?raw";
import indexHtml from "./files/index.html?raw";
import styleCss from "./files/style.css?raw";
import featureRouletteInstructionsMarkdown from "./instructions.md?raw";

export const featureRouletteReviewConfig = buildValidationReviewConfig(
  featureRouletteAssessmentMarkdown,
);

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
