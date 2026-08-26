import type { BackpackItem } from "../../types/backpack";

/** 1×1 PNG used as a stand-in image payload + thumbnail. */
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2ZQAAAAASUVORK5CYII=";

/** 1×1 JPEG used so the type filter can distinguish .jpg from .png. */
const TINY_JPEG =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGf/9k=";

/** Demo ids removed from the seed (svg / pptx / extensionless). Pruned on ensure. */
export const CROSS_LAB_BACKPACK_RETIRED_SEED_IDS = [
  "backpack-cross-lab-logo-svg",
  "backpack-cross-lab-pitch-pptx",
  "backpack-cross-lab-license",
];

/**
 * Shared backpack fixture for the cross-lab backpack progression.
 * Covers allow-list, unsupported, and type-dropdown cases across Web Lab 2,
 * Python, Sketch, and AI Chat.
 */
export const CROSS_LAB_BACKPACK_SEED_ITEMS: BackpackItem[] = [
  {
    id: "backpack-cross-lab-portfolio-html",
    name: "portfolio.html",
    savedAt: "2026-08-01T10:00:00.000Z",
    content: "<!DOCTYPE html><html><body><h1>Portfolio</h1></body></html>",
    fileKind: "html",
    sourceLab: "weblab2",
  },
  {
    id: "backpack-cross-lab-theme-css",
    name: "theme.css",
    savedAt: "2026-08-01T10:05:00.000Z",
    content: "body { font-family: system-ui, sans-serif; }",
    fileKind: "css",
    sourceLab: "weblab2",
  },
  {
    id: "backpack-cross-lab-app-js",
    name: "app.js",
    savedAt: "2026-08-01T10:10:00.000Z",
    content: "console.log('Hello from Web Lab');",
    fileKind: "file",
    sourceLab: "weblab2",
  },
  {
    id: "backpack-cross-lab-config-json",
    name: "config.json",
    savedAt: "2026-08-01T10:15:00.000Z",
    content: '{"theme":"dark","title":"Demo"}',
    fileKind: "file",
    sourceLab: "weblab2",
  },
  {
    id: "backpack-cross-lab-greet-py",
    name: "greet.py",
    savedAt: "2026-08-02T09:00:00.000Z",
    content: "def greet(name):\n    return f'Hello, {name}!'\n\nprint(greet('Python Lab'))\n",
    fileKind: "python",
    sourceLab: "pythonlab",
  },
  {
    id: "backpack-cross-lab-scratch-txt",
    name: "scratch-notes.txt",
    savedAt: "2026-08-02T09:15:00.000Z",
    content: "Ideas to try: cite sources, add a title, keep files small.",
    fileKind: "text",
    sourceLab: "generic",
  },
  {
    id: "backpack-cross-lab-lab-notes-md",
    name: "lab-notes.md",
    savedAt: "2026-08-02T09:20:00.000Z",
    content: "# Lab notes\n\nThis markdown file imports into Web Lab and Python Lab.",
    fileKind: "text",
    sourceLab: "generic",
  },
  {
    id: "backpack-cross-lab-attendance-csv",
    name: "attendance.csv",
    savedAt: "2026-08-02T09:25:00.000Z",
    content: "name,present\nAda,yes\nGrace,yes\n",
    fileKind: "text",
    sourceLab: "pythonlab",
  },
  {
    id: "backpack-cross-lab-wireframe-png",
    name: "wireframe.png",
    savedAt: "2026-08-03T14:00:00.000Z",
    content: TINY_PNG,
    fileKind: "image",
    sourceLab: "sketch-lab",
    thumbnailSrc: TINY_PNG,
  },
  {
    id: "backpack-cross-lab-hero-jpg",
    name: "hero.jpg",
    savedAt: "2026-08-03T14:10:00.000Z",
    content: TINY_JPEG,
    fileKind: "image",
    sourceLab: "sketch-lab",
    thumbnailSrc: TINY_JPEG,
  },
  {
    id: "backpack-cross-lab-rubric-pdf",
    name: "rubric.pdf",
    savedAt: "2026-08-04T11:00:00.000Z",
    content: "%PDF-1.1 demo rubric payload — not a real PDF.",
    fileKind: "file",
    sourceLab: "generic",
  },
];

export const CROSS_LAB_BACKPACK_INSTRUCTIONS = `# Cross-lab backpack

Open the **Backpack** tab. The same seed files are present on every level of this progression.

Use the **File type** dropdown to filter by extension. Files this lab cannot import stay visible at the bottom under **Not supported in this lab**, with **+** disabled.

| File | Web Lab | Python | Sketch | AI Chat |
| --- | --- | --- | --- | --- |
| Images (\`.png\` \`.jpg\`) | Add | No | Add | Add |
| \`.html\` \`.css\` \`.js\` \`.json\` | Add | No | No | Add |
| \`.py\` | No | Add | No | Add |
| \`.txt\` \`.md\` \`.csv\` | Add | Add | No | Add |
| \`.pdf\` | No | No | No | Add |

Continue to see how the same backpack looks in the next lab.
`;

export function crossLabBackpackInstructionsForLab(
  labLabel: string,
  supportedSummary: string,
): string {
  return `${CROSS_LAB_BACKPACK_INSTRUCTIONS}

## This level: ${labLabel}

${supportedSummary}
`;
}
