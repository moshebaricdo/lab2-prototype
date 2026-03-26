import { useMemo, useState } from "react";
import type { ChatMessage } from "../types/chat";

export function useChatState(initialMessages: ChatMessage[]) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages);
  const [chatInput, setChatInput] = useState("");

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
