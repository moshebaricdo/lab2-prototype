import type { RefObject } from "react";
import { ScrollArea } from "../../../../ui/scroll-area";
import { AppButton } from "../../../../ui/AppButton";
import { FileChip } from "../../../../ui/FileChip";
import { faIconForFileName, fileExtensionLabelFromName } from "../../../../ui/fileChipMeta";
import { FaIcon } from "../../../../ui/icons/FaIcon";
import { ActionRow } from "./ActionRow";
import { TutorActionCard } from "./TutorActionCard";
import { ThinkingAnimation } from "./ThinkingAnimation";
import type { ChatAttachment, ChatMessage, FileChange } from "../../../../../types/chat";
import type { AiTutorInputExperiment } from "../../../../../types/tutor";
import { copyTextToClipboard, FileChangesCard, renderMessageContent } from "./messageFormatting";
import styles from "./AiTutorPanel.module.scss";

interface AiTutorMessageListProps {
  scrollWrapRef: RefObject<HTMLDivElement | null>;
  canScrollUp: boolean;
  canScrollDown: boolean;
  showEmptyState: boolean;
  topPadding: number;
  chatMessages: ChatMessage[];
  isThinking: boolean;
  autoCompleteThinking: boolean;
  inputExperiment: AiTutorInputExperiment;
  onThinkingComplete: () => void;
  onMarkAttachmentAdded: (msgIndex: number, attachmentPath: string) => void;
  onActionCardUpdate: (msgIndex: number, newStatus: "added" | "dismissed") => void;
  onCodeChangeAction: (msgIndex: number, action: "accepted" | "rejected") => void;
  onOpenFileChangeInEditor?: (change: FileChange) => void;
  onOpenFileChangeInPreview?: (change: FileChange) => void;
}

function metadataLabelForAttachment(att: ChatAttachment) {
  if (att.source === "code-reference") return att.timestamp;
  if (att.source === "project") return undefined;
  return att.timestamp ?? fileExtensionLabelFromName(att.fileName);
}

