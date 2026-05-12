import type { Dispatch, SetStateAction } from "react";
import { AppButton } from "../../../ui/AppButton";
import { PanelHeader } from "../../../ui/PanelHeader";
import { Tooltip } from "../../../ui/Tooltip";
import { AiTutorPanel } from "../../../lab2/resource-panel/views/ai-tutor/AiTutorPanel";
import type { ChatMessage } from "../../../../types/chat";
import type { MockTutorConfig, TutorRequestMode } from "../../../../types/tutor";
import styles from "./AiChatLabWorkspace.module.scss";

interface AiChatLabChatPanelProps {
  chatMessages: ChatMessage[];
  setChatMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  chatInput: string;
  setChatInput: Dispatch<SetStateAction<string>>;
  chatPlaceholder: string;
  mockTutorConfig: MockTutorConfig;
  tutorRequestMode: TutorRequestMode;
  setTutorRequestMode: Dispatch<SetStateAction<TutorRequestMode>>;
  onClearChat: () => void;
  onDownloadChat: () => void;
}

export function AiChatLabChatPanel({
  chatMessages,
  setChatMessages,
  chatInput,
  setChatInput,
  chatPlaceholder,
  mockTutorConfig,
  tutorRequestMode,
  setTutorRequestMode,
  onClearChat,
  onDownloadChat,
}: AiChatLabChatPanelProps) {
  return (
    <section className={styles.chatPanel}>
      <PanelHeader
        label="AI CHAT"
        right={
          <div className={styles.headerActions}>
            <Tooltip content="Clear chat" position="bottom">
              <AppButton
                variant="tertiary"
                tone="gray"
                size="xs"
                iconName="eraser"
                onClick={onClearChat}
                disabled={chatMessages.length === 0 && chatInput.length === 0}
                aria-label="Clear AI chat"
              />
            </Tooltip>
            <Tooltip content="Download chat" position="bottom">
              <AppButton
                variant="tertiary"
                tone="gray"
                size="xs"
                iconName="download"
                onClick={onDownloadChat}
                disabled={chatMessages.length === 0}
                aria-label="Download AI chat"
              />
            </Tooltip>
          </div>
        }
      />
      <AiTutorPanel
        chatMessages={chatMessages}
        setChatMessages={setChatMessages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        showInstructionsDrawer={false}
        inputExperiment="default"
        mockTutorConfig={mockTutorConfig}
        showModelSelector={false}
        composerPlaceholder={chatPlaceholder}
        emptyStateTitle="Start a conversation"
        emptyStateText="Try a prompt, then tweak the model settings and compare the response."
        tutorRequestMode={tutorRequestMode}
        setTutorRequestMode={setTutorRequestMode}
      />
    </section>
  );
}
