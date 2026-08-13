import { useState, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { AiChatMessage, Button } from "@moshebaricdo/cads-react";
import { ScrollArea } from "../../../../ui/scroll-area";
import { FileChip } from "../../../../ui/FileChip";
import { getFileChipIconProps, fileExtensionLabelFromName } from "../../../../ui/fileChipMeta";
import { FaIcon } from "../../../../ui/icons/FaIcon";
import { EditOptionsCard } from "./EditOptionsCard";
import { AgentHandOffCard } from "./AgentHandOffCard";
import { NewProjectPlanQuestionnaireCard } from "./NewProjectPlanQuestionnaireCard";
import { TutorActionCard } from "./TutorActionCard";
import { ThinkingAnimation } from "./ThinkingAnimation";
import { TutorChatFileChip, tutorChatChipType } from "./tutorChatFileChip";
import type {
  AgentHandOffCardData,
  ChatAttachment,
  ChatMessage,
  EditOptionChoice,
  FileChange,
  NewProjectPlanAnswers,
} from "../../../../../types/chat";
import type {
  AiTutorInputExperiment,
} from "../../../../../types/tutor";
import type { FaIconName } from "../../../../../icons/faProRegularCodepoints";
import type {
  ValidationReviewCardData,
} from "../../../../../types/validationReview";
import { isAddableUploadAttachment } from "./uploadIntentClassifier";
import { FileChangesCard, renderMessageContent } from "./messageFormatting";
import {
  hasLaterChatMessageForTest,
  validationReviewSuggestionActions,
  type ValidationReviewFollowUpAction,
} from "./aiTutorMessageListLogic";
import styles from "./AiTutorPanel.module.scss";

interface AiTutorMessageListProps {
  scrollWrapRef: RefObject<HTMLDivElement | null>;
  canScrollUp: boolean;
  canScrollDown: boolean;
  showEmptyState: boolean;
  topPadding: number;
  animateTopPadding?: boolean;
  chatMessages: ChatMessage[];
  isThinking: boolean;
  autoCompleteThinking: boolean;
  thinkingLabel?: string;
  /** Prefix on the cycling thinking terms (e.g. active agent role). */
  thinkingLabelPrefix?: string;
  /** Accent for the agent thinking dot; presence of a prefix selects the agent variant. */
  thinkingAccent?: string;
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
  /**
   * Hand-off card actioned: switch to the agent (and, for dispatch cards
   * carrying a brief, run it). The index lets the owner mark the card.
   */
  onAgentHandOff?: (handOff: AgentHandOffCardData, msgIndex: number) => void;
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

  return (
    <div className={styles.streamAttachmentRow}>
      {msg.attachments.map((att) => {
        const isUpload = att.source === "upload";
        const canAdd = showFileChipActionsInStream && isUpload && isAddableUploadAttachment(att);
        if (showFileChipActionsInStream && isUpload) {
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
              mode="add"
              onAdd={canAdd ? () => onMarkAttachmentAdded(idx, att.path) : undefined}
              addedToProject={att.addedToProject}
            />
          );
        }

        return (
          <TutorChatFileChip
            key={att.path}
            fileName={att.fileName}
            title={att.path}
            useCase="chatStream"
            type={tutorChatChipType({
              source: att.source,
              imageSrc: att.imageSrc,
              mimeType: att.mimeType,
            })}
            metadata={metadataLabelForAttachment(att)}
            imageSrc={att.imageSrc}
          />
        );
      })}
    </div>
  );
}

function EmptyState({
  title = "How can I help?",
  text = "AI Tutor can make project changes, help with the level, or chat about your ideas.",
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
    message.actionCard ||
    message.agentHandOff ||
    (message.fileChanges && message.fileChanges.length > 0),
  );
}

