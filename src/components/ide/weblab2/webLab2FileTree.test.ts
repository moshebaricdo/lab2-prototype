import { describe, expect, it } from "vitest";
import type { FileItem } from "../../../types/file";
import {
  filterTutorStagedUploadsFromWorkspaceTree,
  getInitialInlineImageContentMap,
  hasNonPlanProjectFiles,
  hasWorkspaceProjectFiles,
  hydrateInlineImageContent,
  isPlanFilePath,
  mergeTutorStagedUploadsIntoWorkspaceTree,
  stripInitialInlineImageContent,
} from "./webLab2FileTree";

describe("webLab2FileTree", () => {
  it("detects plan files only inside a Plans folder", () => {
    expect(isPlanFilePath("My Project/Plans/PROJECT_PLAN.md")).toBe(true);
    expect(isPlanFilePath("Plans/PROJECT_PLAN.md")).toBe(true);
    expect(isPlanFilePath("My Project/notes.md")).toBe(false);
    expect(isPlanFilePath("PROJECT_PLAN.md")).toBe(false);
  });

  it("ignores tutor-staged uploads when checking for workspace project files", () => {
    const uploadsOnlyTree: FileItem[] = [
      {
        name: "uploads",
        type: "folder",
        children: [{ name: "photo.png", type: "image", content: "data:image/png;base64,abc" }],
      },
    ];
    const wrappedUploadsTree: FileItem[] = [
      {
        name: "My Project",
        type: "folder",
        children: uploadsOnlyTree,
      },
    ];
    const projectTree: FileItem[] = [
      ...uploadsOnlyTree,
      { name: "index.html", type: "html", content: "<h1>Hello</h1>" },
    ];

    expect(filterTutorStagedUploadsFromWorkspaceTree([])).toEqual([]);
    expect(filterTutorStagedUploadsFromWorkspaceTree(uploadsOnlyTree)).toEqual([]);
    expect(filterTutorStagedUploadsFromWorkspaceTree(wrappedUploadsTree)).toEqual([
      { name: "My Project", type: "folder", children: [] },
    ]);
    expect(filterTutorStagedUploadsFromWorkspaceTree(projectTree)).toEqual([
      { name: "index.html", type: "html", content: "<h1>Hello</h1>" },
    ]);

    expect(hasWorkspaceProjectFiles([])).toBe(false);
    expect(hasWorkspaceProjectFiles(uploadsOnlyTree)).toBe(false);
    expect(hasWorkspaceProjectFiles(wrappedUploadsTree)).toBe(false);
    expect(hasWorkspaceProjectFiles(projectTree)).toBe(true);
  });

  it("merges current tutor uploads into version-history trees", () => {
    const historicalTree: FileItem[] = [
      { name: "index.html", type: "html", content: "<h1>Old version</h1>" },
    ];
    const currentTreeWithUploads: FileItem[] = [
      { name: "index.html", type: "html", content: "<h1>Current version</h1>" },
      {
        name: "uploads",
        type: "folder",
        children: [{ name: "photo.png", type: "image", content: "data:image/png;base64,abc" }],
      },
    ];

    expect(
      mergeTutorStagedUploadsIntoWorkspaceTree(historicalTree, currentTreeWithUploads),
    ).toEqual([
      { name: "index.html", type: "html", content: "<h1>Old version</h1>" },
      {
        name: "uploads",
        type: "folder",
        children: [{ name: "photo.png", type: "image", content: "data:image/png;base64,abc" }],
      },
    ]);
  });

  it("distinguishes plan-only projects from runnable project files", () => {
    const planOnlyTree: FileItem[] = [
      {
        name: "Plans",
        type: "folder",
        children: [{ name: "PROJECT_PLAN.md", type: "text", content: "Status: Draft" }],
      },
    ];
    const projectTree: FileItem[] = [
      ...planOnlyTree,
      { name: "index.html", type: "html", content: "<h1>Hello</h1>" },
    ];

    expect(hasNonPlanProjectFiles(planOnlyTree)).toBe(false);
    expect(hasNonPlanProjectFiles(projectTree)).toBe(true);
  });

  it("strips fixture image payloads and hydrates them back by path", () => {
    const imageContent = "data:image/png;base64,abc123";
    const tree: FileItem[] = [
      {
        name: "My Project",
        type: "folder",
        children: [
          {
            name: "assets",
            type: "folder",
            children: [
              {
                name: "hero.png",
                type: "image",
                content: imageContent,
                proposedContent: "new-content",
                proposedStatus: "modified",
              },
            ],
          },
        ],
      },
    ];

    const contentMap = getInitialInlineImageContentMap(tree);
    const strippedTree = stripInitialInlineImageContent(tree, contentMap);
    const strippedImage = strippedTree[0]?.children?.[0]?.children?.[0];

    expect(strippedImage?.content).toBeUndefined();
    expect(strippedImage?.proposedContent).toBeUndefined();
    expect(strippedImage?.proposedStatus).toBeUndefined();

    const hydratedTree = hydrateInlineImageContent(strippedTree, contentMap);
    expect(hydratedTree[0]?.children?.[0]?.children?.[0]?.content).toBe(imageContent);
  });
});
