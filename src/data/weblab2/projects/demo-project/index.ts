import type { FileItem } from "../../../../types/file";
import indexHtml from "./files/index.html?raw";
import indexHtmlProposed from "./files/index.proposed.html?raw";
import styleCss from "./files/style.css?raw";
import styleCssProposed from "./files/style.proposed.css?raw";
import factsHtml from "./files/facts.html?raw";

export const demoFileStructure: FileItem[] = [
  {
    name: "Stellar Atlas",
    type: "folder",
    children: [
      {
        name: "index.html",
        type: "html",
        content: indexHtml,
        proposedContent: indexHtmlProposed,
      },
      {
        name: "style.css",
        type: "css",
        content: styleCss,
        proposedContent: styleCssProposed,
      },
      { name: "facts.html", type: "html", content: factsHtml },
      {
        name: "images",
        type: "folder",
        children: [
          { name: "nebula-bg.jpg", type: "image" },
          { name: "earth-closeup.png", type: "image" },
          { name: "saturn-rings.png", type: "image" },
        ],
      },
    ],
  },
];

export {
  demoChatMessages,
  demoPrefilledInput,
  demoPendingAiResponse,
  demoProjectMockTutor,
} from "./chat";
export { demoRubrics } from "./rubrics";
export { DemoProjectPreview } from "./preview";
