import { useState, type KeyboardEvent, type RefObject } from "react";
import { ScrollArea } from "../../../../ui/scroll-area";
import { AppButton } from "../../../../ui/AppButton";
import { FileChip } from "../../../../ui/FileChip";
import { getFileChipIconProps, fileExtensionLabelFromName } from "../../../../ui/fileChipMeta";
import { FaIcon } from "../../../../ui/icons/FaIcon";
import { ActionRow } from "./ActionRow";
import { EditOptionsCard } from "./EditOptionsCard";
import { NewProjectPlanQuestionnaireCard } from "./NewProjectPlanQuestionnaireCard";
import { TutorActionCard } from "./TutorActionCard";
import { ThinkingAnimation } from "./ThinkingAnimation";
import type {
  ChatAttachment,
  ChatMessage,
  EditOptionChoice,
  FileChange,
  NewProjectPlanAnswers,
} from "../../../../../types/chat";
import type {
  AiTutorInputExperiment,
} from "../../../../../types/tutor";
import type {
  ValidationReviewCardData,
  ValidationReviewItemStatus,
} from "../../../../../types/validationReview";
import { isAddableUploadAttachment } from "./uploadIntentClassifier";
import { copyTextToClipboard, FileChangesCard, renderMessageContent } from "./messageFormatting";
import styles from "./AiTutorPanel.module.scss";

type ValidationReviewFollowUpAction = "hint" | "debug" | "suggestion";

