import type { FileItem } from "../../../../types/file";
import indexHtml from "./files/index.html?raw";
import stylesCss from "./files/styles.css?raw";

export const fileStructure: FileItem[] = [
  {
    name: "My Project",
    type: "folder",
    children: [
      { name: "index.html", type: "html", content: indexHtml },
      { name: "styles.css", type: "css", content: stylesCss },
      {
        name: "assets",
        type: "folder",
        children: [
          { name: "logo.svg", type: "text" },
          { name: "icon.png", type: "image" },
          { name: "background.jpg", type: "image" },
          { name: "script.js", type: "file" },
          { name: "config.json", type: "file" },
        ],
      },
    ],
  },
];

export const versionLabels: Record<string, string> = {
  current: "Current Version",
  aug30: "Aug 30, 1:30PM",
  aug27: "Aug 27, 1:30PM",
  "aug26-1": "Aug 26, 12:30PM",
  "aug26-2": "Aug 26, 9:30AM",
  aug24: "Aug 24, 12:30PM",
  initial: "Initial Version",
};

export { DefaultProjectPreview } from "./DefaultProjectPreview";
