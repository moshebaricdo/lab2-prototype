import { useState, type KeyboardEvent, type RefObject } from "react";
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
  onValidationReviewAction?: (action: "hint" | "debug") => void;
  onValidationReviewContinue?: () => void;
  validationReviewContinueLabel?: string;
  validationReviewRunning?: boolean;
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
  if (status === "likely_complete") return "Complete";
  if (status === "needs_work") return "Needs work";
  if (status === "in_progress") return "In progress";
  return "Not started";
}

function alertIconName(
  variant: ChatMessage["alertVariant"],
): "circle-xmark" | "circle-check" | "circle-info" {
  if (variant === "rejected") return "circle-xmark";
  if (variant === "validation") return "circle-info";
  return "circle-check";
}

function ValidationReviewCard({
  review,
  disabled,
  compact = false,
  onRequestReview,
  onAction,
  onContinue,
  continueLabel = "Continue",
  isRunning = false,
}: {
  review: ValidationReviewCardData;
  disabled: boolean;
  compact?: boolean;
  onRequestReview?: () => void;
  onAction?: (action: "hint" | "debug") => void;
  onContinue?: () => void;
  continueLabel?: string;
  isRunning?: boolean;
}) {
  const isOffer = review.kind === "offer";
  const [isExpanded, setIsExpanded] = useState(!compact);
  const headline = review.status === "likely_complete"
    ? "This meets the level goals."
    : review.status === "needs_work"
      ? "There is still something to work through."
      : review.status === "in_progress"
        ? "You are making progress. Keep iterating."
        : isOffer
          ? review.nextStep
          : "Start with one small change, then check again.";
  const visibleItems = review.items?.slice(0, isExpanded ? 3 : 2) ?? [];
  const showFallbackSummary = visibleItems.length === 0;
  const expandCompactCard = () => setIsExpanded(true);
  const handleCompactCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    expandCompactCard();
  };

  if (isOffer) {
    return onRequestReview ? (
      <div className={styles.validationReviewInlineAction}>
        <AppButton
          variant="primary"
          tone="purple"
          size="s"
          icon={isRunning ? (
            <FaIcon
              name="spinner-third"
              size="s"
              className={styles.validationReviewSpinner}
            />
          ) : undefined}
          iconName={isRunning ? undefined : "clipboard-check"}
          fullWidth
          disabled={disabled}
          onClick={onRequestReview}
        >
          {isRunning ? "Checking..." : "Check my work"}
        </AppButton>
      </div>
    ) : null;
  }

  if (compact && !isExpanded) {
    return (
      <div
        role="button"
        tabIndex={0}
        className={styles.validationReviewTimelineNode}
        onClick={expandCompactCard}
        onKeyDown={handleCompactCardKeyDown}
      >
        <span className={styles.validationReviewTimelineIcon}>
          <FaIcon name="clipboard-check" size="s" />
        </span>
        <span className={styles.validationReviewTimelineText}>
          Previous check: {reviewStatusLabel(review.status)}
        </span>
        <span className={styles.validationReviewTimelineAction}>Show</span>
      </div>
    );
  }

  return (
    <div className={styles.validationReviewStack}>
      <div className={styles.validationReviewCard}>
        <div className={styles.validationReviewHeader}>
          <p className={styles.validationReviewEyebrow}>
            Review checklist
          </p>
          <div className={styles.validationReviewStatus}>
            {reviewStatusLabel(review.status)}
          </div>
        </div>

        <div className={styles.validationReviewBody}>
          {showFallbackSummary && (
            <h3 className={styles.validationReviewTitle}>{review.title}</h3>
          )}

          {showFallbackSummary && headline && (
            <p className={styles.validationReviewHeadline}>{headline}</p>
          )}

          {visibleItems.length > 0 && (
            <div className={styles.validationReviewItems}>
              {visibleItems.map((item) => (
                <div key={item.id} className={styles.validationReviewItem}>
                  <span
                    className={[
                      styles.validationReviewMarker,
                      item.status === "pass" ? styles.validationReviewMarkerPass : "",
                      item.status === "missing" ? styles.validationReviewMarkerMissing : "",
                    ].filter(Boolean).join(" ")}
                  >
                    {item.status === "pass" && <FaIcon name="check" size="inherit" />}
                  </span>
                  <div className={styles.validationReviewItemContent}>
                    <p className={styles.validationReviewItemLabel}>{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {onAction && review.status !== "likely_complete" && (
            <div className={styles.validationReviewActions}>
              <AppButton
                variant="secondary"
                tone="gray"
                size="s"
                iconName="lightbulb"
                fullWidth
                disabled={disabled}
                onClick={() => onAction("hint")}
              >
                Get a hint
              </AppButton>
              <AppButton
                variant="secondary"
                tone="gray"
                size="s"
                iconName="bug"
                fullWidth
                disabled={disabled}
                onClick={() => onAction("debug")}
              >
                Debug
              </AppButton>
            </div>
          )}

          {compact && isExpanded && (
            <AppButton
              variant="tertiary"
              tone="gray"
              size="xs"
              onClick={() => setIsExpanded(false)}
            >
              Collapse previous check
            </AppButton>
          )}
        </div>
      </div>

      {review.status === "likely_complete" && onContinue && (
        <div className={styles.validationReviewInlineAction}>
          <AppButton
            variant="primary"
            tone="purple"
            size="s"
            iconName="arrow-right"
            iconPosition="end"
            fullWidth
            disabled={disabled}
            onClick={onContinue}
          >
            {continueLabel}
          </AppButton>
        </div>
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
  onValidationReviewAction,
  onValidationReviewContinue,
  validationReviewContinueLabel,
  validationReviewRunning = false,
  onOpenFileChangeInEditor,
  onOpenFileChangeInPreview,
}: AiTutorMessageListProps) {
  const showTutorActionCards = inputExperiment === "tutor-action-card";
  const latestReviewIndex = chatMessages.reduce(
    (latest, message, index) =>
      message.validationReview?.kind === "summary" ? index : latest,
    -1,
  );

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
                  <div className={[
                    styles.alertBubble,
                    msg.alertVariant === "rejected" ? styles.alertBubbleRejected : "",
                    msg.alertVariant === "validation" ? styles.alertBubbleValidation : "",
                  ].filter(Boolean).join(" ")}
                  >
                    <FaIcon
                      name={alertIconName(msg.alertVariant)}
                      size="s"
                      className={[
                        styles.alertIcon,
                        msg.alertVariant === "rejected" ? styles.alertIconRejected : "",
                        msg.alertVariant === "validation" ? styles.alertIconValidation : "",
                      ].filter(Boolean).join(" ")}
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
                          compact={
                            msg.validationReview.kind === "summary" &&
                            idx !== latestReviewIndex
                          }
                          onRequestReview={onValidationReviewRequest}
                          onAction={onValidationReviewAction}
                          onContinue={onValidationReviewContinue}
                          continueLabel={validationReviewContinueLabel}
                          isRunning={validationReviewRunning}
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

          {isThinking && !validationReviewRunning && (
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
