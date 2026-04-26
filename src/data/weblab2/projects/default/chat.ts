import type { ChatAttachment, ChatMessage } from "../../../../types/chat";
import type { MockTutorConfig } from "../../../../types/tutor";
import persianCatImage from "../../../../assets/media/persian-cat.jpg";
import siameseCatImage from "../../../../assets/media/siamese-cat.jpg";

export const initialChatMessages: ChatMessage[] = [];

const sharedAttachmentsData: ChatAttachment[] = [
  {
    fileName: "persian-cat.jpg",
    path: "persian-cat.jpg",
    imageSrc: persianCatImage,
    timestamp: "12:56PM",
    source: "upload",
  },
  {
    fileName: "siamese-cat.jpg",
    path: "siamese-cat.jpg",
    imageSrc: siameseCatImage,
    timestamp: "12:56PM",
    source: "upload",
  },
  {
    fileName: "index.html",
    path: "My Project/index.html",
    timestamp: "12:56PM",
    source: "project",
  },
];

export const sharedAttachments = sharedAttachmentsData;

export const fileChipActionPrefilledInput =
  "Here are photos of my favorite cat breeds - can we add them to the breed cards in my app?";

export const fileChipActionPrefilledAttachments = sharedAttachmentsData.map(
  (a) => a.path,
);

export function buildFileChipActionConversation(): ChatMessage[] {
  return [];
}

export const tutorActionCardPrefilledInput =
  "I found some great images for my cat breed cards! Here are the ones I want to use.";

export const tutorActionCardPrefilledAttachments = sharedAttachmentsData
  .filter((a) => a.imageSrc)
  .map((a) => a.path);

export function buildTutorActionCardConversation(): ChatMessage[] {
  return [];
}

export const sharedAttachmentMeta: Record<string, ChatAttachment> =
  Object.fromEntries(sharedAttachmentsData.map((a) => [a.path, a]));

export const fileChipActionMockTutor: MockTutorConfig = {
  initialInput: fileChipActionPrefilledInput,
  initialAttachments: fileChipActionPrefilledAttachments,
  attachmentMeta: sharedAttachmentMeta,
};

export const tutorActionCardMockTutor: MockTutorConfig = {
  initialInput: tutorActionCardPrefilledInput,
  initialAttachments: tutorActionCardPrefilledAttachments,
  attachmentMeta: sharedAttachmentMeta,
};
