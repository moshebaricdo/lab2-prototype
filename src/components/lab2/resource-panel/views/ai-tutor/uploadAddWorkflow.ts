import type { ChatAttachment, ChatMessage } from "../../../../../types/chat";

export type TutorAddAttachmentResult = true | string;

/**
 * Upload staging is intentionally silent in chat. Files are already staged in
 * uploads/ at composer attach time; Tutor can infer usage from the user prompt.
 */
export function buildUploadIntentFollowUpOnSend(
  _message: string,
  _attachments: ChatAttachment[] | undefined,
  _existingProjectFileNames: Set<string>,
): ChatMessage | null {
  return null;
}

export function resolveActionCardAttachments(
  actionCardPaths: string[] | undefined,
  userMessage: ChatMessage | undefined,
): ChatAttachment[] {
  if (!userMessage?.attachments?.length) return [];

  if (!actionCardPaths?.length) {
    return userMessage.attachments.filter((attachment) => attachment.source === "upload");
  }

  const pathSet = new Set(actionCardPaths);
  return userMessage.attachments.filter((attachment) => pathSet.has(attachment.path));
}
