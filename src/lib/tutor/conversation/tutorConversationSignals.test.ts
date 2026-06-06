import { describe, expect, it } from "vitest";
import type { ChatMessage } from "../../../types/chat";
import {
  lastAssistantAskedPlanningQuestion,
  lastAssistantInvitedEditableFollowUp,
  lastAssistantOfferedValidationReview,
} from "./tutorConversationSignals";

function assistant(content: string, extras: Partial<ChatMessage> = {}): ChatMessage {
  return { role: "assistant", content, ...extras };
}

describe("tutorConversationSignals", () => {
  it("detects planning questions on the last assistant turn", () => {
    const conversation: ChatMessage[] = [
      assistant("What kind of project idea do you want to build before we build?"),
    ];

    expect(lastAssistantAskedPlanningQuestion(conversation)).toBe(true);
    expect(lastAssistantOfferedValidationReview(conversation)).toBe(false);
  });

  it("detects validation review offers in assistant prose", () => {
    const conversation: ChatMessage[] = [
      assistant("When you're ready, I can check your work and let you know whether you're ready to continue."),
    ];

    expect(lastAssistantOfferedValidationReview(conversation)).toBe(true);
  });

  it("prefers edit-options cards over keyword scans for edit follow-up", () => {
    const conversation: ChatMessage[] = [
      assistant("Pick a direction.", {
        editOptions: {
          status: "pending",
          originalMessage: "make it nicer",
          options: [
            { id: "a", label: "A", enrichPrompt: "Do A" },
            { id: "b", label: "B", enrichPrompt: "Do B" },
          ],
        },
      }),
    ];

    expect(lastAssistantInvitedEditableFollowUp(conversation)).toBe(true);
  });

  it("falls back to editable artifact keywords when no card is present", () => {
    const conversation: ChatMessage[] = [
      assistant("Try adding a hover style to `.nav-link` in style.css."),
    ];

    expect(lastAssistantInvitedEditableFollowUp(conversation)).toBe(true);
  });

  it("does not treat file-change turns as editable follow-up invitations", () => {
    const conversation: ChatMessage[] = [
      assistant("I updated style.css.", {
        fileChanges: [{ fileName: "style.css", status: "modified" }],
      }),
    ];

    expect(lastAssistantInvitedEditableFollowUp(conversation)).toBe(false);
  });
});
