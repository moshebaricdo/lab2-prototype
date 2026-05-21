import { useEffect, useMemo, useState } from "react";
import {
  readStoredChatState,
  writeStoredChatState,
} from "../lib/chat/chatSessionStorage";
import type { ChatMessage } from "../types/chat";

export interface UseChatStateOptions {
  storageKey?: string;
}

export function useChatState(
  initialMessages: ChatMessage[],
  initialInput = "",
  options: UseChatStateOptions = {},
) {
  const { storageKey } = options;
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    if (!storageKey) return initialMessages;
    const stored = readStoredChatState(storageKey);
    return stored?.messages ?? initialMessages;
  });
  const [chatInput, setChatInput] = useState(() => {
    if (!storageKey) return initialInput;
    const stored = readStoredChatState(storageKey);
    return stored?.input ?? initialInput;
  });

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;

    try {
      writeStoredChatState(storageKey, {
        messages: chatMessages,
        input: chatInput,
      });
    } catch (error) {
      console.warn("[useChatState] Unable to persist chat state", error);
    }
  }, [chatInput, chatMessages, storageKey]);

  return useMemo(
    () => ({
      chatMessages,
      setChatMessages,
      chatInput,
      setChatInput,
    }),
    [chatInput, chatMessages],
  );
}
