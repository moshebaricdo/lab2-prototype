import type { BackpackItem } from "../../types/backpack";

/** Demo backpack items for filter experiment progressions (mixed labs + file types). */
export const BACKPACK_FILTER_EXPERIMENT_DEMO_ITEMS: BackpackItem[] = [
  {
    id: "backpack-filter-demo-index-html",
    name: "index.html",
    savedAt: "2026-06-01T12:00:00.000Z",
    content: "<!DOCTYPE html><html><body><h1>Portfolio home</h1></body></html>",
    fileKind: "html",
    sourceLab: "weblab2",
  },
  {
    id: "backpack-filter-demo-style-css",
    name: "style.css",
    savedAt: "2026-06-01T12:05:00.000Z",
    content: "body { font-family: system-ui, sans-serif; }",
    fileKind: "css",
    sourceLab: "weblab2",
  },
  {
    id: "backpack-filter-demo-main-py",
    name: "main.py",
    savedAt: "2026-06-02T09:00:00.000Z",
    content: "print('Hello from Python Lab')",
    fileKind: "python",
    sourceLab: "pythonlab",
  },
  {
    id: "backpack-filter-demo-notes-txt",
    name: "notes.txt",
    savedAt: "2026-06-02T09:30:00.000Z",
    content: "Remember to cite your sources.",
    fileKind: "text",
    sourceLab: "generic",
  },
  {
    id: "backpack-filter-demo-sketch-png",
    name: "wireframe.png",
    savedAt: "2026-06-03T14:00:00.000Z",
    content: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2ZQAAAAASUVORK5CYII=",
    fileKind: "image",
    sourceLab: "sketch-lab",
    thumbnailSrc:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2ZQAAAAASUVORK5CYII=",
  },
];

export const BACKPACK_FILTER_EXPERIMENT_INSTRUCTIONS = `# Backpack filtering experiments

Open the **Backpack** tab in the resource panel.

This progression compares four ways to browse saved files from multiple labs. Some files work in Web Lab (HTML, CSS, images) and some do not (for example \`.py\`).

Save additional files from the file manager if you want to test with your own mix. Demo files are added automatically when your backpack is empty.
`;
