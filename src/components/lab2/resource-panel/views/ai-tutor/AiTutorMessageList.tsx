import type { RefObject } from "react";
import { ScrollArea } from "../../../../ui/scroll-area";
import { AppButton } from "../../../../ui/AppButton";
import { FileChip } from "../../../../ui/FileChip";
import { faIconForFileName, fileExtensionLabelFromName } from "../../../../ui/fileChipMeta";
import { FaIcon } from "../../../../ui/icons/FaIcon";
import { ActionRow } from "./ActionRow";
import { NewProjectPlanQuestionnaireCard } from "./NewProjectPlanQuestionnaireCard";
import { TutorActionCard } from "./TutorActionCard";
import { ThinkingAnimation } from "./ThinkingAnimation";
import type {
  ChatAttachment,
  ChatMessage,
  FileChange,
  NewProjectPlanAnswers,
} from "../../../../../types/chat";
import type { AiTutorInputExperiment } from "../../../../../types/tutor";
import type {
  ValidationReviewCardData,
  ValidationReviewItemStatus,
} from "../../../../../types/validationReview";
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
  onNewProjectPlanQuestionnaireSubmit: (
    msgIndex: number,
    answers: NewProjectPlanAnswers,
    moodboardAttachments: ChatAttachment[],
  ) => void;
  interactiveCardsDisabled?: boolean;
  emptyStateTitle?: string;
  emptyStateText?: string;
  onValidationReviewRequest?: () => void;
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

function EmptyState({
  title = "How can I help?",
  text = "You can ask AI Tutor to make changes to your project, for help with the level, or simply to discuss your ideas.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyStateIcon}>
        <FaIcon name="hands-clapping" size="l" />
      </div>
      <h2 className={styles.emptyStateTitle}>{title}</h2>
      <p className={styles.emptyStateText}>
        {text}
      </p>
    </div>
  );
}

function reviewStatusLabel(status: ValidationReviewCardData["status"]) {
  if (status === "likely_complete") return "Looks close";
  if (status === "needs_work") return "Needs work";
  if (status === "in_progress") return "In progress";
  return "Not started";
}

function itemIcon(status: ValidationReviewItemStatus): "circle-check" | "circle-xmark" | "circle-minus" {
  if (status === "pass") return "circle-check";
  if (status === "missing") return "circle-xmark";
  return "circle-minus";
}

function ValidationReviewCard({
  review,
  disabled,
  onRequestReview,
}: {
  review: ValidationReviewCardData;
  disabled: boolean;
  onRequestReview?: () => void;
}) {
  const isOffer = review.kind === "offer";

  return (
    <div className={styles.validationReviewCard}>
      <div className={styles.validationReviewHeader}>
        <div>
          <p className={styles.validationReviewEyebrow}>
            {review.mode === "open-ended" ? "Open-ended review" : `${review.mode} review`}
          </p>
          <h3 className={styles.validationReviewTitle}>{review.title}</h3>
        </div>
        {!isOffer && (
          <div className={styles.validationReviewStatus}>
            {reviewStatusLabel(review.status)}
          </div>
        )}
      </div>

      {review.evidence && review.evidence.length > 0 && (
        <div className={styles.validationReviewSection}>
          <p className={styles.validationReviewSectionTitle}>Evidence</p>
          <ul className={styles.validationReviewList}>
            {review.evidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {review.items && review.items.length > 0 && (
        <div className={styles.validationReviewItems}>
          {review.items.map((item) => (
            <div key={item.id} className={styles.validationReviewItem}>
              <FaIcon
                name={itemIcon(item.status)}
                size="s"
                className={[
                  styles.validationReviewItemIcon,
                  item.status === "pass" ? styles.validationReviewItemPass : "",
                  item.status === "missing" ? styles.validationReviewItemMissing : "",
                ].filter(Boolean).join(" ")}
              />
              <div>
                <p className={styles.validationReviewItemLabel}>{item.label}</p>
                <p className={styles.validationReviewItemDetail}>{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {review.nextStep && (
        <p className={styles.validationReviewNextStep}>{review.nextStep}</p>
      )}

      {isOffer && onRequestReview && (
        <AppButton
          variant="primary"
          tone="purple"
          size="s"
          iconName="clipboard-check"
          fullWidth
          disabled={disabled}
          onClick={onRequestReview}
        >
          Check my work
        </AppButton>
      )}
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
  onNewProjectPlanQuestionnaireSubmit,
  interactiveCardsDisabled = false,
  emptyStateTitle,
  emptyStateText,
  onValidationReviewRequest,
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
          {showEmptyState && (
            <EmptyState title={emptyStateTitle} text={emptyStateText} />
          )}

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

                      {msg.role === "assistant" && msg.newProjectPlanQuestionnaire && (
                        <NewProjectPlanQuestionnaireCard
                          questionnaire={msg.newProjectPlanQuestionnaire}
                          disabled={interactiveCardsDisabled}
                          onSubmit={(answers, moodboardAttachments) =>
                            onNewProjectPlanQuestionnaireSubmit(
                              idx,
                              answers,
                              moodboardAttachments,
                            )
                          }
                        />
                      )}

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

                      {msg.role === "assistant" && msg.validationReview && (
                        <ValidationReviewCard
                          review={msg.validationReview}
                          disabled={interactiveCardsDisabled}
                          onRequestReview={onValidationReviewRequest}
                        />
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
