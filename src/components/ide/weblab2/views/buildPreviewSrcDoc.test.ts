import { describe, expect, it } from "vitest";
import type { FileItem } from "../../../../types/file";
import { buildPreviewSrcDoc } from "./buildPreviewSrcDoc";

describe("buildPreviewSrcDoc", () => {
  it("rewrites URL-encoded upload image references to data URLs", () => {
    const imageContent = "data:image/png;base64,abc123";
    const tree: FileItem[] = [
      {
        name: "index.html",
        type: "html",
        content: '<img src="uploads/Screenshot%202026-05-26.png" alt="Plant" />',
      },
      {
        name: "uploads",
        type: "folder",
        children: [
          {
            name: "Screenshot 2026-05-26.png",
            type: "image",
            content: imageContent,
          },
        ],
      },
    ];

    const srcDoc = buildPreviewSrcDoc(tree, false);

    expect(srcDoc).toContain(`src="${imageContent}"`);
    expect(srcDoc).not.toContain("uploads/Screenshot%202026-05-26.png");
  });
});
