import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from "react";
import { InstructionsDrawer } from "../../InstructionsDrawer";
import type { InstructionsDrawerVisualCue } from "../../InstructionsDrawer";
import type {
  ChatAttachment,
  ChatMessage,
  FileChange,
  NewProjectPlanAnswers,
} from "../../../../../types/chat";
import type {
  AiTutorInputExperiment,
  InstructionGuide,
  MockTutorConfig,
  TutorContextFile,
  TutorRequestMode,
  TutorSubmitHandler,
} from "../../../../../types/tutor";
import type {
  LevelProgressSnapshot,
  ValidationReviewCardData,
} from "../../../../../types/validationReview";
import { buildLevelProgressSnapshot } from "../../../../../lib/validation/levelProgress";
import { AiTutorComposer } from "./AiTutorComposer";
import { AiTutorMessageList } from "./AiTutorMessageList";
import {
  buildAttachmentsForSend,
  buildUniqueUploadPath,
  buildUnreadableUploadAttachment,
  buildUploadedAttachment,
} from "./attachmentUtils";
import {
  buildNewProjectPlanPrompt,
  createNewProjectPlanQuestionnaireMessage,
  normalizeNewProjectPlanAnswers,
} from "./newProjectPlanQuestionnaire";
import { getInstructionGuideSignature } from "../../../../../lib/tutor/instructionGuide";
import { buildTutorOpening, formatTutorOpening } from "../../../../../lib/tutor/tutorOpening";
import { logTutorEvent } from "../../../../../lib/tutor/tutorDebugLogger";
import styles from "./AiTutorPanel.module.scss";

const FOCUS_TUTOR_INPUT_EVENT = "weblab:focus-tutor-input";
type ValidationReviewRequestSource = "card" | "composer";
type ValidationReviewFollowUpAction = "hint" | "debug" | "suggestion";

interface CodeAttachmentContext {
  content: string;
  startLine: number;
  endLine: number;
  fileName: string;
}

interface PreviewElementAttachmentDetail {
  previewPath?: string;
  tagName?: string;
  id?: string;
  classList?: string[];
  selector?: string;
  text?: string;
  outerHTML?: string;
  computedStyles?: Record<string, string>;
}

interface AiTutorPanelProps {
  chatMessages: ChatMessage[];
  setChatMessages: (messages: ChatMessage[]) => void;
  chatInput: string;
  setChatInput: (input: string) => void;
  showInstructionsDrawer?: boolean;
  instructionsDrawerDefaultOpen?: boolean;
  instructionsDrawerInitialHeightRatio?: number;
  instructionsDrawerVisualCue?: InstructionsDrawerVisualCue;
  instructionGuide?: InstructionGuide;
  inputExperiment?: AiTutorInputExperiment;
  mockTutorConfig?: MockTutorConfig;
  onAddFileToProject?: (fileName: string) => void;
  instructionsContent?: ReactNode;
  onTutorSubmit?: TutorSubmitHandler;
  onAcceptAiChanges?: (saveTitle?: string) => void;
  onRejectAiChanges?: () => void;
  availableContextFiles?: TutorContextFile[];
  showModelSelector?: boolean;
  composerPlaceholder?: string;
  emptyStateTitle?: string;
  emptyStateText?: string;
  submitFailureMessage?: string;
  tutorRequestMode: TutorRequestMode;
  setTutorRequestMode: (mode: TutorRequestMode) => void;
  hasPendingAiChanges?: boolean;
  isRequestRunning?: boolean;
  onRequestRunningChange?: (isRunning: boolean) => void;
  clearChatSignal?: number;
  newProjectPlanQuestionnaireSignal?: number;
  onOpenFileChangeInEditor?: (change: FileChange) => void;
  onOpenFileChangeInPreview?: (change: FileChange) => void;
  onValidationReview?: () => ValidationReviewCardData | Promise<ValidationReviewCardData>;
  onValidationReviewContinue?: () => void;
  validationReviewContinueLabel?: string;
}

function resolveSeedConversation(
  seedConversation: MockTutorConfig["seedConversation"],
  firstUserMessage: string,
) {
  if (!seedConversation) return null;
  return typeof seedConversation === "function"
    ? seedConversation(firstUserMessage)
    : seedConversation;
}

function resolveMockResponse(
  response: MockTutorConfig["response"],
  input: string,
  conversation: ChatMessage[],
) {
  if (!response) return undefined;
  return typeof response === "function" ? response(input, conversation) : response;
}

function truncatePreviewText(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= 32) return normalized;
  return `${normalized.slice(0, 29)}...`;
}

export function buildValidationReviewOfferMessage(
  submittedContent: string,
  review: ValidationReviewCardData,
) {
  const hasMultipleRequirements = (review.requirements?.length ?? 0) > 1;

  if (/\b(works|worked|working|fixed|done|finished|complete|completed)\b/i.test(submittedContent)) {
    return "Great. I can check your work now and let you know whether you're ready to continue.";
  }

  if (/\b(check|review|validate|grade)\b/i.test(submittedContent)) {
    return hasMultipleRequirements
      ? "I can check your progress and show what looks complete and what to work on next."
      : "I can check your work and let you know whether you're ready to continue.";
  }

  return "When you're ready, I can check your work and let you know whether you're ready to continue.";
}

function shortCriterionLabel(label: string) {
  const normalized = label.replace(/\s+/g, " ").trim();
  if (normalized.length <= 90) return normalized;
  return `${normalized.slice(0, 87)}...`;
}

