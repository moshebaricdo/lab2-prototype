import type { ChatMessage } from "../../types/chat";

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
      attachments: message.attachments.map(({ imageDataUrl: _imageDataUrl, ...attachment }) => attachment),
    };
  });
}

export function sanitizeChatMessagesFromStorage(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((message) => {
    if (message.codeChangeStatus !== "pending") return message;

    return {
      ...message,
      codeChangeStatus: "rejected",
    };
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
