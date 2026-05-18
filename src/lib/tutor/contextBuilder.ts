import type { ChatAttachment, ChatMessage } from "../../types/chat";
import type { FileItem } from "../../types/file";
import { buildLevelProgressSnapshot } from "../validation/levelProgress";
import type { TutorProjectContext, TutorProjectContextFile } from "./types";

function getAttachmentImageDataUrl(attachment: ChatAttachment) {
  const imageDataUrl = attachment.imageDataUrl ?? attachment.imageSrc;
  return imageDataUrl?.startsWith("data:image/") ? imageDataUrl : undefined;
}

function getEffectiveFileContent(file: FileItem) {
  return file.proposedStatus && file.proposedStatus !== "deleted"
    ? file.proposedContent ?? ""
    : file.content ?? "";
}

function flattenFiles(files: FileItem[], parentPath = ""): TutorProjectContextFile[] {
  return files.flatMap((item) => {
    const path = parentPath ? `${parentPath}/${item.name}` : item.name;
    if (item.children) {
      return flattenFiles(item.children, path);
    }
    if (item.proposedStatus === "deleted") {
      return [];
    }
    return [{
      fileName: item.name,
      path,
      type: item.type,
      content: getEffectiveFileContent(item),
    }];
  });
}

export function buildProjectContext(files: FileItem[]): TutorProjectContext {
  const flatFiles = flattenFiles(files).filter((file) => file.type !== "image");
  return {
    manifest: flatFiles.map(({ fileName, path, type }) => ({ fileName, path, type })),
    files: flatFiles.map(({ fileName, path, type, content }) => ({
      fileName,
      path,
      type,
      content,
    })),
  };
}

export function buildConversationContext(conversation: ChatMessage[]) {
  return conversation
    .filter((message) => !message.isAlert)
    .slice(-8)
    .map((message) => ({
      role: message.role,
      content: message.content,
      attachments: message.attachments?.map((attachment) => ({
        fileName: attachment.fileName,
        path: attachment.path,
        source: attachment.source,
        content: attachment.content,
        hasImageBytes: Boolean(getAttachmentImageDataUrl(attachment)),
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
        startLine: attachment.startLine,
        endLine: attachment.endLine,
        previewPath: attachment.previewPath,
        selector: attachment.selector,
        elementId: attachment.elementId,
        tagName: attachment.tagName,
      })),
      codeChangeStatus: message.codeChangeStatus,
      fileChanges: message.fileChanges?.map((change) => ({
        fileName: change.fileName,
        status: change.status,
      })),
      validationReview: message.validationReview
        ? buildLevelProgressSnapshot(message.validationReview) ?? {
            title: message.validationReview.title,
            mode: message.validationReview.mode,
            kind: message.validationReview.kind,
          }
        : undefined,
    }));
}

export function buildConversationImageInputs(conversation: ChatMessage[]) {
  return conversation
    .filter((message) => !message.isAlert)
    .slice(-8)
    .flatMap((message) =>
      message.attachments
        ?.map((attachment) => {
          const imageDataUrl = getAttachmentImageDataUrl(attachment);
          if (!imageDataUrl) return null;
          return {
            fileName: attachment.fileName,
            path: attachment.path,
            source: attachment.source,
            mimeType: attachment.mimeType,
            sizeBytes: attachment.sizeBytes,
            imageDataUrl,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null) ?? [],
    );
}