function MessageAttachments({
  msg,
  idx,
  inputExperiment,
  onMarkAttachmentAdded,
}: {
  msg: ChatMessage;
  idx: number;
  inputExperiment: AiTutorInputExperiment;
  onMarkAttachmentAdded: (msgIndex: number, attachmentPath: string) => void;
}) {
  const showFileChipActionsInStream = inputExperiment === "file-chip-action";
  const showTutorActionCards = inputExperiment === "tutor-action-card";

  if (msg.role !== "user" || !msg.attachments?.length) return null;

  const codeRefs = msg.attachments.filter((a) => a.source === "code-reference");
  const nonCodeRefs = msg.attachments.filter((a) => a.source !== "code-reference");

  return (
    <>
      {codeRefs.length > 0 && (
        <div className={`${styles.messageRow} ${styles.messageRowUser}`}>
          <div className={styles.streamAttachmentRow}>
            {codeRefs.map((att) => (
              <FileChip
                key={att.path}
                fileName={att.fileName}
                nameTitle={att.path}
                extensionLabel={metadataLabelForAttachment(att)}
                iconName={faIconForFileName(att.path)}
                mode="static"
              />
            ))}
          </div>
        </div>
      )}

      {!showFileChipActionsInStream && !showTutorActionCards && nonCodeRefs.length > 0 && (
        <div className={`${styles.messageRow} ${styles.messageRowUser}`}>
          <div className={styles.streamAttachmentRow}>
            {nonCodeRefs.map((att) => (
              <FileChip
                key={att.path}
                fileName={att.fileName}
                nameTitle={att.path}
                extensionLabel={metadataLabelForAttachment(att)}
                iconName={faIconForFileName(att.fileName)}
                imageSrc={att.imageSrc}
                mode="static"
              />
            ))}
          </div>
        </div>
      )}

      {showFileChipActionsInStream && (
        <div className={`${styles.messageRow} ${styles.messageRowUser}`}>
          <div className={styles.streamAttachmentRow}>
            {msg.attachments.map((att) => {
              const isUpload = att.source === "upload";
              return (
                <FileChip
                  key={att.path}
                  fileName={att.fileName}
                  nameTitle={att.path}
                  extensionLabel={metadataLabelForAttachment(att)}
                  iconName={faIconForFileName(att.path)}
                  imageSrc={att.imageSrc}
                  mode={isUpload ? "add" : "static"}
                  onAdd={isUpload ? () => onMarkAttachmentAdded(idx, att.path) : undefined}
                  addedToProject={att.addedToProject}
                />
              );
            })}
          </div>
        </div>
      )}

      {showTutorActionCards && (
        <div className={`${styles.messageRow} ${styles.messageRowUser}`}>
          <div className={styles.streamAttachmentRow}>
            {msg.attachments.map((att) => (
              <FileChip
                key={att.path}
                fileName={att.fileName}
                nameTitle={att.path}
                extensionLabel={metadataLabelForAttachment(att)}
                iconName={faIconForFileName(att.path)}
                imageSrc={att.imageSrc}
                mode="static"
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyStateIcon}>
        <FaIcon name="hands-clapping" size="l" />
      </div>
      <h2 className={styles.emptyStateTitle}>How can I help?</h2>
      <p className={styles.emptyStateText}>
        You can ask AI Tutor to make changes to your project, for help with the level, or simply to discuss your ideas.
      </p>
    </div>
  );
}

export function AiTutorMessageList({
  scrollWrapRef,
  canScrollUp,
  canScrollDown,
  showEmptyState,
  topPadding,
  chatMessages,
  isThinking,
  autoCompleteThinking,
  inputExperiment,
  onThinkingComplete,
  onMarkAttachmentAdded,
  onActionCardUpdate,
  onCodeChangeAction,
  onOpenFileChangeInEditor,
  onOpenFileChangeInPreview,
}: AiTutorMessageListProps) {
  const showTutorActionCards = inputExperiment === "tutor-action-card";

  return (
    <div className={styles.scrollWrap} ref={scrollWrapRef}>
      {canScrollUp && <div className={styles.fadeTop} />}
      {canScrollDown && <div className={styles.fadeBottom} />}
      <ScrollArea
        className={styles.messagesArea}
        viewportClassName={styles.messagesViewport}
      >
        <div
          className={`${styles.messagesWrap} ${showEmptyState ? styles.messagesWrapEmpty : ""}`}
          style={{ paddingTop: `${topPadding}px` }}
        >
          {showEmptyState && <EmptyState />}

          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={styles.messageBlock}
              data-tutor-message-index={idx}
            >
              <MessageAttachments
                msg={msg}
                idx={idx}
                inputExperiment={inputExperiment}
                onMarkAttachmentAdded={onMarkAttachmentAdded}
              />

              {msg.isAlert ? (
                <div className={styles.messageRow}>
                  <div className={`${styles.alertBubble} ${msg.alertVariant === "rejected" ? styles.alertBubbleRejected : ""}`}>
                    <FaIcon
                      name={msg.alertVariant === "rejected" ? "circle-xmark" : "circle-check"}
                      size="s"
                      className={`${styles.alertIcon} ${msg.alertVariant === "rejected" ? styles.alertIconRejected : ""}`}
                    />
                    <p className={styles.alertText}>{msg.content}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className={`${styles.messageRow} ${
                      msg.role === "user" ? styles.messageRowUser : styles.messageRowAssistant
                    }`}
                    data-tutor-message-anchor={msg.role === "assistant" ? "assistant-reply-start" : undefined}
                  >
                    <div
                      className={`${styles.messageBubble} ${
                        msg.role === "user"
                          ? styles.messageBubbleUser
                          : styles.messageBubbleAssistant
                      }`}
                    >
                      {renderMessageContent(msg.content)}

                      {msg.fileChanges && msg.fileChanges.length > 0 && (
                        <FileChangesCard
                          changes={msg.fileChanges}
                          onOpenFileInEditor={onOpenFileChangeInEditor}
                          onOpenFileInPreview={onOpenFileChangeInPreview}
                        />
                      )}

                      {msg.fileChanges && msg.codeChangeStatus === "pending" && (
                        <div className={styles.codeChangeActions}>
                          <AppButton
                            variant="secondary"
                            tone="gray"
                            size="s"
                            iconName="xmark"
                            fullWidth
                            onClick={() => onCodeChangeAction(idx, "rejected")}
                          >
                            Reject
                          </AppButton>
                          <AppButton
                            variant="primary"
                            tone="purple"
                            size="s"
                            iconName="check"
                            fullWidth
                            onClick={() => onCodeChangeAction(idx, "accepted")}
                          >
                            Accept
                          </AppButton>
                        </div>
                      )}

                      {showTutorActionCards && msg.role === "assistant" && msg.actionCard && (
                        <TutorActionCard
                          prompt={msg.actionCard.prompt}
                          files={msg.actionCard.files}
                          status={msg.actionCard.status}
                          onAdd={() => onActionCardUpdate(idx, "added")}
                          onDismiss={() => onActionCardUpdate(idx, "dismissed")}
                        />
                      )}
                    </div>
                  </div>

                  {msg.role === "assistant" && (
                    <div className={styles.actionRowWrap}>
                      <ActionRow
                        onCopy={() => void copyTextToClipboard(msg.content)}
                        showDownload={false}
                        showFeedback={false}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          {isThinking && (
            <div className={styles.messageBlock}>
              <div className={styles.messageRow}>
                <ThinkingAnimation
                  autoComplete={autoCompleteThinking}
                  onComplete={onThinkingComplete}
                />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
