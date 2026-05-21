import { describe, expect, it } from "vitest";
import type { FileItem } from "../../types/file";
import {
  formatInitialOpenFilesProp,
  parseInitialOpenFilesConfig,
  resolveInitialOpenFiles,
  resolveOpenFilesForTree,
} from "./initialOpenFiles";

const sampleTree: FileItem[] = [
  {
    name: "My Project",
    type: "folder",
    children: [
      { name: "index.html", type: "html", content: "<html></html>" },
      { name: "styles.css", type: "css", content: "body {}" },
      { name: "README.md", type: "text", content: "# Notes" },
    ],
  },
];

describe("formatInitialOpenFilesProp", () => {
  it("joins array paths into newline config", () => {
    expect(formatInitialOpenFilesProp(["script.js", "style.css"])).toBe("script.js\nstyle.css");
  });

  it("returns an empty string for undefined", () => {
    expect(formatInitialOpenFilesProp(undefined)).toBe("");
  });
});

describe("parseInitialOpenFilesConfig", () => {
  it("parses one path per line and ignores comments", () => {
    expect(parseInitialOpenFilesConfig("styles.css\n# index.html\nREADME.md")).toEqual([
      "styles.css",
      "README.md",
    ]);
  });

  it("returns an empty array for non-string values", () => {
    expect(parseInitialOpenFilesConfig(undefined)).toEqual([]);
  });
});

describe("resolveInitialOpenFiles", () => {
  it("opens files in listed order and selects the first match", () => {
    const result = resolveInitialOpenFiles(sampleTree, ["README.md", "styles.css"]);

    expect(result.openFiles.map((file) => file.name)).toEqual(["README.md", "styles.css"]);
    expect(result.selectedFile?.name).toBe("README.md");
  });

  it("matches nested paths and basenames", () => {
    const result = resolveInitialOpenFiles(sampleTree, ["My Project/index.html"]);

    expect(result.openFiles.map((file) => file.name)).toEqual(["index.html"]);
  });

  it("skips unknown paths without failing the rest", () => {
    const result = resolveInitialOpenFiles(sampleTree, ["missing.py", "styles.css"]);

    expect(result.openFiles.map((file) => file.name)).toEqual(["styles.css"]);
  });
});

describe("resolveOpenFilesForTree", () => {
  it("falls back when the configured paths do not resolve", () => {
    const fallback = { name: "fallback.py", type: "python", content: "print('hi')" } satisfies FileItem;
    const result = resolveOpenFilesForTree(sampleTree, {
      initialOpenFilePaths: ["missing.py"],
      fallback: () => fallback,
    });

    expect(result.openFiles).toEqual([fallback]);
    expect(result.selectedFile).toBe(fallback);
  });
});
