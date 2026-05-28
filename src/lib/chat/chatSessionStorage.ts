import type { ChatAttachment, ChatMessage } from "../../types/chat";
import { normalizeFileLookupPath, pathBasename } from "../../utils/fileTree";

function isDisplayableImageSrc(value: string) {
  return value.startsWith("data:") || value.startsWith("blob:");
}

function resolveUploadAttachmentImageSrc(
  attachment: ChatAttachment,
  imageContentByPath: Map<string, string>,
): string | undefined {
  const normalizedPath = normalizeFileLookupPath(attachment.path);
  const candidates = [
    normalizedPath,
    attachment.path,
    attachment.fileName,
    pathBasename(normalizedPath),
  ];

  for (const key of candidates) {
    const content = imageContentByPath.get(key);
    if (content && isDisplayableImageSrc(content)) {
      return content;
    }
  }

  return undefined;
}

/** Restore upload chip thumbnails from project file bytes after sessionStorage reload. */
export function hydrateChatMessageUploadImages(
  messages: ChatMessage[],
  imageContentByPath: Map<string, string>,
): ChatMessage[] {
  if (imageContentByPath.size === 0) return messages;

  let hasChanges = false;
  const nextMessages = messages.map((message) => {
    if (!message.attachments?.length) return message;

    let messageChanged = false;
    const attachments = message.attachments.map((attachment) => {
      if (attachment.source !== "upload") return attachment;

      const imageSrc = resolveUploadAttachmentImageSrc(attachment, imageContentByPath);
      if (!imageSrc || attachment.imageSrc === imageSrc) return attachment;

      messageChanged = true;
      return { ...attachment, imageSrc };
    });

    if (!messageChanged) return message;
    hasChanges = true;
    return { ...message, attachments };
  });

  return hasChanges ? nextMessages : messages;
}

export interface StoredChatState {
  messages: ChatMessage[];
  input: string;
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as ChatMessage;
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string"
  );
}

export function prepareChatMessagesForStorage(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((message) => {
    if (!message.attachments?.length) return message;

    return {
      ...message,
      attachments: message.attachments.map((attachment) => {
        const { imageDataUrl: _imageDataUrl, ...withoutImageDataUrl } = attachment;
        if (attachment.source !== "upload") return withoutImageDataUrl;

        const {
          imageSrc: _imageSrc,
          content: _content,
          ...storedAttachment
        } = withoutImageDataUrl;
        return storedAttachment;
      }),
    };
  });
}

export function sanitizeChatMessagesFromStorage(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((message) => {
    let nextMessage = message;

    if (message.codeChangeStatus === "pending") {
      nextMessage = {
        ...nextMessage,
        codeChangeStatus: "rejected",
      };
    }

    if (message.editOptions) {
      const { editOptions: _removed, ...withoutEditOptions } = nextMessage;
      nextMessage = withoutEditOptions;
    }

    return nextMessage;
  });
}

export function readStoredChatState(storageKey: string): StoredChatState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredChatState>;
    if (!Array.isArray(parsed.messages)) return null;

    const messages = parsed.messages.filter(isChatMessage);
    if (messages.length !== parsed.messages.length) return null;

    return {
      messages: sanitizeChatMessagesFromStorage(messages),
      input: typeof parsed.input === "string" ? parsed.input : "",
    };
  } catch {
    return null;
  }
}

export function writeStoredChatState(storageKey: string, state: StoredChatState): void {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(
    storageKey,
    JSON.stringify({
      messages: prepareChatMessagesForStorage(state.messages),
      input: state.input,
    }),
  );
}
