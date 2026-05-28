import { describe, expect, it } from "vitest";
import type { ChatMessage, FileChange } from "../../../../../types/chat";
import { mergeStagedUploadImagesIntoFileChanges } from "./tutorFileChanges";

describe("mergeStagedUploadImagesIntoFileChanges", () => {
  const tutorChanges: FileChange[] = [
    { fileName: "index.html", status: "modified", linesAdded: 4, linesRemoved: 1 },
  ];

  it("prepends staged image uploads from the latest user message", () => {
    const conversation: ChatMessage[] = [
      {
        role: "user",
        content: "Use these images in the gallery",
        attachments: [
          {
            fileName: "monstera.jpg",
            path: "uploads/monstera.jpg",
            source: "upload",
            addedToProject: true,
            mimeType: "image/jpeg",
          },
          {
            fileName: "notes.txt",
            path: "uploads/notes.txt",
            source: "upload",
            addedToProject: true,
            mimeType: "text/plain",
          },
        ],
      },
    ];

    expect(mergeStagedUploadImagesIntoFileChanges(conversation, tutorChanges)).toEqual([
      { fileName: "uploads/monstera.jpg", status: "new" },
      tutorChanges[0],
    ]);
  });

  it("dedupes when Tutor already returned the upload path", () => {
    const conversation: ChatMessage[] = [
      {
        role: "user",
        content: "Use this image",
        attachments: [
          {
            fileName: "hero.png",
            path: "uploads/hero.png",
            source: "upload",
            mimeType: "image/png",
          },
        ],
      },
    ];

    expect(
      mergeStagedUploadImagesIntoFileChanges(conversation, [
        { fileName: "uploads/hero.png", status: "new" },
        ...tutorChanges,
      ]),
    ).toEqual([
      { fileName: "uploads/hero.png", status: "new" },
      tutorChanges[0],
    ]);
  });

  it("returns tutor changes unchanged when the latest user message has no uploads", () => {
    const conversation: ChatMessage[] = [
      { role: "user", content: "Make the buttons blue" },
    ];

    expect(mergeStagedUploadImagesIntoFileChanges(conversation, tutorChanges)).toBe(tutorChanges);
  });
});
