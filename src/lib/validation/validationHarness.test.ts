import { describe, expect, it } from "vitest";
import type { FileItem } from "../../types/file";
import type { WebLab2ValidationReviewConfig } from "../../types/validationReview";
import { featureRouletteReviewConfig } from "../../data/weblab2/projects/feature-roulette";
import {
  buildChecklistItems,
  buildValidationReviewEvidence,
  buildVersionHistoryValidationSummary,
  createValidationReview,
  getValidationReviewSummaryStatus,
} from "./validationHarness";

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
  goals: ["The student makes at least one intentional refinement beyond the starter styles."],
  goalLabels: ["Make one intentional style refinement"],
};

describe("version history goal evaluation", () => {
  const starter: FileItem[] = [
    { name: "index.html", type: "html", content: "<body></body>" },
  ];
  const feature: FileItem[] = [
    { name: "index.html", type: "html", content: "<body><header>Nav</header></body>" },
  ];

  it("evaluates save and revert assessment goals from snapshots", () => {
    const summary = buildVersionHistoryValidationSummary(
      [
        { kind: "initial", fileStructure: starter },
        { kind: "manual", description: "Added navigation", fileStructure: feature },
      ],
      feature,
    );
    const evidence = buildValidationReviewEvidence({
      currentFileStructure: feature,
      initialFileStructure: starter,
      chatMessages: [{ role: "user", content: "I added nav" }],
    });

    const items = buildChecklistItems({
      config: featureRouletteReviewConfig,
      profile: { effortPolicy: "required" },
      evidence,
      versionHistorySummary: summary,
    });

    expect(items).toHaveLength(3);
    expect(items[0]?.label).toBe("Create a new feature");
    expect(items[1]?.status).toBe("pass");
    expect(items[1]?.label).toBe("Save with a comment");
    expect(items[2]?.status).toBe("pass");
    expect(items[2]?.label).toBe("Revert as needed");
  });
});

describe("createValidationReview", () => {
  it("does not complete an open-ended level when starter code already satisfies checks but no iteration happened", () => {
    const review = createValidationReview({
      config: openEndedConfig,
      currentFileStructure: starterFiles,
      initialFileStructure: starterFiles,
      chatMessages: [],
    });

    expect(review.status).toBe("needs_work");
    expect(review.items).toHaveLength(1);
    expect(review.items?.[0]).toEqual(expect.objectContaining({
      id: "requirement-0",
      label: "Make one intentional style refinement",
      status: "missing",
      detail: expect.stringContaining("own refinement"),
    }));
  });

  it("keeps open-ended fallback in progress once iteration evidence is present but AI review is unavailable", () => {
    const review = createValidationReview({
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

    expect(review.status).toBe("in_progress");
    expect(review.items).toHaveLength(1);
    expect(review.items?.[0]).toEqual(expect.objectContaining({
      id: "requirement-0",
      label: "Make one intentional style refinement",
      status: "warn",
    }));
  });

  it("does not apply effort gating to technical levels", () => {
    const review = createValidationReview({
      config: {
        goals: ["Clicking Next hides the first photo and shows the next #photo2 image."],
        goalLabels: ["Fix the Next button"],
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

    expect(review.status).toBe("in_progress");
    expect(review.items?.some((item) => item.id === "workspace-progress")).toBe(false);
    expect(review.items?.[0]?.status).toBe("warn");
  });

  it("derives review title from instructions when provided", () => {
    const review = createValidationReview({
      config: {
        goals: ["The selector is fixed."],
      },
      instructionsMarkdown: "# Do This\n\nFix the button.",
      currentFileStructure: starterFiles,
      initialFileStructure: starterFiles,
      chatMessages: [],
    });

    expect(review.title).toBe("Do This review");
  });

  it("lists only assessment goals on the review card requirements", () => {
    const review = createValidationReview({
      config: featureRouletteReviewConfig,
      currentFileStructure: starterFiles,
      initialFileStructure: starterFiles,
      chatMessages: [],
    });

    expect(review.requirements).toHaveLength(3);
    expect(review.items).toHaveLength(3);
    expect(review.items?.map((item) => item.label)).toEqual([
      "Create a new feature",
      "Save with a comment",
      "Revert as needed",
    ]);
  });

  it("does not treat advisory warnings as complete", () => {
    const summary = getValidationReviewSummaryStatus([
      {
        id: "requirement-0",
        label: "Label and explain each step",
        status: "warn",
        detail: "The labels are present, but the explanation is incomplete.",
      },
      {
        id: "requirement-1",
        label: "Save with a comment",
        status: "pass",
        detail: "Saved.",
      },
    ]);

    expect(summary.status).toBe("in_progress");
  });
});
