import { type Dispatch, type FormEvent, type SetStateAction } from "react";
import {
  AiChatInput,
  AiChatMessage,
  Button,
  Tooltip,
} from "@moshebaricdo/cads-react";
import { PanelHeader } from "../../../ui/PanelHeader";
import type { ChatMessage } from "../../../../types/chat";
import type { MockTutorConfig } from "../../../../types/tutor";
import styles from "./AiChatLabWorkspace.module.scss";

interface AiChatLabChatPanelProps {
  chatMessages: ChatMessage[];
  setChatMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  chatInput: string;
  setChatInput: Dispatch<SetStateAction<string>>;
  chatPlaceholder: string;
  mockTutorConfig: MockTutorConfig;
  onClearChat: () => void;
  onDownloadChat: () => void;
}

async function resolveAssistantReply(
  response: MockTutorConfig["response"],
  input: string,
  conversation: ChatMessage[],
): Promise<ChatMessage | null> {
  if (!response) return null;
  if (typeof response === "function") {
    return response(input, conversation);
  }
  return response;
}

export function AiChatLabChatPanel({
  chatMessages,
  setChatMessages,
  chatInput,
  setChatInput,
  chatPlaceholder,
  mockTutorConfig,
  onClearChat,
  onDownloadChat,
}: AiChatLabChatPanelProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const content = chatInput.trim();
    if (!content) return;

    const userMessage: ChatMessage = { role: "user", content };
    const nextMessages = [...chatMessages, userMessage];
    setChatMessages(nextMessages);
    setChatInput("");

    void resolveAssistantReply(
      mockTutorConfig.response,
      content,
      nextMessages,
    ).then((reply) => {
      if (!reply) return;
      setChatMessages((current) => [...current, reply]);
    });
  };

  return (
    <section className={styles.chatPanel}>
      <PanelHeader
        label="AI CHAT"
        right={
          <div className={styles.headerActions}>
            <Tooltip title="Clear chat" placement="bottom">
              <span>
                <Button
                  variant="text"
                  color="tertiary"
                  size="extraSmall"
                  iconOnly
                  startIconName="eraser"
                  onClick={onClearChat}
                  disabled={chatMessages.length === 0 && chatInput.length === 0}
                  aria-label="Clear AI chat"
                />
              </span>
            </Tooltip>
            <Tooltip title="Download chat" placement="bottom">
              <span>
                <Button
                  variant="text"
                  color="tertiary"
                  size="extraSmall"
                  iconOnly
                  startIconName="download"
                  onClick={onDownloadChat}
                  disabled={chatMessages.length === 0}
                  aria-label="Download AI chat"
                />
              </span>
            </Tooltip>
          </div>
        }
      />

      <div className={styles.chatBody}>
        {chatMessages.length === 0 ? (
          <div className={styles.chatEmpty}>
            <p className={styles.emptyTitle}>Start a conversation</p>
            <p className={styles.emptyBody}>
              Try a prompt, then tweak the model settings and compare the
              response.
            </p>
          </div>
        ) : (
          <div className={styles.chatMessageList}>
            {chatMessages.map((message, index) => (
              <AiChatMessage
                key={`${message.role}-${index}-${message.content.slice(0, 24)}`}
                context="Tutor"
                author={message.role === "user" ? "Human" : "AI"}
                hasActionRow={message.role === "assistant"}
                hasFlagging={false}
                hasDownload={false}
              >
                {message.content}
              </AiChatMessage>
            ))}
          </div>
        )}
      </div>

      <div className={styles.chatComposer}>
        <AiChatInput
          value={chatInput}
          onChange={(event) => setChatInput(event.target.value)}
          onSubmit={handleSubmit}
          placeholder={chatPlaceholder}
          leftActions={<span />}
        />
      </div>
    </section>
  );
}