function validationReviewRetryAction(
  review: ValidationReviewCardData,
  progress: LevelProgressSnapshot | undefined,
) {
  const incompleteCount = progress?.incompleteCriteria.length ?? 0;
  const remainingTarget = incompleteCount > 1 ? "the remaining items" : "the next item";
  const nextLabel = progress?.nextIncompleteCriterion?.label;

  if (nextLabel && nextLabel.length <= 70) {
    return `Next up: ${nextLabel}. Check again when that step is ready.`;
  }

  if (nextLabel) {
    return "Next up: use the remaining checklist item in the review card as your next step, then check again when it is ready.";
  }

  if (review.mode === "technical") {
    return `Work through ${remainingTarget}, then check again.`;
  }

  if (review.mode === "open-ended") {
    return `Keep refining ${remainingTarget}, then check again.`;
  }

  return `Revisit ${remainingTarget}, then check again.`;
}

export function buildValidationReviewResultMessage(review: ValidationReviewCardData) {
  const progress = buildLevelProgressSnapshot(review);
  const passedCount = progress?.passedCriteria.length ?? 0;
  const incompleteCount = progress?.incompleteCriteria.length ?? 0;

  if (review.status === "likely_complete") {
    return passedCount > 1
      ? "Nice work, the checklist looks complete. You can continue now."
      : "Nice work, this looks ready to continue.";
  }

  if (passedCount > 0 && incompleteCount > 0) {
    const completedSummary = passedCount > 1
      ? `${passedCount} checklist items look complete`
      : `${shortCriterionLabel(progress?.passedCriteria[0]?.label ?? "one checklist item")} looks complete`;
    return `Nice, ${completedSummary}. ${validationReviewRetryAction(review, progress)}`;
  }

  if (review.status === "needs_work") {
    return `Not quite yet. ${validationReviewRetryAction(review, progress)}`;
  }

  if (review.status === "in_progress") {
    return `You're making progress. ${validationReviewRetryAction(review, progress)}`;
  }

  return "I don't see a project change yet. Make one focused update, then check again.";
}

function latestSummaryReview(messages: ChatMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const review = messages[index].validationReview;
    if (review?.kind === "summary") return review;
  }
  return null;
}

export function buildValidationReviewActionPrompt(
  action: ValidationReviewFollowUpAction,
  review?: ValidationReviewCardData | null,
) {
  const progress = buildLevelProgressSnapshot(review);
  const nextCriterion = progress?.nextIncompleteCriterion?.label;
  const target = nextCriterion
    ? ` for this next checklist item: ${shortCriterionLabel(nextCriterion)}`
    : " for what to check next";

  if (action === "debug") {
    return `Help me work through${target} without giving away the full answer. Ask me what I tried first, then guide me toward what to test next.`;
  }

  if (action === "suggestion") {
    return `Give me one concrete suggestion${target}. Keep it focused on my current project and explain why it would help.`;
  }

  return `Give me one small hint${target}. Do not tell me the exact fix yet.`;
}

function validationReviewActionDisplayLabel(action: ValidationReviewFollowUpAction) {
  if (action === "debug") return "Help me debug";
  if (action === "suggestion") return "Give me a suggestion";
  return "Give me a hint";
}

export function buildInstructionGuideSeedMessage(guide: InstructionGuide): ChatMessage {
  const opening = buildTutorOpening(guide.fallbackMarkdown, guide);

  return {
    role: "assistant",
    content: formatTutorOpening(opening),
    instructionGuide: guide,
    instructionGuideSignature: getInstructionGuideSignature(guide),
  };
}

function hideValidationReviewOfferActionsWithAlert(messages: ChatMessage[]) {
  let insertedAlert = false;
  const nextMessages: ChatMessage[] = [];

  for (const message of messages) {
    if (message.validationReview?.kind !== "offer") {
      nextMessages.push(message);
      continue;
    }

    nextMessages.push({
      ...message,
      validationReview: undefined,
    });

    if (!insertedAlert) {
      nextMessages.push({
        role: "assistant",
        content: "You requested a review.",
        isAlert: true,
        alertVariant: "validation",
      });
      insertedAlert = true;
    }
  }

  return nextMessages;
}

function formatPreviewElementAttachmentName(detail: PreviewElementAttachmentDetail) {
  const tagName = (detail.tagName || "element").toLowerCase();
  const text = detail.text ? truncatePreviewText(detail.text) : "";

  if (text) return `${tagName}: "${text}"`;
  if (detail.id) return `${tagName}#${detail.id}`;
  if (detail.classList?.[0]) return `${tagName}.${detail.classList[0]}`;
  return `Selected ${tagName}`;
}

