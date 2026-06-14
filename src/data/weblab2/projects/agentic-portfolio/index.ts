import type { FileItem } from "../../../../types/file";
import gallerySpecMarkdown from "./files/gallery-spec.md?raw";
import indexAccessibleHtml from "./files/index.accessible.html?raw";
import indexHtml from "./files/index.html?raw";
import scriptJs from "./files/script.js?raw";
import stylesCss from "./files/styles.css?raw";
import styledGalleryCss from "./files/styles.styled.css?raw";

export const AGENTIC_PORTFOLIO_ROOT_NAME = "My Portfolio";

const portfolioFiles: FileItem[] = [
  { name: "index.html", type: "html", content: indexHtml },
  { name: "styles.css", type: "css", content: stylesCss },
  { name: "script.js", type: "file", content: scriptJs },
];

/** Starter tree for agentic progression levels 1–4. */
export const agenticPortfolioFileStructure: FileItem[] = [
  {
    name: AGENTIC_PORTFOLIO_ROOT_NAME,
    type: "folder",
    children: portfolioFiles,
  },
];

/** Same portfolio with Specs/SPEC.md — used by Mission Control briefcase paths. */
export const agenticPortfolioWithSpecFileStructure: FileItem[] = [
  {
    name: AGENTIC_PORTFOLIO_ROOT_NAME,
    type: "folder",
    children: [
      ...portfolioFiles,
      {
        name: "Specs",
        type: "folder",
        children: [{ name: "SPEC.md", type: "text", content: gallerySpecMarkdown }],
      },
    ],
  },
];

export { gallerySpecMarkdown, indexAccessibleHtml as accessibleIndexHtml, styledGalleryCss };

/** @deprecated Use AGENTIC_PORTFOLIO_ROOT_NAME */
export const PROJECT_ROOT_NAME = AGENTIC_PORTFOLIO_ROOT_NAME;
