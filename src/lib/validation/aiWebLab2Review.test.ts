import { afterEach, describe, expect, it, vi } from "vitest";
import type { FileItem } from "../../types/file";
import type { WebLab2ValidationReviewConfig } from "../../types/validationReview";
import { createAiWebLab2ValidationReview } from "./aiWebLab2Review";

vi.mock("../../hooks/useTutorApiSettings", () => ({
  getTutorApiKey: () => "test-key",
  getTutorCodeModel: () => "test-model",
}));

const fileStructure: FileItem[] = [
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

const config: WebLab2ValidationReviewConfig = {
  goals: ["The student makes at least one intentional refinement beyond the starter styles."],
  goalLabels: ["Make one intentional style refinement"],
};

describe("createAiWebLab2ValidationReview", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("post-processes AI-complete responses with required effort evidence", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                status: "likely_complete",
                confidence: "high",
                headline: "Everything looks complete.",
                summaryMessage: "Your hover styles show real experimentation — you're good to continue.",
                items: [
                  {
                    label: "Interactive styles are polished.",
                    status: "pass",
                    detail: "Evidence found.",
                  },
                ],
              }),
            },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const review = await createAiWebLab2ValidationReview({
      config,
      currentFileStructure: fileStructure,
      initialFileStructure: fileStructure,
      chatMessages: [],
    });

    expect(review?.status).toBe("needs_work");
    expect(review?.items).toHaveLength(1);
    expect(review?.items?.[0]).toEqual(expect.objectContaining({
      id: "requirement-0",
      label: "Make one intentional style refinement",
      status: "missing",
      detail: expect.stringContaining("own refinement"),
    }));
    expect(review?.summaryMessage).toBe(
      "Your hover styles show real experimentation — you're good to continue.",
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.objectContaining({
        body: expect.stringContaining("changedFileCount"),
      }),
    );
  });
});
