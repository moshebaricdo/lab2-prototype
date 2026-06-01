import type { FileItem } from "../../../../types/file";
import indexHtml from "./files/index.html?raw";
import genericLevelInstructionsMarkdown from "./instructions.md?raw";

export const genericLevelFileStructure: FileItem[] = [
  {
    name: "My Project",
    type: "folder",
    children: [{ name: "index.html", type: "html", content: indexHtml }],
  },
];

export { genericLevelInstructionsMarkdown };
