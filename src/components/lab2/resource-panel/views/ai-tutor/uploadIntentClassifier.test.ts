import { describe, expect, it } from "vitest";
import type { ChatAttachment } from "../../../../../types/chat";
import type { FileItem } from "../../../../../types/file";
import { buildUploadIntentFollowUpOnSend } from "./uploadAddWorkflow";
import {
  buildFileTreeWithChatAttachments,
  getStagedUploadProjectPath,
  isStagedTutorUploadInProject,
  removeStagedTutorUploadFromTree,
  TUTOR_STAGED_UPLOADS_FOLDER,
} from "./tutorAttachmentToProject";
import {
  classifyUploadAttachments,
  isAddableUploadAttachment,
} from "./uploadIntentClassifier";

function uploadAttachment(overrides: Partial<ChatAttachment> = {}): ChatAttachment {
  return {
    fileName: "photo.png",
    path: "uploads/photo.png",
    source: "upload",
    imageSrc: "data:image/png;base64,abc",
    imageDataUrl: "data:image/png;base64,abc",
    content: "Uploaded image file: photo.png",
    mimeType: "image/png",
    ...overrides,
  };
}

const starterTree: FileItem[] = [{
  name: "My Project",
  type: "folder",
  children: [
    { name: "index.html", type: "html", content: "<html></html>" },
  ],
}];

describe("tutorAttachmentToProject", () => {
  it("stages uploads under uploads/ in the project tree", () => {
    const nextTree = buildFileTreeWithChatAttachments(starterTree, [uploadAttachment()]);
    const uploadsFolder = nextTree[0]?.children?.find(
      (item) => item.type === "folder" && item.name === TUTOR_STAGED_UPLOADS_FOLDER,
    );

    expect(uploadsFolder?.children?.some((item) => item.name === "photo.png")).toBe(true);
    expect(isStagedTutorUploadInProject(starterTree, uploadAttachment())).toBe(false);
    expect(isStagedTutorUploadInProject(nextTree, uploadAttachment())).toBe(true);
    expect(getStagedUploadProjectPath(uploadAttachment())).toBe("uploads/photo.png");
  });

  it("stages duplicate upload names using their unique composer paths", () => {
    const secondPhoto = uploadAttachment({ path: "uploads/photo (2).png" });
    const nextTree = buildFileTreeWithChatAttachments(starterTree, [
      uploadAttachment(),
      secondPhoto,
    ]);
    const uploadsFolder = nextTree[0]?.children?.find(
      (item) => item.type === "folder" && item.name === TUTOR_STAGED_UPLOADS_FOLDER,
    );

    expect(uploadsFolder?.children?.map((item) => item.name)).toEqual([
      "photo.png",
      "photo (2).png",
    ]);
    expect(getStagedUploadProjectPath(secondPhoto)).toBe("uploads/photo (2).png");
    expect(isStagedTutorUploadInProject(nextTree, secondPhoto)).toBe(true);
  });

  it("removes staged uploads when the composer attachment is removed", () => {
    const stagedTree = buildFileTreeWithChatAttachments(starterTree, [uploadAttachment()]);
    const nextTree = removeStagedTutorUploadFromTree(stagedTree, uploadAttachment());
    expect(isStagedTutorUploadInProject(nextTree, uploadAttachment())).toBe(false);
  });
});

describe("uploadIntentClassifier", () => {
  it("treats explicit use-this-photo prompts as content to add", () => {
    const result = classifyUploadAttachments(
      "Can you use this photo in my carousel?",
      [uploadAttachment()],
      new Set(),
    );

    expect(result?.intent).toBe("content-to-add");
  });

  it("rejects unsupported uploads without usable content", () => {
    expect(isAddableUploadAttachment(uploadAttachment({
      imageDataUrl: undefined,
      imageSrc: undefined,
      content: "Uploaded file: sketch.psd\nNote: This file type could not be read as text in the browser.",
    }))).toBe(false);
  });
});

describe("buildUploadIntentFollowUpOnSend", () => {
  it("stays silent for content-to-use uploads", () => {
    const followUp = buildUploadIntentFollowUpOnSend(
      "Please use this photo in my project",
      [uploadAttachment()],
      new Set(),
    );

    expect(followUp).toBeNull();
  });

  it("returns nothing for reference-only uploads", () => {
    const followUp = buildUploadIntentFollowUpOnSend(
      "Make it look like this screenshot",
      [uploadAttachment({ fileName: "screenshot.png", path: "uploads/screenshot.png" })],
      new Set(),
    );

    expect(followUp).toBeNull();
  });
});
