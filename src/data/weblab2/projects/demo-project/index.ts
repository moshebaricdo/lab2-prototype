import type { FileItem } from "../../../../types/file";
import indexHtml from "./files/index.html?raw";
import stylesCss from "./files/styles.css?raw";
import mainJs from "./files/main.js?raw";

export const demoFileStructure: FileItem[] = [
  {
    name: "Stellar Atlas",
    type: "folder",
    children: [
      {
        name: "index.html",
        type: "html",
        content: indexHtml,
      },
      {
        name: "styles.css",
        type: "css",
        content: stylesCss,
      },
      {
        name: "main.js",
        type: "file",
        content: mainJs,
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
