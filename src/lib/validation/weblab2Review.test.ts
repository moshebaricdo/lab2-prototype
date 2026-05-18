import { describe, expect, it } from "vitest";
import type { FileItem } from "../../types/file";
import type { WebLab2ValidationReviewConfig } from "../../types/validationReview";
import { createWebLab2ValidationReview } from "./weblab2Review";

const starterFiles: FileItem[] = [
  {
    name: "Loop",
    type: "folder",
    children: [
      {
        name: "style.css",
        type: "css",
        content: "a:focus-visible { outline: 3px solid blue; }",
      },
    ],
  },
];

const openEndedConfig: WebLab2ValidationReviewConfig = {
  mode: "open-ended",
  title: "Loop style polish review",
  goals: ["Interactive styles are polished."],
  effortPolicy: "required",
  minimumChangedFiles: 1,
  checks: [
    {
      id: "focus-visible",
      label: "Interactive elements have a strong focus style",
      targetFile: "style.css",
      matcher: { type: "includes", value: ":focus-visible" },
      passDetail: "Focus style exists.",
      failDetail: "Add a focus style.",
    },
  ],
};

describe("createWebLab2ValidationReview", () => {
  it("does not complete an open-ended level when starter code already satisfies checks but no iteration happened", () => {
    const review = createWebLab2ValidationReview({
      config: openEndedConfig,
      currentFileStructure: starterFiles,
      initialFileStructure: starterFiles,
      chatMessages: [],
    });

    expect(review.status).toBe("needs_work");
    expect(review.items).toHaveLength(1);
    expect(review.items?.[0]).toEqual(expect.objectContaining({
      id: "focus-visible",
      status: "missing",
      detail: expect.stringContaining("own refinement"),
    }));
  });

  it("completes an open-ended level once required iteration evidence is present", () => {
    const review = createWebLab2ValidationReview({
      config: openEndedConfig,
      currentFileStructure: [
        {
          ...starterFiles[0],
          children: [
            {
              name: "style.css",
              type: "css",
              content: "a:focus-visible { outline: 4px solid blue; }",
            },
          ],
        },
      ],
      initialFileStructure: starterFiles,
      chatMessages: [],
    });

    expect(review.status).toBe("likely_complete");
    expect(review.items).toHaveLength(1);
    expect(review.items?.[0]).toEqual(expect.objectContaining({
      id: "focus-visible",
      status: "pass",
    }));
  });

  it("does not apply effort gating to technical levels", () => {
    const review = createWebLab2ValidationReview({
      config: {
        mode: "technical",
        title: "Technical fix review",
        goals: ["The selector is fixed."],
        checks: [
          {
            id: "selector",
            label: "The selector targets the correct element",
            targetFile: "script.js",
            matcher: { type: "includes", value: "#photo2" },
            passDetail: "Selector is fixed.",
            failDetail: "Selector still needs work.",
          },
        ],
      },
      currentFileStructure: [
        {
          name: "Carousel",
          type: "folder",
          children: [
            {
              name: "script.js",
              type: "file",
              content: "document.querySelector('#photo2')",
            },
          ],
        },
      ],
      initialFileStructure: [
        {
          name: "Carousel",
          type: "folder",
          children: [
            {
              name: "script.js",
              type: "file",
              content: "document.querySelector('#photo2')",
            },
          ],
        },
      ],
      chatMessages: [],
    });

    expect(review.status).toBe("likely_complete");
    expect(review.items?.some((item) => item.id === "workspace-progress")).toBe(false);
  });
});
