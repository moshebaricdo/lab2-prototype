import type { ChatAttachment, ChatMessage } from "../../../../../types/chat";

export type UploadIntent = "content-to-add" | "reference-only" | "ask";

export interface UploadIntentClassification {
  intent: UploadIntent;
  reason: string;
  eligibleAttachments: ChatAttachment[];
}

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

const TEXT_EXTENSIONS = new Set([
  "css",
  "csv",
  "htm",
  "html",
  "js",
  "json",
  "md",
  "txt",
]);

const CONTENT_PHRASES = [
  /\buse (?:this|these|my|the)\b/i,
  /\badd (?:this|these|my|the)\b/i,
  /\binclude (?:this|these|my|the)\b/i,
  /\bput (?:this|these|it|them) (?:in|into)\b/i,
  /\bi (?:uploaded|added|attached|shared)\b/i,
  /\bi like (?:this|these)\b/i,
  /\bmy (?:photo|image|logo|icon|picture|asset)\b/i,
  /\bfor (?:my|the) (?:project|page|site|app|carousel|gallery|hero|background|logo|profile)\b/i,
  /\binto (?:my|the) (?:project|page|site|app|carousel|gallery|hero|background|logo|profile)\b/i,
];

const REFERENCE_PHRASES = [
  /\bmatch (?:this|these|it)\b/i,
  /\blook like (?:this|these|it)\b/i,
  /\b(?:use|take) (?:this|these|it) as (?:inspiration|reference|a reference)\b/i,
  /\bsomething like (?:this|these|it)\b/i,
  /\b(?:like|similar to) (?:this|these|it)\b/i,
  /\b(?:debug|fix|check) (?:this|these|it) (?:screenshot|screen shot|mockup|wireframe)\b/i,
  /\bwhat(?:'s| is) wrong (?:with|here)\b/i,
];

const EXPLANATION_ONLY_PHRASES = [
  /\bwhat (?:is|are|does|do)\b/i,
  /\bexplain\b/i,
  /\bhow (?:do|does|can|would)\b/i,
  /\bwhy (?:is|are|does|do)\b/i,
  /\bcan you (?:explain|describe|tell me)\b/i,
];

const SCREENSHOT_NAME_PATTERN =
  /(?:screenshot|screen[\s-]?shot|mockup|wireframe|figma|inspiration|reference)/i;

function fileExtension(fileName: string) {
  const dot = fileName.lastIndexOf(".");
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : "";
}

function isImageAttachment(attachment: ChatAttachment) {
  if (attachment.mimeType?.startsWith("image/")) return true;
  return IMAGE_EXTENSIONS.has(fileExtension(attachment.fileName));
}

function isSupportedTextAttachment(attachment: ChatAttachment) {
  return TEXT_EXTENSIONS.has(fileExtension(attachment.fileName));
}

export function isAddableUploadAttachment(attachment: ChatAttachment) {
  if (attachment.source !== "upload") return false;
  if (attachment.addedToProject) return false;

  if (isImageAttachment(attachment)) {
    return Boolean(attachment.imageDataUrl ?? attachment.imageSrc);
  }

  if (isSupportedTextAttachment(attachment)) {
    const content = attachment.content?.trim() ?? "";
    return content.length > 0 && !content.startsWith("Uploaded file:");
  }

  return false;
}

export function getUploadAttachments(attachments: ChatAttachment[] | undefined) {
  return attachments?.filter((attachment) => attachment.source === "upload") ?? [];
}

function scorePhrases(message: string, patterns: RegExp[]) {
  return patterns.reduce(
    (score, pattern) => (pattern.test(message) ? score + 1 : score),
    0,
  );
}

function classifySingleAttachment(
  message: string,
  attachment: ChatAttachment,
): UploadIntent {
  const normalizedMessage = message.trim();
  const contentScore = scorePhrases(normalizedMessage, CONTENT_PHRASES);
  const referenceScore = scorePhrases(normalizedMessage, REFERENCE_PHRASES);
  const explanationScore = scorePhrases(normalizedMessage, EXPLANATION_ONLY_PHRASES);
  const screenshotLikeName = SCREENSHOT_NAME_PATTERN.test(attachment.fileName);
  const mediaAsset = isImageAttachment(attachment);

  if (referenceScore > 0 && contentScore === 0) {
    return "reference-only";
  }

  if (screenshotLikeName && contentScore === 0) {
    return "reference-only";
  }

  if (mediaAsset && contentScore > 0 && referenceScore === 0) {
    return "content-to-add";
  }

  if (isSupportedTextAttachment(attachment) && contentScore > 0 && referenceScore === 0) {
    return "content-to-add";
  }

  if (referenceScore > contentScore) {
    return "reference-only";
  }

  if (explanationScore > 0 && contentScore === 0) {
    return "reference-only";
  }

  if (mediaAsset && referenceScore === 0 && explanationScore === 0) {
    return "ask";
  }

  return "ask";
}

export function classifyUploadAttachments(
  message: string,
  attachments: ChatAttachment[] | undefined,
  existingProjectFileNames: Set<string>,
): UploadIntentClassification | null {
  const uploads = getUploadAttachments(attachments).filter(isAddableUploadAttachment);
  if (uploads.length === 0) return null;

  const duplicateNames = uploads.filter((attachment) =>
    existingProjectFileNames.has(attachment.fileName),
  );
  if (duplicateNames.length > 0) {
    const names = duplicateNames.map((attachment) => attachment.fileName).join(", ");
    return {
      intent: "ask",
      reason: `A project file named ${names} already exists.`,
      eligibleAttachments: uploads.filter(
        (attachment) => !existingProjectFileNames.has(attachment.fileName),
      ),
    };
  }

  const perAttachment = uploads.map((attachment) =>
    classifySingleAttachment(message, attachment),
  );
  const uniqueIntents = new Set(perAttachment);

  if (uniqueIntents.size > 1) {
    return {
      intent: "ask",
      reason: "These uploads may be project files or visual references.",
      eligibleAttachments: uploads,
    };
  }

  const intent = perAttachment[0] ?? "ask";
  if (intent === "content-to-add" && uploads.length === 1) {
    return {
      intent,
      reason: "This looks like a project asset you want to use in your code.",
      eligibleAttachments: uploads,
    };
  }

  if (intent === "content-to-add" && uploads.length > 1) {
    return {
      intent: "ask",
      reason: "These files look like project assets. Add them before Tutor helps wire them in?",
      eligibleAttachments: uploads,
    };
  }

  if (intent === "reference-only") {
    return {
      intent,
      reason: "This looks like a visual reference rather than a project file.",
      eligibleAttachments: uploads,
    };
  }

  return {
    intent: "ask",
    reason: uploads.length === 1
      ? "Should I add this file to your project so you can use it in your code?"
      : "Should I add these files to your project so you can use them in your code?",
    eligibleAttachments: uploads,
  };
}

export function buildUploadAddActionCardMessage(
  classification: UploadIntentClassification,
): ChatMessage {
  const fileNames = classification.eligibleAttachments.map((attachment) => attachment.fileName);
  const attachmentPaths = classification.eligibleAttachments.map((attachment) => attachment.path);

  return {
    role: "assistant",
    content: classification.reason,
    actionCard: {
      prompt: classification.intent === "ask"
        ? "Add these files to your project?"
        : "Add these files to your project?",
      files: fileNames,
      attachmentPaths,
      status: "pending",
      kind: "upload-add",
    },
  };
}

export function buildUploadAddedAlertMessage(fileNames: string[]): ChatMessage {
  const count = fileNames.length;
  return {
    role: "assistant",
    content: count === 1
      ? `${fileNames[0]} was added to your project.`
      : `${count} files were added to your project: ${fileNames.join(", ")}.`,
    isAlert: true,
  };
}
