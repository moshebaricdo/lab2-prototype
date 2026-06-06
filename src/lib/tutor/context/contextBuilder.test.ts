import { describe, expect, it } from "vitest";
import { buildConversationContext } from "./contextBuilder";
import type { ChatMessage } from "../../../types/chat";

describe("buildConversationContext", () => {
  it("includes compact validation review progress", () => {
    const conversation: ChatMessage[] = [{
      role: "assistant",
      content: "Nice, the first step is complete. Next up: add Back.",
      validationReview: {
        kind: "summary",
        title: "Photo carousel review",
        mode: "technical",
        status: "in_progress",
        items: [
          {
            id: "next-button",
            label: "Clicking Next shows the second photo.",
            status: "pass",
            detail: "Next works.",
          },
          {
            id: "back-button",
            label: "The student adds a functional Back button.",
            status: "missing",
            detail: "Back is not implemented yet.",
          },
        ],
      },
    }];

    expect(buildConversationContext(conversation)).toEqual([
      expect.objectContaining({
        validationReview: expect.objectContaining({
          phase: "partially_complete",
          passedCriteria: [
            expect.objectContaining({ id: "next-button" }),
          ],
          nextIncompleteCriterion: expect.objectContaining({
            id: "back-button",
          }),
        }),
      }),
    ]);
  });
});
