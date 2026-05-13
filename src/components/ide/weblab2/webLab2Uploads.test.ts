import { describe, expect, it } from "vitest";
import type { DevPanelUploadedFile } from "../../lab2/dev";
import type { FileItem } from "../../../types/file";
import {
  buildFileTreeFromUploadedStarter,
  buildFileTreeWithUploadedFiles,
  getShareableStarterUpload,
} from "./webLab2Uploads";

function uploadedFile(
  path: string,
  content = "",
): DevPanelUploadedFile {
  return {
    name: path.split("/").at(-1) ?? path,
    path,
    type: "text/plain",
    size: content.length,
    content,
  };
}

describe("webLab2Uploads", () => {
  it("builds a starter tree and removes a shared root folder", () => {
    const tree = buildFileTreeFromUploadedStarter([
      uploadedFile("starter/index.html", "<h1>Hello</h1>"),
      uploadedFile("starter/styles/site.css", "body {}"),
    ]);

    expect(tree).toEqual([
      {
        name: "My Project",
        type: "folder",
        children: [
          {
            name: "styles",
            type: "folder",
            children: [{ name: "site.css", type: "css", content: "body {}" }],
          },
          { name: "index.html", type: "html", content: "<h1>Hello</h1>" },
        ],
      },
    ]);
  });

  it("adds project uploads to the current root and rejects duplicates", () => {
    const tree: FileItem[] = [
      {
        name: "My Project",
        type: "folder",
        children: [{ name: "index.html", type: "html", content: "" }],
      },
    ];

    expect(buildFileTreeWithUploadedFiles(tree, [uploadedFile("script.js", "console.log(1)")]))
      .toEqual([
        {
          name: "My Project",
          type: "folder",
          children: [
            { name: "index.html", type: "html", content: "" },
            { name: "script.js", type: "file", content: "console.log(1)" },
          ],
        },
      ]);
    expect(() => buildFileTreeWithUploadedFiles(tree, [uploadedFile("index.html")]))
      .toThrow("A file or folder named index.html already exists.");
  });

  it("keeps only text files in shareable starter uploads", () => {
    const upload = getShareableStarterUpload({
      uploadedAt: "2026-05-12T00:00:00.000Z",
      files: [
        uploadedFile("index.html", "<h1>Hello</h1>"),
        { ...uploadedFile("hero.png", "data:image/png;base64,abc"), type: "image/png" },
      ],
    });

    expect(upload?.files?.map((file) => file.name)).toEqual(["index.html"]);
  });
});
