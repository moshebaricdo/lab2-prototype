import { useMemo, useState } from "react";
import type { ChatMessage } from "../types/chat";

export function useChatState(initialMessages: ChatMessage[], initialInput = "") {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages);
  const [chatInput, setChatInput] = useState(initialInput);

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
