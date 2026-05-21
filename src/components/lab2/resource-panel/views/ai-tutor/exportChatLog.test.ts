import { describe, expect, it } from "vitest";
import type { ChatMessage } from "../../../../../types/chat";
import { formatChatLogTranscript } from "./exportChatLog";

describe("formatChatLogTranscript", () => {
  it("labels user and AI messages and separates blocks", () => {
    const messages: ChatMessage[] = [
      { role: "user", content: "How do I center a div?" },
      { role: "assistant", content: "Use flexbox or margin auto." },
    ];

    expect(formatChatLogTranscript(messages)).toBe(
      [
        "[User]",
        "How do I center a div?",
        "",
        "[AI]",
        "Use flexbox or margin auto.",
      ].join("\n"),
    );
  });

  it("includes attachment and validation metadata", () => {
    const messages: ChatMessage[] = [
      {
        role: "user",
        content: "Please review this.",
        attachments: [{ fileName: "index.html", path: "index.html" }],
      },
      {
        role: "assistant",
        content: "Looks good so far.",
        validationReview: {
          kind: "summary",
          title: "Progress check",
          mode: "technical",
          items: [
            { id: "1", label: "Has a title", status: "pass", detail: "Found h1" },
          ],
        },
      },
    ];

    const transcript = formatChatLogTranscript(messages);

    expect(transcript).toContain("[User]");
    expect(transcript).toContain("Attachments: index.html");
    expect(transcript).toContain("[AI]");
    expect(transcript).toContain("Validation review (summary: Progress check");
    expect(transcript).toContain("Has a title (pass)");
  });
});
