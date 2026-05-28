import type { ChatAttachment, ChatMessage, FileChange } from "../../../../../types/chat";
import { normalizeFileLookupPath } from "../../../../../utils/fileTree";
import { getStagedUploadProjectPath } from "./tutorAttachmentToProject";

const IMAGE_EXTENSIONS = new Set([
  "bmp",
  "gif",
  "ico",
  "jpeg",
  "jpg",
  "png",
  "svg",
  "webp",
]);

function fileChangeLookupKey(fileName: string) {
  return normalizeFileLookupPath(fileName);
}

function isStagedImageUpload(attachment: ChatAttachment) {
  if (attachment.source !== "upload") return false;
  if (attachment.mimeType?.startsWith("image/")) return true;
  const dot = attachment.fileName.lastIndexOf(".");
  const extension = dot >= 0 ? attachment.fileName.slice(dot + 1).toLowerCase() : "";
  return IMAGE_EXTENSIONS.has(extension);
}

/**
 * When a send-with-uploads turn produces a code edit proposal, surface staged
 * image uploads in the Files modified card as new files alongside Tutor edits.
 */
export function mergeStagedUploadImagesIntoFileChanges(
  conversation: ChatMessage[],
  tutorFileChanges: FileChange[],
): FileChange[] {
  const lastUserMessage = [...conversation].reverse().find((message) => message.role === "user");
  if (!lastUserMessage?.attachments?.length) return tutorFileChanges;

  const existingKeys = new Set(
    tutorFileChanges.map((change) => fileChangeLookupKey(change.fileName)),
  );

  const uploadChanges: FileChange[] = [];
  for (const attachment of lastUserMessage.attachments) {
    if (!isStagedImageUpload(attachment)) continue;

    const fileName = getStagedUploadProjectPath(attachment);
    const key = fileChangeLookupKey(fileName);
    if (existingKeys.has(key)) continue;

    existingKeys.add(key);
    uploadChanges.push({ fileName, status: "new" });
  }

  if (uploadChanges.length === 0) return tutorFileChanges;
  return [...uploadChanges, ...tutorFileChanges];
}