export {
  hasLaterChatMessageForTest,
  hasInstructionGuideActionsForTest,
  validationReviewSuggestionActionsForTest,
} from "./aiTutorMessageListLogic";

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
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIconName="clipboard-check"
          loading={isRunning}
          fullWidth
          disabled={disabled}
          onClick={onRequestReview}
        >
          {isRunning ? "Checking..." : "Check my work"}
        </Button>
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
            <Button
              variant="text"
              color="secondary"
              size="extraSmall"
              onClick={() => setIsExpanded(false)}
            >
              Collapse previous check
            </Button>
          )}
        </div>
      </div>

      {review.status === "likely_complete" && onContinue && (
        <div className={styles.validationReviewInlineAction}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            endIconName="arrow-right"
            fullWidth
            disabled={disabled}
            onClick={onContinue}
          >
            {continueLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

function buildAssistantCustomContent({
  msg,
  idx,
  latestReviewIndex,
  interactiveCardsDisabled,
  onNewProjectPlanQuestionnaireSubmit,
  onEditOptionsSelect,
  onEditOptionsCustomSubmit,
  onCodeChangeAction,
  onOpenFileChangeInEditor,
  onOpenFileChangeInPreview,
  onValidationReviewRequest,
  onValidationReviewContinue,
  validationReviewContinueLabel,
  validationReviewRunning,
  onActionCardUpdate,
  onAgentHandOff,
}: {
  msg: ChatMessage;
  idx: number;
  latestReviewIndex: number;
  interactiveCardsDisabled: boolean;
  onNewProjectPlanQuestionnaireSubmit: AiTutorMessageListProps["onNewProjectPlanQuestionnaireSubmit"];
  onEditOptionsSelect: AiTutorMessageListProps["onEditOptionsSelect"];
  onEditOptionsCustomSubmit: AiTutorMessageListProps["onEditOptionsCustomSubmit"];
  onCodeChangeAction: AiTutorMessageListProps["onCodeChangeAction"];
  onOpenFileChangeInEditor: AiTutorMessageListProps["onOpenFileChangeInEditor"];
  onOpenFileChangeInPreview: AiTutorMessageListProps["onOpenFileChangeInPreview"];
  onValidationReviewRequest: AiTutorMessageListProps["onValidationReviewRequest"];
  onValidationReviewContinue: AiTutorMessageListProps["onValidationReviewContinue"];
  validationReviewContinueLabel: AiTutorMessageListProps["validationReviewContinueLabel"];
  validationReviewRunning: boolean;
  onActionCardUpdate: AiTutorMessageListProps["onActionCardUpdate"];
  onAgentHandOff: AiTutorMessageListProps["onAgentHandOff"];
}): ReactNode {
  if (msg.role !== "assistant") return undefined;

  const parts: ReactNode[] = [];

  if (msg.newProjectPlanQuestionnaire) {
    parts.push(
      <NewProjectPlanQuestionnaireCard
        key="questionnaire"
        questionnaire={msg.newProjectPlanQuestionnaire}
        disabled={interactiveCardsDisabled}
        onSubmit={(answers, moodboardAttachments) =>
          onNewProjectPlanQuestionnaireSubmit(idx, answers, moodboardAttachments)
        }
      />,
    );
  }

  if (msg.editOptions?.status === "pending") {
    parts.push(
      <EditOptionsCard
        key="edit-options"
        editOptions={msg.editOptions}
        disabled={interactiveCardsDisabled || !onEditOptionsSelect}
        onSelect={(option) => onEditOptionsSelect?.(idx, option)}
        onCustomSubmit={(customDirection) =>
          onEditOptionsCustomSubmit?.(idx, customDirection)
        }
      />,
    );
  }

  if (msg.fileChanges && msg.fileChanges.length > 0) {
    parts.push(
      <FileChangesCard
        key="file-changes"
        changes={msg.fileChanges}
        onOpenFileInEditor={onOpenFileChangeInEditor}
        onOpenFileInPreview={onOpenFileChangeInPreview}
      />,
    );
  }

  if (msg.fileChanges && msg.codeChangeStatus === "pending") {
    parts.push(
      <div key="code-change-actions" className={styles.codeChangeActions}>
        <Button
          variant="outlined"
          color="secondary"
          size="small"
          startIconName="xmark"
          fullWidth
          onClick={() => onCodeChangeAction(idx, "rejected")}
        >
          Reject
        </Button>
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIconName="check"
          fullWidth
          onClick={() => onCodeChangeAction(idx, "accepted")}
        >
          Accept
        </Button>
      </div>,
    );
  }

  if (msg.validationReview) {
    parts.push(
      <ValidationReviewCard
        key="validation-review"
        review={msg.validationReview}
        disabled={interactiveCardsDisabled}
        compact={
          msg.validationReview.kind === "summary" && idx !== latestReviewIndex
        }
        onRequestReview={onValidationReviewRequest}
        onContinue={onValidationReviewContinue}
        continueLabel={validationReviewContinueLabel}
        isRunning={validationReviewRunning}
      />,
    );
  }

  if (msg.actionCard) {
    parts.push(
      <TutorActionCard
        key="action-card"
        prompt={msg.actionCard.prompt}
        files={msg.actionCard.files}
        status={msg.actionCard.status}
        onAdd={() => onActionCardUpdate(idx, "added")}
        onDismiss={() => onActionCardUpdate(idx, "dismissed")}
      />,
    );
  }

  if (msg.agentHandOff) {
    parts.push(
      <AgentHandOffCard
        key="agent-hand-off"
        handOff={msg.agentHandOff}
        disabled={interactiveCardsDisabled || !onAgentHandOff}
        onAction={() =>
          msg.agentHandOff && onAgentHandOff?.(msg.agentHandOff, idx)
        }
      />,
    );
  }

  if (parts.length === 0) return undefined;
  return <div className={styles.messageCustomContent}>{parts}</div>;
}

export function AiTutorMessageList({
  scrollWrapRef,
  canScrollUp,
  canScrollDown,
  showEmptyState,
  topPadding,
  animateTopPadding = false,
  chatMessages,
  isThinking,
  autoCompleteThinking,
  thinkingLabel,
  thinkingLabelPrefix,
  thinkingAccent,
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
  onAgentHandOff,
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
          style={{
            paddingTop: `${topPadding}px`,
            transition: animateTopPadding
              ? "padding-top 280ms ease"
              : undefined,
          }}
        >
          {showEmptyState && (
            <EmptyState title={emptyStateTitle} text={emptyStateText} />
          )}

          {chatMessages.map((msg, idx) => {
            if (msg.agentDivider) {
              return (
                <div key={idx} className={styles.messageBlock}>
                  <div
                    className={styles.agentDivider}
                    title={msg.agentDivider.title}
                  >
                    <span className={styles.agentDividerLine} />
                    <span
                      className={styles.agentDividerPill}
                      data-accent={msg.agentDivider.accent}
                    >
                      {msg.agentDivider.iconName && (
                        <FaIcon
                          name={msg.agentDivider.iconName as FaIconName}
                          size="inherit"
                        />
                      )}
                      {msg.agentDivider.label}
                    </span>
                    <span className={styles.agentDividerLine} />
                  </div>
                </div>
              );
            }

            const hasCardContent = hasAssistantCardContent(msg);
            const hasLaterChatMessage = hasLaterChatMessageForTest(chatMessages, idx);
            const customContent = buildAssistantCustomContent({
              msg,
              idx,
              latestReviewIndex,
              interactiveCardsDisabled,
              onNewProjectPlanQuestionnaireSubmit,
              onEditOptionsSelect,
              onEditOptionsCustomSubmit,
              onCodeChangeAction,
              onOpenFileChangeInEditor,
              onOpenFileChangeInPreview,
              onValidationReviewRequest,
              onValidationReviewContinue,
              validationReviewContinueLabel,
              validationReviewRunning,
              onActionCardUpdate,
              onAgentHandOff,
            });

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
                    <AiChatMessage
                      context="Tutor"
                      author={msg.role === "user" ? "Human" : "AI"}
                      className={hasCardContent ? styles.chatMessageWithCard : undefined}
                      hasActionRow={msg.role === "assistant"}
                      hasDownload={false}
                      hasFlagging={false}
                      data-tutor-message-anchor={
                        msg.role === "assistant" ? "assistant-reply-start" : undefined
                      }
                      customContent={customContent}
                    >
                      {msg.content.trim() ? renderMessageContent(msg.content) : null}
                    </AiChatMessage>

                    {msg.role === "assistant" &&
                      msg.validationReview?.kind === "summary" &&
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
                  labelPrefix={thinkingLabelPrefix}
                  variant={thinkingLabelPrefix ? "agent" : "bot"}
                  accent={thinkingAccent}
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