interface AiTutorMessageListProps {
  scrollWrapRef: RefObject<HTMLDivElement | null>;
  canScrollUp: boolean;
  canScrollDown: boolean;
  showEmptyState: boolean;
  topPadding: number;
  chatMessages: ChatMessage[];
  isThinking: boolean;
  autoCompleteThinking: boolean;
  thinkingLabel?: string;
  inputExperiment: AiTutorInputExperiment;
  onThinkingComplete: () => void;
  onMarkAttachmentAdded: (msgIndex: number, attachmentPath: string) => void;
  onActionCardUpdate: (msgIndex: number, newStatus: "added" | "dismissed") => void;
  enableUploadAddActions?: boolean;
  onCodeChangeAction: (msgIndex: number, action: "accepted" | "rejected") => void;
  onNewProjectPlanQuestionnaireSubmit: (
    msgIndex: number,
    answers: NewProjectPlanAnswers,
    moodboardAttachments: ChatAttachment[],
  ) => void;
  onEditOptionsSelect?: (msgIndex: number, option: EditOptionChoice) => void;
  onEditOptionsCustomSubmit?: (msgIndex: number, customDirection: string) => void;
  interactiveCardsDisabled?: boolean;
  emptyStateTitle?: string;
  emptyStateText?: string;
  onValidationReviewRequest?: () => void;
  onValidationReviewAction?: (action: ValidationReviewFollowUpAction) => void;
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
  enableUploadAddActions = false,
}: {
  msg: ChatMessage;
  idx: number;
  inputExperiment: AiTutorInputExperiment;
  onMarkAttachmentAdded: (msgIndex: number, attachmentPath: string) => void;
  enableUploadAddActions?: boolean;
}) {
  const showFileChipActionsInStream =
    enableUploadAddActions || inputExperiment === "file-chip-action";

  if (msg.role !== "user" || !msg.attachments?.length) return null;

  const codeRefs = msg.attachments.filter((a) => a.source === "code-reference");
  const nonCodeRefs = msg.attachments.filter((a) => a.source !== "code-reference");

  return (
    <>
      {codeRefs.length > 0 && (
        <div className={`${styles.messageRow} ${styles.messageRowUser}`}>
          <div className={styles.streamAttachmentRow}>
            {codeRefs.map((att) => {
              const fileIcon = getFileChipIconProps(att.path);
              return (
              <FileChip
                key={att.path}
                fileName={att.fileName}
                nameTitle={att.path}
                extensionLabel={metadataLabelForAttachment(att)}
                iconName={fileIcon.iconName}
                iconFamily={fileIcon.iconFamily}
                mode="static"
              />
              );
            })}
          </div>
        </div>
      )}

      {!showFileChipActionsInStream && nonCodeRefs.length > 0 && (
        <div className={`${styles.messageRow} ${styles.messageRowUser}`}>
          <div className={styles.streamAttachmentRow}>
            {nonCodeRefs.map((att) => {
              const fileIcon = getFileChipIconProps(att.fileName);
              return (
              <FileChip
                key={att.path}
                fileName={att.fileName}
                nameTitle={att.path}
                extensionLabel={metadataLabelForAttachment(att)}
                iconName={fileIcon.iconName}
                iconFamily={fileIcon.iconFamily}
                imageSrc={att.imageSrc}
                mode="static"
              />
              );
            })}
          </div>
        </div>
      )}

      {showFileChipActionsInStream && (
        <div className={`${styles.messageRow} ${styles.messageRowUser}`}>
          <div className={styles.streamAttachmentRow}>
            {msg.attachments.map((att) => {
              const isUpload = att.source === "upload";
              const canAdd = isUpload && isAddableUploadAttachment(att);
              const fileIcon = getFileChipIconProps(att.path);
              return (
                <FileChip
                  key={att.path}
                  fileName={att.fileName}
                  nameTitle={att.path}
                  extensionLabel={metadataLabelForAttachment(att)}
                  iconName={fileIcon.iconName}
                  iconFamily={fileIcon.iconFamily}
                  imageSrc={att.imageSrc}
                  mode={isUpload ? "add" : "static"}
                  onAdd={canAdd ? () => onMarkAttachmentAdded(idx, att.path) : undefined}
                  addedToProject={att.addedToProject}
                />
              );
            })}
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

function hasAssistantCardContent(message: ChatMessage) {
  if (message.role !== "assistant") return false;
  return Boolean(
    message.newProjectPlanQuestionnaire ||
    message.editOptions?.status === "pending" ||
    message.validationReview ||
    message.instructionGuide ||
    message.actionCard ||
    (message.fileChanges && message.fileChanges.length > 0),
  );
}

export function hasLaterChatMessageForTest(messages: ChatMessage[], messageIndex: number) {
  return messages.length > messageIndex + 1;
}

export function hasInstructionGuideActionsForTest() {
  return false;
}

function validationReviewText(review: ValidationReviewCardData) {
  return [
    review.title,
    review.nextStep,
    ...(review.requirements ?? []),
    ...(review.requirementLabels ?? []),
    ...(review.items ?? []).flatMap((item) => [item.label, item.detail]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function shouldPreferDebugFollowUp(review: ValidationReviewCardData) {
  if (review.followUpPreference === "debug") return true;
  if (review.followUpPreference === "suggestion") return false;

  const text = validationReviewText(review);
  const isStylingFocused =
    review.mode === "open-ended" ||
    /\b(style|styling|css|color|colour|font|typography|spacing|layout|align|alignment|padding|margin|visual|design|polish|responsive)\b/i.test(text);
  const looksBugFocused =
    review.mode === "technical" ||
    /\b(debug|bug|error|broken|fix|logic|javascript|selector|promise|loop|function|event|click|console|trace|not working|fails?)\b/i.test(text);

  return looksBugFocused && !isStylingFocused;
}

function validationReviewSuggestionActions(review: ValidationReviewCardData) {
  const actions: Array<{
    action: ValidationReviewFollowUpAction;
    label: string;
    iconName: "lightbulb" | "bug" | "wand-magic-sparkles";
  }> = [
    { action: "hint", label: "Give me a hint", iconName: "lightbulb" },
  ];

  if (shouldPreferDebugFollowUp(review)) {
    actions.push({ action: "debug", label: "Help me debug", iconName: "bug" });
    return actions;
  }

  actions.push({
    action: "suggestion",
    label: "Give me a suggestion",
    iconName: "wand-magic-sparkles",
  });

  return actions;
}

export const validationReviewSuggestionActionsForTest = validationReviewSuggestionActions;

function ValidationReviewSuggestionChips({
  review,
  disabled,
  onAction,
}: {
  review: ValidationReviewCardData;
  disabled: boolean;
  onAction?: (action: ValidationReviewFollowUpAction) => void;
}) {
  if (!onAction || review.kind !== "summary" || review.status === "likely_complete") {
    return null;
  }

  const actions = validationReviewSuggestionActions(review);

  return (
    <div className={styles.suggestionChipRow} aria-label="Suggested follow-up prompts">
      {actions.map((item) => (
        <button
          key={item.action}
          type="button"
          className={styles.suggestionChip}
          disabled={disabled}
          onClick={() => onAction(item.action)}
        >
          <FaIcon name={item.iconName} size="xs" className={styles.suggestionChipIcon} />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function ValidationReviewCard({
  review,
  disabled,
  compact = false,
  onRequestReview,
  onContinue,
  continueLabel = "Continue",
  isRunning = false,
}: {
  review: ValidationReviewCardData;
  disabled: boolean;
  compact?: boolean;
  onRequestReview?: () => void;
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
                    {item.status === "pass" && <FaIcon name="circle-check" size="m" />}
                  </span>
                  <div className={styles.validationReviewItemContent}>
                    <p className={styles.validationReviewItemLabel}>{item.label}</p>
                  </div>
                </div>
              ))}
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
  thinkingLabel,
  inputExperiment,
  onThinkingComplete,
  onMarkAttachmentAdded,
  onActionCardUpdate,
  enableUploadAddActions = false,
  onCodeChangeAction,
  onNewProjectPlanQuestionnaireSubmit,
  onEditOptionsSelect,
  onEditOptionsCustomSubmit,
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

          {chatMessages.map((msg, idx) => {
            const hasCardContent = hasAssistantCardContent(msg);
            const hasLaterChatMessage = hasLaterChatMessageForTest(chatMessages, idx);

            return (
              <div
                key={idx}
                className={styles.messageBlock}
                data-tutor-message-index={idx}
              >
                <MessageAttachments
                  msg={msg}
                  idx={idx}
                  inputExperiment={inputExperiment}
                  enableUploadAddActions={enableUploadAddActions}
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
                        className={[
                          styles.messageBubble,
                          msg.role === "user"
                            ? styles.messageBubbleUser
                            : styles.messageBubbleAssistant,
                          hasCardContent ? styles.messageBubbleWithCard : "",
                        ].filter(Boolean).join(" ")}
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

                        {msg.role === "assistant" &&
                          msg.editOptions?.status === "pending" && (
                          <EditOptionsCard
                            editOptions={msg.editOptions}
                            disabled={interactiveCardsDisabled || !onEditOptionsSelect}
                            onSelect={(option) => onEditOptionsSelect?.(idx, option)}
                            onCustomSubmit={(customDirection) =>
                              onEditOptionsCustomSubmit?.(idx, customDirection)
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
                            onContinue={onValidationReviewContinue}
                            continueLabel={validationReviewContinueLabel}
                            isRunning={validationReviewRunning}
                          />
                        )}

                        {msg.role === "assistant" && msg.actionCard && (
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
                      <div className={styles.assistantMessageFooter}>
                        <div className={styles.actionRowWrap}>
                          <ActionRow
                            onCopy={() => void copyTextToClipboard(msg.content)}
                            showDownload={false}
                            showFeedback={false}
                          />
                        </div>

                        {msg.validationReview?.kind === "summary" &&
                          idx === latestReviewIndex &&
                          !msg.validationReviewFollowUpAction &&
                          !hasLaterChatMessage &&
                          msg.validationReview.status !== "likely_complete" && (
                            <div className={styles.suggestionChipWrap}>
                              <ValidationReviewSuggestionChips
                                review={msg.validationReview}
                                disabled={interactiveCardsDisabled}
                                onAction={onValidationReviewAction}
                              />
                            </div>
                          )}

                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {isThinking && (!validationReviewRunning || thinkingLabel) && (
            <div className={styles.messageBlock}>
              <div className={styles.messageRow}>
                <ThinkingAnimation
                  autoComplete={autoCompleteThinking}
                  label={thinkingLabel}
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
