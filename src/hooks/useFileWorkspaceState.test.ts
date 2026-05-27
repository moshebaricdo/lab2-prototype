import { describe, expect, it } from "vitest";
import type { FileItem } from "../types/file";
import { getRootFolderName } from "./useFileWorkspaceState";

describe("getRootFolderName", () => {
  it("does not treat tutor-staged uploads as the project root", () => {
    const uploadsOnlyTree: FileItem[] = [
      {
        name: "uploads",
        type: "folder",
        children: [{ name: "photo.png", type: "image", content: "data:image/png;base64,abc" }],
      },
    ];

    expect(getRootFolderName(uploadsOnlyTree)).toBe("My Project");
  });

  it("still detects real single-folder project roots", () => {
    expect(getRootFolderName([
      {
        name: "Plant Shop",
        type: "folder",
        children: [{ name: "index.html", type: "html", content: "<h1>Plants</h1>" }],
      },
    ])).toBe("Plant Shop");
  });
});