export function AiTutorPanel({
  chatMessages,
  setChatMessages,
  chatInput,
  setChatInput,
  showInstructionsDrawer = true,
  instructionsDrawerDefaultOpen = true,
  instructionsDrawerInitialHeightRatio,
  instructionsDrawerVisualCue = "none",
  instructionGuide,
  inputExperiment = "default",
  mockTutorConfig,
  onAddFileToProject,
  instructionsContent,
  onTutorSubmit,
  onAcceptAiChanges,
  onRejectAiChanges,
  availableContextFiles = [],
  showModelSelector = true,
  composerPlaceholder,
  emptyStateTitle,
  emptyStateText,
  submitFailureMessage = "I had trouble preparing those edits. Try sending the request again.",
  tutorRequestMode,
  setTutorRequestMode,
  hasPendingAiChanges = false,
  isRequestRunning = false,
  onRequestRunningChange,
  clearChatSignal = 0,
  newProjectPlanQuestionnaireSignal = 0,
  onOpenFileChangeInEditor,
  onOpenFileChangeInPreview,
  onValidationReview,
  onValidationReviewContinue,
  validationReviewContinueLabel,
}: AiTutorPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const scrollWrapRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const requestSerialRef = useRef(0);
  const hasSeededOnMountRef = useRef(false);
  const reportedLocalRunningRef = useRef(false);
  const lastQuestionnaireSignalRef = useRef(0);
  const pendingAssistantScrollIndexRef = useRef<number | null>(null);
  const [maxDrawerHeight, setMaxDrawerHeight] = useState<number | null>(null);
  const [drawerHeight, setDrawerHeight] = useState(0);
  const [drawerIsOpen, setDrawerIsOpen] = useState(instructionsDrawerDefaultOpen);
  const [isDragOverInput, setIsDragOverInput] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<string[]>(
    mockTutorConfig?.initialAttachments ?? [],
  );
  const [uploadedAttachmentContexts, setUploadedAttachmentContexts] = useState<Record<string, ChatAttachment>>({});
  const [codeAttachmentTimestamps, setCodeAttachmentTimestamps] = useState<Record<string, string>>({});
  const [codeAttachmentContexts, setCodeAttachmentContexts] = useState<Record<string, CodeAttachmentContext>>({});
  const [isThinking, setIsThinking] = useState(false);
  const [isValidationReviewRunning, setIsValidationReviewRunning] = useState(false);
  const [validationReviewRequestSource, setValidationReviewRequestSource] =
    useState<ValidationReviewRequestSource | null>(null);
  const [generatedTutorResponse, setGeneratedTutorResponse] = useState<ChatMessage | null>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const chatMessagesRef = useRef(chatMessages);
  const generatedTutorResponseRef = useRef<ChatMessage | null>(generatedTutorResponse);
  chatMessagesRef.current = chatMessages;
  generatedTutorResponseRef.current = generatedTutorResponse;

  const contextFileByPath = useMemo(
    () => new Map(availableContextFiles.map((file) => [file.path, file])),
    [availableContextFiles],
  );
  const topPadding =
    showInstructionsDrawer && drawerIsOpen ? drawerHeight + 40 : showInstructionsDrawer ? 40 : 8;
  const effectiveIsThinking = isThinking || isRequestRunning;
  const previousChatMessageCountRef = useRef(chatMessages.length);
  const previousEffectiveIsThinkingRef = useRef(effectiveIsThinking);
  const instructionGuideSignature = instructionGuide
    ? getInstructionGuideSignature(instructionGuide)
    : "";

  const resetComposerState = useCallback(() => {
    setAttachedFiles([]);
    setUploadedAttachmentContexts({});
    setCodeAttachmentTimestamps({});
    setCodeAttachmentContexts({});
    setIsDragOverInput(false);
    dragDepthRef.current = 0;
  }, []);

  useEffect(() => {
    if (isThinking) {
      reportedLocalRunningRef.current = true;
      onRequestRunningChange?.(true);
      return;
    }

    if (reportedLocalRunningRef.current) {
      reportedLocalRunningRef.current = false;
      onRequestRunningChange?.(false);
    }
  }, [isThinking, onRequestRunningChange]);

  useEffect(() => () => {
    if (reportedLocalRunningRef.current) {
      reportedLocalRunningRef.current = false;
      onRequestRunningChange?.(false);
    }
  }, [onRequestRunningChange]);

  useEffect(() => {
    if (clearChatSignal === 0) return;
    hasSeededOnMountRef.current = true;
    requestSerialRef.current += 1;
    setIsThinking(false);
    setValidationReviewRequestSource(null);
    setGeneratedTutorResponse(null);
    resetComposerState();
  }, [clearChatSignal, resetComposerState]);

  const getScrollViewport = useCallback(() => {
    return scrollWrapRef.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    ) ?? null;
  }, []);

  const updateScrollFades = useCallback(() => {
    const el = getScrollViewport();
    if (!el) return;
    setCanScrollUp(el.scrollTop > 2);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 2);
  }, [getScrollViewport]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = getScrollViewport();
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [getScrollViewport]);

  const scrollToAssistantReplyStart = useCallback((messageIndex: number) => {
    requestAnimationFrame(() => {
      const viewport = getScrollViewport();
      const anchor = scrollWrapRef.current?.querySelector<HTMLElement>(
        `[data-tutor-message-index="${messageIndex}"] [data-tutor-message-anchor="assistant-reply-start"]`,
      );
      if (!viewport || !anchor) return;

      const viewportRect = viewport.getBoundingClientRect();
      const anchorRect = anchor.getBoundingClientRect();
      const nextTop = viewport.scrollTop + anchorRect.top - viewportRect.top - topPadding;
      viewport.scrollTo({ top: nextTop, behavior: "smooth" });
    });
  }, [getScrollViewport, topPadding]);

  useEffect(() => {
    if (
      newProjectPlanQuestionnaireSignal === 0 ||
      lastQuestionnaireSignalRef.current === newProjectPlanQuestionnaireSignal
    ) {
      return;
    }

    lastQuestionnaireSignalRef.current = newProjectPlanQuestionnaireSignal;
    requestSerialRef.current += 1;
    setIsThinking(false);
    setValidationReviewRequestSource(null);
    setGeneratedTutorResponse(null);
    setChatInput("");
    setTutorRequestMode("plan");
    resetComposerState();

    const currentMessages = chatMessagesRef.current;
    const pendingQuestionIndex = currentMessages.findIndex(
      (message) => message.newProjectPlanQuestionnaire?.status === "pending",
    );
    if (pendingQuestionIndex !== -1) {
      scrollToAssistantReplyStart(pendingQuestionIndex);
      return;
    }

    const nextMessages = [
      ...currentMessages,
      createNewProjectPlanQuestionnaireMessage(),
    ];
    pendingAssistantScrollIndexRef.current = nextMessages.length - 1;
    setChatMessages(nextMessages);
  }, [
    newProjectPlanQuestionnaireSignal,
    resetComposerState,
    scrollToAssistantReplyStart,
    setChatInput,
    setChatMessages,
    setTutorRequestMode,
  ]);

  const appendTutorResponse = useCallback((response: ChatMessage) => {
    setIsThinking(false);
    const nextMessages = [...chatMessagesRef.current, response];
    pendingAssistantScrollIndexRef.current = nextMessages.length - 1;
    setChatMessages(nextMessages);
    setGeneratedTutorResponse(null);
  }, [setChatMessages]);

  const handleThinkingComplete = useCallback(() => {
    setIsThinking(false);
    const response = generatedTutorResponseRef.current;
    if (response) {
      appendTutorResponse(response);
    }
  }, [appendTutorResponse]);

  useEffect(() => {
    if (!generatedTutorResponse) return;
    if (onTutorSubmit || !isThinking) {
      appendTutorResponse(generatedTutorResponse);
    }
  }, [appendTutorResponse, generatedTutorResponse, isThinking, onTutorSubmit]);

  useEffect(() => {
    const pendingIndex = pendingAssistantScrollIndexRef.current;
    const previousMessageCount = previousChatMessageCountRef.current;
    const wasThinking = previousEffectiveIsThinkingRef.current;
    const latestMessageIndex = chatMessages.length - 1;
    const latestMessage = chatMessages[latestMessageIndex];

    previousChatMessageCountRef.current = chatMessages.length;
    previousEffectiveIsThinkingRef.current = effectiveIsThinking;

    if (pendingIndex !== null) {
      pendingAssistantScrollIndexRef.current = null;
      scrollToAssistantReplyStart(pendingIndex);
      return;
    }

    if (
      chatMessages.length > previousMessageCount &&
      wasThinking &&
      latestMessage?.role === "assistant" &&
      !latestMessage.isAlert
    ) {
      scrollToAssistantReplyStart(latestMessageIndex);
    }
  }, [chatMessages, effectiveIsThinking, scrollToAssistantReplyStart]);

  useEffect(() => {
    const el = getScrollViewport();
    if (!el) return;
    updateScrollFades();
    el.addEventListener("scroll", updateScrollFades, { passive: true });
    const ro = new ResizeObserver(updateScrollFades);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollFades);
      ro.disconnect();
    };
  }, [getScrollViewport, updateScrollFades, chatMessages.length]);

  useEffect(() => {
    if (!showInstructionsDrawer) {
      setMaxDrawerHeight(null);
      return;
    }

    const calculateMaxHeight = () => {
      if (containerRef.current && inputRef.current) {
        const containerHeight = containerRef.current.clientHeight;
        const inputHeight = inputRef.current.clientHeight;
        setMaxDrawerHeight(containerHeight - inputHeight - 32);
      }
    };

    calculateMaxHeight();
    window.addEventListener("resize", calculateMaxHeight);
    return () => window.removeEventListener("resize", calculateMaxHeight);
  }, [showInstructionsDrawer]);

  useEffect(() => {
    if (
      !mockTutorConfig?.seedOnMount ||
      chatMessages.length > 0 ||
      hasSeededOnMountRef.current
    ) {
      return;
    }
    const seeded = resolveSeedConversation(
      mockTutorConfig.seedConversation,
      "",
    );
    if (!seeded) return;
    hasSeededOnMountRef.current = true;
    setChatMessages(seeded);
  }, [chatMessages.length, mockTutorConfig, setChatMessages]);

  useEffect(() => {
    if (!instructionGuide) return;
    const seededMessage = buildInstructionGuideSeedMessage(instructionGuide);
    const currentMessages = chatMessagesRef.current;

    if (currentMessages.length === 0) {
      pendingAssistantScrollIndexRef.current = 0;
      setChatMessages([seededMessage]);
      return;
    }

    if (
      currentMessages.length === 1 &&
      currentMessages[0]?.instructionGuide &&
      currentMessages[0]?.instructionGuideSignature !== instructionGuideSignature
    ) {
      pendingAssistantScrollIndexRef.current = 0;
      setChatMessages([seededMessage]);
    }
  }, [instructionGuide, instructionGuideSignature, setChatMessages]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { fileName, startLine, endLine, selectedText } = (e as CustomEvent).detail;
      const range = startLine === endLine ? `${startLine}` : `${startLine}-${endLine}`;
      const label = `${fileName} (${range})`;
      const timestamp = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      setAttachedFiles((prev) =>
        prev.some((f) => f === label) ? prev : [...prev, label],
      );
      setCodeAttachmentTimestamps((prev) => ({ ...prev, [label]: timestamp }));
      setCodeAttachmentContexts((prev) => ({
        ...prev,
        [label]: {
          content: selectedText ?? "",
          startLine,
          endLine,
          fileName,
        },
      }));
    };
    window.addEventListener("weblab:add-to-tutor", handler);
    return () => window.removeEventListener("weblab:add-to-tutor", handler);
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const { path, name } = (event as CustomEvent<{ path?: string; name?: string }>).detail ?? {};
      const fileLabel = path || name;
      if (!fileLabel) return;
      setAttachedFiles((prev) =>
        prev.includes(fileLabel) ? prev : [...prev, fileLabel],
      );
    };
    window.addEventListener("weblab:add-project-file-to-tutor", handler);
    return () => window.removeEventListener("weblab:add-project-file-to-tutor", handler);
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<PreviewElementAttachmentDetail>).detail ?? {};
      const previewPath = detail.previewPath ?? "preview";
      const tagName = detail.tagName ?? "element";
      const elementLabel = formatPreviewElementAttachmentName(detail);
      const path = `preview-elements/${previewPath}#${detail.id || detail.selector || tagName}`;
      const timestamp = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      const classSummary = detail.classList?.length
        ? detail.classList.join(", ")
        : "None";
      const styleSummary = detail.computedStyles
        ? Object.entries(detail.computedStyles)
            .filter(([, value]) => Boolean(value))
            .map(([property, value]) => `${property}: ${value}`)
            .join("\n")
        : "No computed styles captured.";

      const attachment: ChatAttachment = {
        fileName: elementLabel,
        path,
        imageSrc: null,
        timestamp,
        source: "preview-element",
        previewPath,
        selector: detail.selector,
        elementId: detail.id,
        tagName,
        content: [
          "Selected preview element",
          `Page: ${previewPath}`,
          `Selector: ${detail.selector ?? elementLabel}`,
          `Tag: ${tagName}`,
          `ID: ${detail.id || "None"}`,
          `Classes: ${classSummary}`,
          detail.text ? `Text: ${detail.text}` : "Text: None",
          "Computed styles:",
          styleSummary,
          "Rendered HTML:",
          detail.outerHTML || "No HTML snippet captured.",
        ].join("\n"),
      };

      setUploadedAttachmentContexts((prev) => ({ ...prev, [path]: attachment }));
      setAttachedFiles((prev) => prev.includes(path) ? prev : [...prev, path]);
    };

    window.addEventListener("weblab:add-preview-element-to-tutor", handler);
    return () => window.removeEventListener("weblab:add-preview-element-to-tutor", handler);
  }, []);

  const hasPendingNewProjectPlanQuestionnaire = chatMessages.some(
    (message) => message.newProjectPlanQuestionnaire?.status === "pending",
  );
  const composerDisabled =
    effectiveIsThinking ||
    hasPendingAiChanges ||
    hasPendingNewProjectPlanQuestionnaire;
  const canSend = Boolean(chatInput.trim() || attachedFiles.length > 0) &&
    !effectiveIsThinking &&
    !hasPendingAiChanges &&
    !hasPendingNewProjectPlanQuestionnaire;
  const showEmptyState = chatMessages.length === 0 && !effectiveIsThinking;

  const formatUserMessage = () => {
    const trimmedMessage = chatInput.trim();
    if (!trimmedMessage && attachedFiles.length === 0) return null;
    if (attachedFiles.length === 0) return trimmedMessage;

    const attachedFileLabels = attachedFiles.map((filePath) => {
      const attachment = uploadedAttachmentContexts[filePath];
      return attachment?.fileName ?? filePath;
    });
    const attachmentPrefix = `Attached files: ${attachedFileLabels.join(", ")}`;
    return trimmedMessage ? `${attachmentPrefix}\n\n${trimmedMessage}` : attachmentPrefix;
  };

  const mergeAttachedFile = (fileLabel: string) => {
    setAttachedFiles((prev) => {
      if (prev.includes(fileLabel)) return prev;
      return [...prev, fileLabel];
    });
  };

  const handleUploadFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (files.length === 0) return;

    const existingPaths = new Set([
      ...attachedFiles,
      ...Object.keys(uploadedAttachmentContexts),
    ]);

    const uploaded = await Promise.all(files.map(async (file) => {
      const path = buildUniqueUploadPath(file.name, existingPaths);
      existingPaths.add(path);
      try {
        return await buildUploadedAttachment(file, path);
      } catch {
        return buildUnreadableUploadAttachment(file, path);
      }
    }));

    setUploadedAttachmentContexts((prev) => ({
      ...prev,
      ...Object.fromEntries(uploaded.map((attachment) => [attachment.path, attachment])),
    }));
    setAttachedFiles((prev) => {
      const next = [...prev];
      for (const attachment of uploaded) {
        if (!next.includes(attachment.path)) {
          next.push(attachment.path);
        }
      }
      return next;
    });
  };

  const removeAttachedFile = (fileLabel: string) => {
    setAttachedFiles((prev) => prev.filter((file) => file !== fileLabel));
    setUploadedAttachmentContexts((prev) => {
      const next = { ...prev };
      delete next[fileLabel];
      return next;
    });
    setCodeAttachmentTimestamps((prev) => {
      const next = { ...prev };
      delete next[fileLabel];
      return next;
    });
    setCodeAttachmentContexts((prev) => {
      const next = { ...prev };
      delete next[fileLabel];
      return next;
    });
  };

  const handleMarkAttachmentAdded = (msgIndex: number, attachmentPath: string) => {
    const msg = chatMessages[msgIndex];
    const att = msg?.attachments?.find((a) => a.path === attachmentPath);
    logTutorEvent("attachment add-to-project action", {
      messageIndex: msgIndex,
      attachmentPath,
      fileName: att?.fileName,
      source: att?.source,
    });
    if (att) {
      onAddFileToProject?.(att.fileName);
    }

    setChatMessages(
      chatMessages.map((m, i) => {
        if (i !== msgIndex || !m.attachments) return m;
        return {
          ...m,
          attachments: m.attachments.map((a) =>
            a.path === attachmentPath
              ? { ...a, addedToProject: true }
              : a,
          ),
        };
      }),
    );
  };

  const handleActionCardUpdate = (msgIndex: number, newStatus: "added" | "dismissed") => {
    const msg = chatMessages[msgIndex];
    const fileCount = msg?.actionCard?.files.length ?? 0;
    logTutorEvent("action card updated", {
      messageIndex: msgIndex,
      status: newStatus,
      files: msg?.actionCard?.files ?? [],
    });

    if (newStatus === "added") {
      msg?.actionCard?.files.forEach((fileName) => {
        onAddFileToProject?.(fileName);
      });
    }

    const updated = chatMessages.map((m, i) => {
      if (i !== msgIndex || !m.actionCard) return m;
      return {
        ...m,
        actionCard: { ...m.actionCard, status: newStatus },
      };
    });

    if (newStatus === "added") {
      updated.push({
        role: "assistant",
        content: `${fileCount} ${fileCount === 1 ? "file was" : "files were"} added to your project.`,
        isAlert: true,
      });
    }

    setChatMessages(updated);
  };

  const handleCodeChangeAction = (msgIndex: number, action: "accepted" | "rejected") => {
    const msg = chatMessages[msgIndex];
    logTutorEvent("proposal action clicked", {
      messageIndex: msgIndex,
      action,
      saveTitle: msg?.aiSaveTitle,
      fileChanges: msg?.fileChanges,
    });
    if (action === "accepted") {
      onAcceptAiChanges?.(msg?.aiSaveTitle);
    } else {
      onRejectAiChanges?.();
    }

    const updated = chatMessages.map((m, i) => {
      if (i !== msgIndex) return m;
      return { ...m, codeChangeStatus: action as ChatMessage["codeChangeStatus"] };
    });
    const alertMsg: ChatMessage = {
      role: "assistant",
      content:
        action === "accepted"
          ? "You accepted this suggestion."
          : "You dismissed this suggestion.",
      isAlert: true,
      alertVariant: action === "accepted" ? "accepted" : "rejected",
    };
    setChatMessages([...updated, alertMsg]);
    scrollToBottom();
  };

  const appendValidationReview = useCallback((source: ValidationReviewRequestSource = "card") => {
    if (!onValidationReview || effectiveIsThinking || hasPendingAiChanges) return;
    logTutorEvent("validation review requested", {
      source,
      conversationTurns: chatMessagesRef.current.length,
      hasPendingAiChanges,
    });
    setIsThinking(true);
    setIsValidationReviewRunning(true);
    setValidationReviewRequestSource(source);

    let reviewPromise: Promise<ValidationReviewCardData>;
    try {
      reviewPromise = Promise.resolve(onValidationReview());
    } catch (error) {
      console.error("[TutorPanel] Validation review failed", error);
      setIsThinking(false);
      setIsValidationReviewRunning(false);
      setValidationReviewRequestSource(null);
      appendTutorResponse({
        role: "assistant",
        content: "I had trouble checking your work. Try again in a moment.",
      });
      return;
    }

    reviewPromise
      .then((review) => {
        logTutorEvent("validation review completed from card", {
          title: review.title,
          status: review.status,
          confidence: review.confidence,
          itemCount: review.items?.length ?? 0,
        });
        const reviewMessage: ChatMessage = {
          role: "assistant",
          content: buildValidationReviewResultMessage(review),
          validationReview: review,
        };
        setIsThinking(false);
        setIsValidationReviewRunning(false);
        setValidationReviewRequestSource(null);
        const nextMessages = [
          ...hideValidationReviewOfferActionsWithAlert(chatMessagesRef.current),
          reviewMessage,
        ];
        pendingAssistantScrollIndexRef.current = nextMessages.length - 1;
        setChatMessages(nextMessages);
        setGeneratedTutorResponse(null);
        scrollToBottom();
      })
      .catch((error) => {
        logTutorEvent("validation review failed from card", error, "error");
        console.error("[TutorPanel] Validation review failed", error);
        setIsThinking(false);
        setIsValidationReviewRunning(false);
        setValidationReviewRequestSource(null);
        const nextMessages = [...chatMessagesRef.current, {
          role: "assistant",
          content: "I had trouble checking your work. Try again in a moment.",
        } satisfies ChatMessage];
        pendingAssistantScrollIndexRef.current = nextMessages.length - 1;
        setChatMessages(nextMessages);
      });
  }, [
    appendTutorResponse,
    effectiveIsThinking,
    hasPendingAiChanges,
    onValidationReview,
    scrollToBottom,
    setChatMessages,
  ]);

  const requestComposerValidationReview = useCallback(() => {
    appendValidationReview("composer");
  }, [appendValidationReview]);

  const requestCardValidationReview = useCallback(() => {
    appendValidationReview("card");
  }, [appendValidationReview]);

  const startTutorRequest = (
    submittedContent: string,
    newMessages: ChatMessage[],
    requestMode: TutorRequestMode,
    failureMessage: string,
  ) => {
    const requestId = requestSerialRef.current + 1;
    requestSerialRef.current = requestId;
    logTutorEvent("tutor request started", {
      requestId,
      requestMode,
      mode: onTutorSubmit ? "functional" : mockTutorConfig?.response ? "mock" : "local-no-response",
      submittedPreview: submittedContent.slice(0, 240),
      conversationTurns: newMessages.length,
    });

    if (onTutorSubmit) {
      setIsThinking(true);
      onTutorSubmit(submittedContent, newMessages, requestMode)
        .then((response) => {
          if (requestSerialRef.current !== requestId) return;
          logTutorEvent("functional tutor request resolved", {
            requestId,
            hasResponse: Boolean(response),
            hasFileChanges: Boolean(response?.fileChanges?.length),
            fileChanges: response?.fileChanges,
            validationReviewStatus: response?.validationReview?.status,
          });
          setGeneratedTutorResponse(response ?? {
            role: "assistant",
            content: "I finished thinking, but I do not have a response to show yet. Try sending the request again.",
          });
        })
        .catch((error) => {
          if (requestSerialRef.current !== requestId) return;
          logTutorEvent("functional tutor request failed", {
            requestId,
            submittedPreview: submittedContent.slice(0, 240),
            error,
          }, "error");
          console.error("[TutorPanel] Tutor submit failed", {
            requestId,
            submittedContent,
            error,
          });
          setGeneratedTutorResponse({
            role: "assistant",
            content: failureMessage,
          });
        });
    } else if (mockTutorConfig?.response) {
      setIsThinking(true);
      Promise.resolve(resolveMockResponse(mockTutorConfig.response, submittedContent, newMessages))
        .then((response) => {
          if (requestSerialRef.current !== requestId || !response) return;
          logTutorEvent("mock tutor request resolved", {
            requestId,
            hasFileChanges: Boolean(response.fileChanges?.length),
            validationReviewStatus: response.validationReview?.status,
          });
          setGeneratedTutorResponse(response);
        });
    } else {
      setIsThinking(false);
    }
  };

  const handleValidationReviewAction = (action: ValidationReviewFollowUpAction) => {
    if (effectiveIsThinking || hasPendingAiChanges) return;
    const submittedContent = buildValidationReviewActionPrompt(
      action,
      latestSummaryReview(chatMessagesRef.current),
    );
    logTutorEvent("validation review follow-up action", {
      action,
      promptPreview: submittedContent.slice(0, 180),
    });

    const reviewIndex = [...chatMessagesRef.current]
      .reverse()
      .findIndex((message) => message.validationReview?.kind === "summary");
    const latestReviewIndex = reviewIndex === -1
      ? -1
      : chatMessagesRef.current.length - 1 - reviewIndex;
    const updatedMessages = latestReviewIndex === -1
      ? chatMessagesRef.current
      : chatMessagesRef.current.map((message, index) =>
          index === latestReviewIndex
            ? { ...message, validationReviewFollowUpAction: action }
            : message
        );
    const newUserMsg: ChatMessage = {
      role: "user",
      content: validationReviewActionDisplayLabel(action),
    };
    const newMessages = [...updatedMessages, newUserMsg];

    setChatInput("");
    setChatMessages(newMessages);
    setGeneratedTutorResponse(null);
    resetComposerState();
    startTutorRequest(
      submittedContent,
      newMessages,
      "help",
      "I had trouble preparing that guidance. Try clicking the suggestion again.",
    );
    scrollToBottom();
  };

  const handleNewProjectPlanQuestionnaireSubmit = (
    msgIndex: number,
    answers: NewProjectPlanAnswers,
    moodboardAttachments: ChatAttachment[],
  ) => {
    if (effectiveIsThinking || hasPendingAiChanges) return;

    const normalizedAnswers = normalizeNewProjectPlanAnswers(answers);
    if (!normalizedAnswers.projectIdea) return;

    const answeredMessages = chatMessagesRef.current.map((message, index) => {
      if (index !== msgIndex || !message.newProjectPlanQuestionnaire) return message;
      return {
        ...message,
        attachments: moodboardAttachments.length > 0
          ? moodboardAttachments
          : message.attachments,
        newProjectPlanQuestionnaire: {
          status: "answered" as const,
          answers: normalizedAnswers,
          moodboardAttachments,
        },
      };
    });
    const submittedContent = buildNewProjectPlanPrompt(
      normalizedAnswers,
      moodboardAttachments,
    );
    const nextMessages = answeredMessages;
    logTutorEvent("new-project questionnaire submitted", {
      messageIndex: msgIndex,
      projectIdea: normalizedAnswers.projectIdea,
      visualStyle: normalizedAnswers.visualStyle,
      moodboardAttachmentCount: moodboardAttachments.length,
    });

    setTutorRequestMode("plan");
    setChatInput("");
    setChatMessages(nextMessages);
    setGeneratedTutorResponse(null);
    resetComposerState();
    startTutorRequest(
      submittedContent,
      nextMessages,
      "plan",
      "I had trouble turning those answers into a plan. Try submitting them again.",
    );
    scrollToBottom();
  };

  const handleSendMessage = () => {
    if (!canSend) return;
    const userMessage = formatUserMessage();
    if (!userMessage) return;

    const sentAttachments = buildAttachmentsForSend({
      attachedFiles,
      codeAttachmentTimestamps,
      codeAttachmentContexts,
      contextFileByPath,
      uploadedAttachmentContexts,
      attachmentMeta: mockTutorConfig?.attachmentMeta,
    });
    const submittedContent = chatInput.trim() || userMessage;
    logTutorEvent("composer send clicked", {
      requestMode: tutorRequestMode,
      submittedPreview: submittedContent.slice(0, 240),
      attachmentCount: sentAttachments?.length ?? 0,
      inputExperiment,
      isFunctional: Boolean(onTutorSubmit),
    });
    const newUserMsg: ChatMessage = {
      role: "user",
      content: submittedContent,
      attachments: sentAttachments,
    };
    const newMessages = [...chatMessages, newUserMsg];

    const followUp = sentAttachments
      ? mockTutorConfig?.buildAttachmentFollowUp?.(sentAttachments, inputExperiment)
      : null;
    if (followUp) {
      newMessages.push(followUp);
    }

    const isFirstMessage = chatMessages.length === 0;
    const seededConversation =
      !onTutorSubmit && isFirstMessage && !sentAttachments && !followUp
        ? resolveSeedConversation(mockTutorConfig?.seedConversation, userMessage)
        : null;

    setChatMessages(seededConversation ?? newMessages);
    setGeneratedTutorResponse(null);

    if (onTutorSubmit) {
      startTutorRequest(
        submittedContent,
        newMessages,
        tutorRequestMode,
        submitFailureMessage,
      );
    } else if (mockTutorConfig?.response) {
      startTutorRequest(
        submittedContent,
        newMessages,
        tutorRequestMode,
        "I had trouble preparing those edits. Try sending the request again.",
      );
    } else {
      setIsThinking(false);
    }

    setChatInput("");
    if (!showModelSelector && tutorRequestMode !== "auto") {
      setTutorRequestMode("auto");
    }
    resetComposerState();
    scrollToBottom();
  };

  const isFileDragEvent = (event: DragEvent<HTMLElement>) =>
    Array.from(event.dataTransfer.types).includes("application/x-weblab-file");

  const handleDragEnter = (event: DragEvent<HTMLElement>) => {
    if (!isFileDragEvent(event)) return;
    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDragOverInput(true);
  };

  const handleDragOver = (event: DragEvent<HTMLElement>) => {
    if (!isFileDragEvent(event)) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
    setIsDragOverInput(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLElement>) => {
    if (!isFileDragEvent(event)) return;
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragOverInput(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    if (!isFileDragEvent(event)) return;
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDragOverInput(false);

    const rawData = event.dataTransfer.getData("application/x-weblab-file");
    if (!rawData) return;

    try {
      const parsed = JSON.parse(rawData) as { path?: string; name?: string };
      const fileLabel = parsed.path || parsed.name;
      if (fileLabel) {
        mergeAttachedFile(fileLabel);
      }
    } catch (error) {
      console.error("Unable to parse dropped file payload", error);
    }
  };

  return (
    <div className={styles.root} ref={containerRef}>
      {showInstructionsDrawer && (
        <div className={styles.drawerContainer}>
          <InstructionsDrawer
            maxHeight={maxDrawerHeight}
            onHeightChange={setDrawerHeight}
            onOpenChange={setDrawerIsOpen}
            initialHeightRatio={instructionsDrawerInitialHeightRatio}
            defaultOpen={instructionsDrawerDefaultOpen}
            visualCue={instructionsDrawerVisualCue}
            showLabel={instructionGuide ? "Show Full Instructions" : undefined}
            hideLabel={instructionGuide ? "Hide Full Instructions" : undefined}
          >
            {instructionsContent}
          </InstructionsDrawer>
        </div>
      )}

      <AiTutorMessageList
        scrollWrapRef={scrollWrapRef}
        canScrollUp={canScrollUp}
        canScrollDown={canScrollDown}
        showEmptyState={showEmptyState}
        topPadding={topPadding}
        chatMessages={chatMessages}
        isThinking={effectiveIsThinking}
        autoCompleteThinking={!onTutorSubmit}
        thinkingLabel={
          isValidationReviewRunning && validationReviewRequestSource === "composer"
            ? "Evaluating"
            : undefined
        }
        inputExperiment={inputExperiment}
        onThinkingComplete={handleThinkingComplete}
        emptyStateTitle={emptyStateTitle}
        emptyStateText={emptyStateText}
        onMarkAttachmentAdded={handleMarkAttachmentAdded}
        onActionCardUpdate={handleActionCardUpdate}
        onCodeChangeAction={handleCodeChangeAction}
        onNewProjectPlanQuestionnaireSubmit={handleNewProjectPlanQuestionnaireSubmit}
        interactiveCardsDisabled={effectiveIsThinking || hasPendingAiChanges}
        onValidationReviewRequest={requestCardValidationReview}
        onValidationReviewAction={handleValidationReviewAction}
        onValidationReviewContinue={onValidationReviewContinue}
        validationReviewContinueLabel={validationReviewContinueLabel}
        validationReviewRunning={isValidationReviewRunning}
        onOpenFileChangeInEditor={onOpenFileChangeInEditor}
        onOpenFileChangeInPreview={onOpenFileChangeInPreview}
      />

      <div ref={inputRef}>
        <AiTutorComposer
          inputExperiment={inputExperiment}
          chatInput={chatInput}
          setChatInput={setChatInput}
          attachedFiles={attachedFiles}
          attachmentMeta={mockTutorConfig?.attachmentMeta}
          uploadedAttachmentContexts={uploadedAttachmentContexts}
          codeAttachmentTimestamps={codeAttachmentTimestamps}
          isDragOverInput={isDragOverInput}
          showModelSelector={showModelSelector}
          placeholder={composerPlaceholder}
          tutorRequestMode={tutorRequestMode}
          setTutorRequestMode={setTutorRequestMode}
          fileInputRef={fileInputRef}
          canSend={canSend}
          disabled={composerDisabled}
          onCheckWork={onValidationReview ? requestComposerValidationReview : undefined}
          checkWorkDisabled={isValidationReviewRunning}
          onSend={handleSendMessage}
          onRemoveAttachedFile={removeAttachedFile}
          onUploadFileSelection={handleUploadFileSelection}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        />
      </div>
    </div>
  );
}

export type { AiTutorInputExperiment, TutorContextFile } from "../../../../../types/tutor";
