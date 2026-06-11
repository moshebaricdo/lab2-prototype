import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type DragEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import { InstructionsDrawer } from "../../InstructionsDrawer";
import type {
  InstructionsDrawerExperiment,
  InstructionsDrawerVisualCue,
} from "../../InstructionsDrawer";
import type {
  AgentHandOffCardData,
  AttachmentStatusContext,
  ChatAttachment,
  ChatMessage,
  EditOptionChoice,
  FileChange,
  NewProjectPlanAnswers,
} from "../../../../../types/chat";
import type {
  AiTutorInputExperiment,
  InstructionGuide,
  InstructionGuideState,
  InstructionOpeningStepSummary,
  InstructionPinnedStep,
  MockTutorConfig,
  TutorContextFile,
  TutorRequestMode,
  TutorSubmitHandler,
  TutorSubmitOptions,
} from "../../../../../types/tutor";
import {
  buildCustomEditOptionChoice,
  enrichEditOptionPrompt,
} from "../../../../../lib/tutor/routing/editClarification";
import type { ValidationReviewCardData } from "../../../../../types/validationReview";
import { buildLevelProgressSnapshot } from "../../../../../lib/validation/levelProgress";
import {
  buildValidationReviewOfferMessage,
  buildValidationReviewResultMessage,
  resolveValidationResultMessage,
  shortValidationCriterionLabel,
} from "../../../../../lib/validation/validationReviewMessaging";
import { AiTutorComposer } from "./AiTutorComposer";
import { AiTutorMessageList } from "./AiTutorMessageList";
import {
  buildAttachmentsForSend,
  buildUniqueUploadPath,
  buildUnreadableUploadAttachment,
  buildUploadedAttachment,
} from "./attachmentUtils";
import { resolveActionCardAttachments } from "./uploadAddWorkflow";
import {
  finishUploadProgress,
  runSimulatedUploadProgress,
  waitForMinimumUploadIndicator,
} from "./uploadProgress";
import { isAddableUploadAttachment } from "./uploadIntentClassifier";
import {
  buildNewProjectPlanPrompt,
  createNewProjectPlanQuestionnaireMessage,
  normalizeNewProjectPlanAnswers,
} from "./newProjectPlanQuestionnaire";
import { getInstructionGuideSignature } from "../../../../../lib/tutor/instruction/instructionGuide";
import type { InstructionAnalysisOpeningCache } from "../../../../../lib/tutor/instruction/instructionAnalysisRunner";
import {
  buildApiKeyRequiredSeedMessage,
  isApiKeyRequiredSeedMessage,
} from "../../../../../lib/tutor/instruction/instructionDelivery";
import { useTutorApiSettings } from "../../../../../hooks/useTutorApiSettings";
import { createInitialInstructionGuideState } from "../../../../../lib/tutor/instruction/instructionCoach";
import { logTutorEvent } from "../../../../../lib/tutor/conversation/tutorDebugLogger";
import {
  appendValidationReviewResultToConversation,
  type ValidationReviewRequestSource,
} from "../../../../../lib/tutor/routing/validationReviewFlow";
import {
  composerModeAfterCardAction,
  composerModeForSend,
} from "../../../../../lib/tutor/routing/tutorComposerMode";
import styles from "./AiTutorPanel.module.scss";

const FOCUS_TUTOR_INPUT_EVENT = "weblab:focus-tutor-input";
type PanelValidationReviewRequestSource = Extract<
  ValidationReviewRequestSource,
  "card" | "composer"
>;
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

interface UploadProcessingResult {
  attachments: ChatAttachment[];
  failedCount: number;
  selectedCount: number;
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

const ATTACHMENT_NOUN_PATTERN =
  /(?:photos?|pictures?|images?|files?|attachments?|assets?|screenshots?|screen\s*shots?|mockups?|wireframes?)/i;

function parseSmallCount(value: string) {
  const numeric = Number.parseInt(value, 10);
  if (Number.isFinite(numeric)) return numeric;
  return NUMBER_WORDS[value.toLowerCase()];
}

function inferMentionedUploadCount(message: string) {
  const numberAlternatives = `\\d+|${Object.keys(NUMBER_WORDS).join("|")}`;
  const beforeNounPattern = new RegExp(
    `\\b(${numberAlternatives})\\s+(?:new\\s+|more\\s+|different\\s+)?${ATTACHMENT_NOUN_PATTERN.source}`,
    "i",
  );
  const beforeMatch = message.match(beforeNounPattern);
  if (beforeMatch?.[1]) return parseSmallCount(beforeMatch[1]);

  const afterNounPattern = new RegExp(
    `${ATTACHMENT_NOUN_PATTERN.source}\\s*(?:x\\s*)?\\(?\\b(${numberAlternatives})\\b\\)?`,
    "i",
  );
  const afterMatch = message.match(afterNounPattern);
  return afterMatch?.[1] ? parseSmallCount(afterMatch[1]) : undefined;
}

function isUsefulUploadAttachment(attachment: ChatAttachment) {
  if (attachment.source !== "upload") return false;
  if (attachment.imageDataUrl ?? attachment.imageSrc) return true;
  const content = attachment.content?.trim() ?? "";
  return Boolean(content) && !/browser could not read this file/i.test(content);
}

function buildAttachmentStatusContext(options: {
  submittedContent: string;
  sentAttachments?: ChatAttachment[];
  failedUploadCount: number;
}): AttachmentStatusContext | undefined {
  const availableUploadCount =
    options.sentAttachments?.filter(isUsefulUploadAttachment).length ?? 0;
  const inferredMentionedUploadCount = inferMentionedUploadCount(options.submittedContent);
  const hasMentionedMoreThanAvailable =
    inferredMentionedUploadCount !== undefined &&
    inferredMentionedUploadCount > availableUploadCount;

  if (options.failedUploadCount === 0 && !hasMentionedMoreThanAvailable) {
    return undefined;
  }

  return {
    availableUploadCount,
    failedUploadCount: options.failedUploadCount || undefined,
    inferredMentionedUploadCount: hasMentionedMoreThanAvailable
      ? inferredMentionedUploadCount
      : undefined,
    instruction:
      "Briefly and naturally acknowledge any missing or unavailable uploaded files at the start of your response, then continue helping with the files and context available. Do not over-explain upload internals or present this as a separate alert.",
  };
}

interface AiTutorPanelProps {
  chatMessages: ChatMessage[];
  setChatMessages: (messages: ChatMessage[]) => void;
  chatInput: string;
  setChatInput: (input: string) => void;
  /** Optional content pinned between the conversation and the composer (e.g. specialist agent strip). */
  agentStrip?: ReactNode;
  /** In-chat hand-off card actioned: switch to the agent (dispatch cards also run their brief). */
  onAgentHandOff?: (handOff: AgentHandOffCardData, msgIndex: number) => void;
  /** Override the thinking-state label (e.g. "Style agent · reading 3 files"). */
  thinkingLabelOverride?: string;
  /** Accent for the agent thinking dot (agent variant of the thinking state). */
  thinkingAccent?: string;
  showInstructionsDrawer?: boolean;
  instructionsDrawerDefaultOpen?: boolean;
  instructionsDrawerInitialHeightRatio?: number;
  instructionsDrawerVisualCue?: InstructionsDrawerVisualCue;
  instructionsDrawerExperiment?: InstructionsDrawerExperiment;
  /** Increment to play the drawer toggle glow (e.g. first AI Tutor tab visit). */
  tutorDrawerPulseSignal?: number;
  instructionGuide?: InstructionGuide;
  instructionGuideState?: InstructionGuideState;
  onInstructionGuideStateChange?: Dispatch<SetStateAction<InstructionGuideState>>;
  instructionAnalysisOpening?: InstructionAnalysisOpeningCache;
  isInstructionAnalysisPending?: boolean;
  tutorInstructionsDelivery?: boolean;
  instructionsMarkdown?: string;
  instructionPinnedStep?: InstructionPinnedStep;
  inputExperiment?: AiTutorInputExperiment;
  mockTutorConfig?: MockTutorConfig;
  existingProjectFileNames?: string[];
  onStageTutorUpload?: (attachment: ChatAttachment) => true | string;
  onAddTutorUploadToProject?: (attachment: ChatAttachment) => true | string;
  onRemoveStagedTutorUpload?: (attachment: ChatAttachment) => void;
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

export {
  buildValidationReviewOfferMessage,
  buildValidationReviewResultMessage,
} from "../../../../../lib/validation/validationReviewMessaging";

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
    ? ` for this next checklist item: ${shortValidationCriterionLabel(nextCriterion)}`
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

export function buildInstructionGuideSeedMessage(
  guide: InstructionGuide,
  content: string,
): ChatMessage {
  return {
    role: "assistant",
    content,
    instructionGuide: guide,
    instructionGuideSignature: getInstructionGuideSignature(guide),
  };
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
  agentStrip,
  onAgentHandOff,
  thinkingLabelOverride,
  thinkingAccent,
  showInstructionsDrawer = true,
  instructionsDrawerDefaultOpen = true,
  instructionsDrawerInitialHeightRatio,
  instructionsDrawerVisualCue = "none",
  instructionsDrawerExperiment = "default",
  tutorDrawerPulseSignal = 0,
  instructionGuide,
  instructionGuideState,
  onInstructionGuideStateChange,
  instructionAnalysisOpening,
  isInstructionAnalysisPending = false,
  tutorInstructionsDelivery = false,
  instructionsMarkdown = "",
  instructionPinnedStep,
  inputExperiment = "default",
  mockTutorConfig,
  onStageTutorUpload,
  onAddTutorUploadToProject,
  onRemoveStagedTutorUpload,
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
  const [uploadProgressByPath, setUploadProgressByPath] = useState<Record<string, number>>({});
  const [codeAttachmentTimestamps, setCodeAttachmentTimestamps] = useState<Record<string, string>>({});
  const [codeAttachmentContexts, setCodeAttachmentContexts] = useState<Record<string, CodeAttachmentContext>>({});
  const [isThinking, setIsThinking] = useState(false);
  const [isValidationReviewRunning, setIsValidationReviewRunning] = useState(false);
  const [validationReviewRequestSource, setValidationReviewRequestSource] =
    useState<PanelValidationReviewRequestSource | null>(null);
  const [generatedTutorResponse, setGeneratedTutorResponse] = useState<ChatMessage | null>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const chatMessagesRef = useRef(chatMessages);
  const attachedFilesRef = useRef(attachedFiles);
  const uploadedAttachmentContextsRef = useRef(uploadedAttachmentContexts);
  const codeAttachmentTimestampsRef = useRef(codeAttachmentTimestamps);
  const codeAttachmentContextsRef = useRef(codeAttachmentContexts);
  const pendingUploadPromisesRef = useRef(new Set<Promise<UploadProcessingResult>>());
  const pendingPreviewUrlsRef = useRef<Record<string, string>>({});
  const uploadFailureCountSinceLastSendRef = useRef(0);
  const hasAutoClosedDrawerOnFirstSendRef = useRef(false);
  const hasPlayedFirstCollapseTogglePulseRef = useRef(false);
  const pendingFirstCollapsePulseRef = useRef(false);
  const [drawerCloseSignal, setDrawerCloseSignal] = useState(0);
  const [isPreparingInstructionOpening, setIsPreparingInstructionOpening] = useState(false);
  const openingSeedGenerationRef = useRef(0);
  const [showDrawerTogglePulse, setShowDrawerTogglePulse] = useState(false);
  const generatedTutorResponseRef = useRef<ChatMessage | null>(generatedTutorResponse);
  chatMessagesRef.current = chatMessages;
  attachedFilesRef.current = attachedFiles;
  uploadedAttachmentContextsRef.current = uploadedAttachmentContexts;
  codeAttachmentTimestampsRef.current = codeAttachmentTimestamps;
  codeAttachmentContextsRef.current = codeAttachmentContexts;
  generatedTutorResponseRef.current = generatedTutorResponse;
  const { hasApiKey: hasTutorApiKey } = useTutorApiSettings();

  const contextFileByPath = useMemo(
    () => new Map(availableContextFiles.map((file) => [file.path, file])),
    [availableContextFiles],
  );
  const isCloseOnFirstSendExperiment =
    instructionsDrawerExperiment === "close-on-first-send";
  const drawerToChatGap = 10;
  // `drawerHeight` reflects the full floating drawer chrome (panel + pinned step
  // + toggle), so a single gap keeps the chat stream clear in every state.
  const topPadding = showInstructionsDrawer
    ? drawerHeight + drawerToChatGap
    : drawerToChatGap;
  const effectiveIsThinking = isThinking || isRequestRunning;
  const previousChatMessageCountRef = useRef(chatMessages.length);
  const previousEffectiveIsThinkingRef = useRef(effectiveIsThinking);
  const instructionGuideSignature = instructionGuide
    ? getInstructionGuideSignature(instructionGuide)
    : "";

  const resetComposerState = useCallback(() => {
    attachedFilesRef.current = [];
    uploadedAttachmentContextsRef.current = {};
    codeAttachmentTimestampsRef.current = {};
    codeAttachmentContextsRef.current = {};
    uploadFailureCountSinceLastSendRef.current = 0;
    for (const previewUrl of Object.values(pendingPreviewUrlsRef.current)) {
      URL.revokeObjectURL(previewUrl);
    }
    pendingPreviewUrlsRef.current = {};
    setUploadProgressByPath({});
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
    hasAutoClosedDrawerOnFirstSendRef.current = false;
    hasPlayedFirstCollapseTogglePulseRef.current = false;
    pendingFirstCollapsePulseRef.current = false;
    setShowDrawerTogglePulse(false);
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
    if (!tutorDrawerPulseSignal || !showInstructionsDrawer) return;
    window.requestAnimationFrame(() => {
      setShowDrawerTogglePulse(true);
    });
  }, [tutorDrawerPulseSignal, showInstructionsDrawer]);

  useEffect(() => {
    if (!tutorInstructionsDelivery || !instructionsMarkdown.trim()) return;

    const currentMessages = chatMessagesRef.current;
    if (currentMessages.some((message) => message.role === "user")) return;

    if (!hasTutorApiKey) {
      const shouldSeedApiKeyMessage =
        currentMessages.length === 0 ||
        (currentMessages.length === 1 &&
          (isApiKeyRequiredSeedMessage(currentMessages[0]) ||
            Boolean(currentMessages[0]?.instructionGuide)));

      if (!shouldSeedApiKeyMessage) return;

      setIsPreparingInstructionOpening(false);
      pendingAssistantScrollIndexRef.current = 0;
      setChatMessages([buildApiKeyRequiredSeedMessage()]);
      return;
    }

    if (!instructionGuide) {
      if (
        currentMessages.length === 1 &&
        (isApiKeyRequiredSeedMessage(currentMessages[0]) ||
          Boolean(currentMessages[0]?.instructionGuide))
      ) {
        setChatMessages([]);
      }
      setIsPreparingInstructionOpening(isInstructionAnalysisPending);
      return;
    }

    const shouldSeedFresh = currentMessages.length === 0;
    const shouldReplaceApiKeyPlaceholder =
      currentMessages.length === 1 &&
      isApiKeyRequiredSeedMessage(currentMessages[0]);
    const shouldReplaceStaleGuideSeed =
      currentMessages.length === 1 &&
      currentMessages[0]?.instructionGuide &&
      currentMessages[0]?.instructionGuideSignature !== instructionGuideSignature;

    if (!shouldSeedFresh && !shouldReplaceApiKeyPlaceholder && !shouldReplaceStaleGuideSeed) {
      setIsPreparingInstructionOpening(false);
      return;
    }

    const generation = openingSeedGenerationRef.current + 1;
    openingSeedGenerationRef.current = generation;

    const commitOpening = (
      content: string,
      stepSummaries: InstructionOpeningStepSummary[],
    ) => {
      if (openingSeedGenerationRef.current !== generation) return;
      if (chatMessagesRef.current.some((message) => message.role === "user")) return;

      const baseState =
        instructionGuideState?.guideSignature === instructionGuideSignature
          ? instructionGuideState
          : createInitialInstructionGuideState(instructionGuide);

      onInstructionGuideStateChange?.({
        ...baseState,
        guideSignature: instructionGuideSignature,
        openingStepSummaries: stepSummaries,
      });

      pendingAssistantScrollIndexRef.current = 0;
      setChatMessages([buildInstructionGuideSeedMessage(instructionGuide, content)]);
    };

    if (
      instructionAnalysisOpening?.guideSignature === instructionGuideSignature
    ) {
      setIsPreparingInstructionOpening(false);
      commitOpening(
        instructionAnalysisOpening.content,
        instructionAnalysisOpening.stepSummaries,
      );
      return;
    }

    if (isInstructionAnalysisPending) {
      setIsPreparingInstructionOpening(true);
      return;
    }

    logTutorEvent(
      "instruction opening cache missing after analysis completed",
      { guideSignature: instructionGuideSignature },
      "warn",
    );
    setIsPreparingInstructionOpening(false);
  }, [
    hasTutorApiKey,
    instructionAnalysisOpening,
    instructionGuide,
    instructionGuideSignature,
    instructionGuideState,
    instructionsMarkdown,
    isInstructionAnalysisPending,
    onInstructionGuideStateChange,
    setChatMessages,
    tutorInstructionsDelivery,
  ]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { fileName, startLine, endLine, selectedText } = (e as CustomEvent).detail;
      const range = startLine === endLine ? `${startLine}` : `${startLine}-${endLine}`;
      const label = `${fileName} (${range})`;
      const timestamp = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      if (!attachedFilesRef.current.some((file) => file === label)) {
        attachedFilesRef.current = [...attachedFilesRef.current, label];
        setAttachedFiles(attachedFilesRef.current);
      }
      codeAttachmentTimestampsRef.current = {
        ...codeAttachmentTimestampsRef.current,
        [label]: timestamp,
      };
      codeAttachmentContextsRef.current = {
        ...codeAttachmentContextsRef.current,
        [label]: {
          content: selectedText ?? "",
          startLine,
          endLine,
          fileName,
        },
      };
      setCodeAttachmentTimestamps(codeAttachmentTimestampsRef.current);
      setCodeAttachmentContexts(codeAttachmentContextsRef.current);
    };
    window.addEventListener("weblab:add-to-tutor", handler);
    return () => window.removeEventListener("weblab:add-to-tutor", handler);
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const { path, name } = (event as CustomEvent<{ path?: string; name?: string }>).detail ?? {};
      const fileLabel = path || name;
      if (!fileLabel) return;
      if (attachedFilesRef.current.includes(fileLabel)) return;
      attachedFilesRef.current = [...attachedFilesRef.current, fileLabel];
      setAttachedFiles(attachedFilesRef.current);
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

      uploadedAttachmentContextsRef.current = {
        ...uploadedAttachmentContextsRef.current,
        [path]: attachment,
      };
      setUploadedAttachmentContexts(uploadedAttachmentContextsRef.current);
      if (!attachedFilesRef.current.includes(path)) {
        attachedFilesRef.current = [...attachedFilesRef.current, path];
        setAttachedFiles(attachedFilesRef.current);
      }
    };

    window.addEventListener("weblab:add-preview-element-to-tutor", handler);
    return () => window.removeEventListener("weblab:add-preview-element-to-tutor", handler);
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{
        attachment: ChatAttachment;
        result: true | string;
      }>).detail;
      const attachment = detail?.attachment;
      if (!attachment?.path) {
        if (detail) detail.result = "That file could not be attached.";
        return;
      }
      if (attachedFilesRef.current.includes(attachment.path)) {
        detail.result = `${attachment.fileName} is already attached.`;
        return;
      }

      uploadedAttachmentContextsRef.current = {
        ...uploadedAttachmentContextsRef.current,
        [attachment.path]: attachment,
      };
      setUploadedAttachmentContexts(uploadedAttachmentContextsRef.current);
      attachedFilesRef.current = [...attachedFilesRef.current, attachment.path];
      setAttachedFiles(attachedFilesRef.current);
      detail.result = true;
    };

    window.addEventListener("weblab:add-backpack-item-to-chat", handler);
    return () =>
      window.removeEventListener("weblab:add-backpack-item-to-chat", handler);
  }, []);

  const hasPendingNewProjectPlanQuestionnaire = chatMessages.some(
    (message) => message.newProjectPlanQuestionnaire?.status === "pending",
  );
  const hasPendingEditOptions = chatMessages.some(
    (message) => message.editOptions?.status === "pending",
  );
  const composerDisabled =
    effectiveIsThinking ||
    hasPendingAiChanges ||
    hasPendingNewProjectPlanQuestionnaire ||
    hasPendingEditOptions;
  const canSend = Boolean(chatInput.trim() || attachedFiles.length > 0) &&
    !effectiveIsThinking &&
    !hasPendingAiChanges &&
    !hasPendingNewProjectPlanQuestionnaire &&
    !hasPendingEditOptions;
  const showInstructionOpeningThinking =
    tutorInstructionsDelivery &&
    (isPreparingInstructionOpening || isInstructionAnalysisPending) &&
    chatMessages.length === 0;
  const showEmptyState =
    chatMessages.length === 0 && !effectiveIsThinking && !showInstructionOpeningThinking;

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
    if (attachedFilesRef.current.includes(fileLabel)) return;
    const nextAttachedFiles = [...attachedFilesRef.current, fileLabel];
    attachedFilesRef.current = nextAttachedFiles;
    setAttachedFiles(nextAttachedFiles);
  };

  const revokePendingPreviewUrl = (path: string) => {
    const previewUrl = pendingPreviewUrlsRef.current[path];
    if (!previewUrl) return;
    URL.revokeObjectURL(previewUrl);
    const nextPreviewUrls = { ...pendingPreviewUrlsRef.current };
    delete nextPreviewUrls[path];
    pendingPreviewUrlsRef.current = nextPreviewUrls;
  };

  const updateUploadProgress = (path: string, progress: number) => {
    setUploadProgressByPath((prev) => ({ ...prev, [path]: progress }));
  };

  const clearUploadProgress = (path: string) => {
    setUploadProgressByPath((prev) => {
      if (!(path in prev)) return prev;
      const next = { ...prev };
      delete next[path];
      return next;
    });
  };

  const registerPendingUpload = (file: File, path: string) => {
    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    if (previewUrl) {
      pendingPreviewUrlsRef.current = {
        ...pendingPreviewUrlsRef.current,
        [path]: previewUrl,
      };
    }

    const placeholder: ChatAttachment = {
      fileName: file.name,
      path,
      imageSrc: previewUrl ?? null,
      source: "upload",
      mimeType: file.type || undefined,
      sizeBytes: file.size,
    };

    uploadedAttachmentContextsRef.current = {
      ...uploadedAttachmentContextsRef.current,
      [path]: placeholder,
    };

    if (!attachedFilesRef.current.includes(path)) {
      attachedFilesRef.current = [...attachedFilesRef.current, path];
    }

    setUploadedAttachmentContexts({ ...uploadedAttachmentContextsRef.current });
    setAttachedFiles([...attachedFilesRef.current]);
    updateUploadProgress(path, 0);
  };

  const processSingleUpload = async (file: File, path: string): Promise<ChatAttachment> => {
    const stopSimulatedProgress = runSimulatedUploadProgress((progress) => {
      updateUploadProgress(path, progress);
    });

    try {
      const [attachment] = await Promise.all([
        buildUploadedAttachment(file, path),
        waitForMinimumUploadIndicator(),
      ]);
      stopSimulatedProgress();
      await finishUploadProgress((progress) => {
        updateUploadProgress(path, progress);
      });
      return attachment;
    } catch (error) {
      await waitForMinimumUploadIndicator();
      stopSimulatedProgress();
      console.warn("[AiTutorUpload] read failed", {
        name: file.name,
        path,
        type: file.type || "unknown type",
        sizeBytes: file.size,
        error,
      });
      await finishUploadProgress((progress) => {
        updateUploadProgress(path, progress);
      });
      return buildUnreadableUploadAttachment(file, path);
    } finally {
      clearUploadProgress(path);
    }
  };

  const processUploadFiles = async (files: File[]): Promise<UploadProcessingResult> => {
    let failedCount = 0;

    console.info("[AiTutorUpload] selected", files.map((file) => ({
      name: file.name,
      type: file.type || "unknown type",
      sizeBytes: file.size,
    })));

    const existingPaths = new Set([
      ...attachedFilesRef.current,
      ...Object.keys(uploadedAttachmentContextsRef.current),
    ]);

    const pendingUploads = files.map((file) => {
      const path = buildUniqueUploadPath(file.name, existingPaths);
      existingPaths.add(path);
      registerPendingUpload(file, path);
      return { file, path };
    });

    const built = await Promise.all(
      pendingUploads.map(({ file, path }) => processSingleUpload(file, path)),
    );

    console.info("[AiTutorUpload] prepared", built.map((attachment) => ({
      fileName: attachment.fileName,
      path: attachment.path,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      hasImageDataUrl: Boolean(attachment.imageDataUrl),
      hasContent: Boolean(attachment.content?.trim()),
      addable: isAddableUploadAttachment(attachment),
    })));

    const staged: ChatAttachment[] = [];

    for (const attachment of built) {
      if (!isAddableUploadAttachment(attachment)) {
        console.info("[AiTutorUpload] skipped project staging", {
          fileName: attachment.fileName,
          path: attachment.path,
          reason: "not addable",
        });
        staged.push(attachment);
        continue;
      }

      if (onStageTutorUpload) {
        const result = onStageTutorUpload(attachment);
        if (result !== true) {
          failedCount += 1;
          console.warn("[AiTutorUpload] project staging failed silently", {
            fileName: attachment.fileName,
            path: attachment.path,
            reason: result,
          });
          staged.push(attachment);
          continue;
        }
      }

      console.info("[AiTutorUpload] project staging succeeded", {
        fileName: attachment.fileName,
        path: attachment.path,
      });
      staged.push({ ...attachment, addedToProject: true });
    }

    const nextContexts = { ...uploadedAttachmentContextsRef.current };
    for (const attachment of built) {
      nextContexts[attachment.path] = staged.find((item) => item.path === attachment.path) ?? attachment;
    }
    uploadedAttachmentContextsRef.current = nextContexts;
    setUploadedAttachmentContexts(nextContexts);

    for (const { path } of pendingUploads) {
      revokePendingPreviewUrl(path);
    }

    console.info("[AiTutorUpload] attached to composer", built.map((attachment) => ({
      fileName: attachment.fileName,
      path: attachment.path,
      addedToProject: staged.some(
        (stagedAttachment) =>
          stagedAttachment.path === attachment.path && stagedAttachment.addedToProject,
      ),
    })));

    if (failedCount > 0) {
      uploadFailureCountSinceLastSendRef.current += failedCount;
    }

    return {
      attachments: staged,
      failedCount,
      selectedCount: files.length,
    };
  };

  const handleUploadFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (files.length === 0) return;

    const uploadPromise = processUploadFiles(files);
    pendingUploadPromisesRef.current.add(uploadPromise);
    void uploadPromise.finally(() => {
      pendingUploadPromisesRef.current.delete(uploadPromise);
    });
  };

  const removeAttachedFile = (fileLabel: string) => {
    clearUploadProgress(fileLabel);
    revokePendingPreviewUrl(fileLabel);
    const attachment = uploadedAttachmentContextsRef.current[fileLabel];
    if (attachment?.source === "upload") {
      console.info("[AiTutorUpload] removed from composer", {
        fileName: attachment.fileName,
        path: attachment.path,
        addedToProject: Boolean(attachment.addedToProject),
      });
      onRemoveStagedTutorUpload?.(attachment);
    }

    const nextAttachedFiles = attachedFilesRef.current.filter((file) => file !== fileLabel);
    const nextUploadedContexts = { ...uploadedAttachmentContextsRef.current };
    const nextCodeTimestamps = { ...codeAttachmentTimestampsRef.current };
    const nextCodeContexts = { ...codeAttachmentContextsRef.current };
    delete nextUploadedContexts[fileLabel];
    delete nextCodeTimestamps[fileLabel];
    delete nextCodeContexts[fileLabel];

    attachedFilesRef.current = nextAttachedFiles;
    uploadedAttachmentContextsRef.current = nextUploadedContexts;
    codeAttachmentTimestampsRef.current = nextCodeTimestamps;
    codeAttachmentContextsRef.current = nextCodeContexts;
    setAttachedFiles(nextAttachedFiles);
    setUploadedAttachmentContexts(nextUploadedContexts);
    setCodeAttachmentTimestamps(nextCodeTimestamps);
    setCodeAttachmentContexts(nextCodeContexts);
  };

  const handleMarkAttachmentAdded = (msgIndex: number, attachmentPath: string) => {
    const attachment = chatMessages[msgIndex]?.attachments?.find(
      (item) => item.path === attachmentPath,
    );
    const addResult = attachment ? onAddTutorUploadToProject?.(attachment) : true;
    if (addResult !== undefined && addResult !== true) {
      console.warn("[AiTutorUpload] manual chip add failed silently", {
        attachmentPath,
        reason: addResult,
      });
      return;
    }

    logTutorEvent("attachment add-to-project action", {
      messageIndex: msgIndex,
      attachmentPath,
      note: onAddTutorUploadToProject
        ? "Upload manually added to the project from chat chip."
        : "Uploads are staged in uploads/ at composer attach time.",
    });
    setChatMessages(
      chatMessages.map((message, index) => {
        if (index !== msgIndex || !message.attachments?.length) return message;
        return {
          ...message,
          attachments: message.attachments.map((attachment) =>
            attachment.path === attachmentPath
              ? { ...attachment, addedToProject: true }
              : attachment
          ),
        };
      }),
    );
  };

  const handleActionCardUpdate = (msgIndex: number, newStatus: "added" | "dismissed") => {
    const msg = chatMessages[msgIndex];
    const previousUserMessage = chatMessages
      .slice(0, msgIndex)
      .reverse()
      .find((message) => message.role === "user");
    const manuallyAddedAttachmentPaths = new Set<string>();

    if (newStatus === "added" && msg?.actionCard) {
      const attachments = resolveActionCardAttachments(
        msg.actionCard.attachmentPaths,
        previousUserMessage,
      );
      for (const attachment of attachments) {
        const result = onAddTutorUploadToProject?.(attachment);
        if (result !== undefined && result !== true) {
          console.warn("[AiTutorUpload] manual action-card add failed silently", {
            attachmentPath: attachment.path,
            reason: result,
          });
          continue;
        }
        manuallyAddedAttachmentPaths.add(attachment.path);
      }
    }

    logTutorEvent("action card updated", {
      messageIndex: msgIndex,
      status: newStatus,
      files: msg?.actionCard?.files ?? [],
      attachmentPaths: msg?.actionCard?.attachmentPaths ?? [],
    });

    setChatMessages(
      chatMessages.map((m, i) => {
        if (i === msgIndex && m.actionCard) {
          return {
            ...m,
            actionCard: { ...m.actionCard, status: newStatus },
          };
        }

        if (
          newStatus === "added" &&
          manuallyAddedAttachmentPaths.size > 0 &&
          m.role === "user" &&
          m.attachments?.length
        ) {
          return {
            ...m,
            attachments: m.attachments.map((attachment) =>
              manuallyAddedAttachmentPaths.has(attachment.path)
                ? { ...attachment, addedToProject: true }
                : attachment
            ),
          };
        }

        return m;
      }),
    );
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

  const appendValidationReview = useCallback((source: PanelValidationReviewRequestSource = "card") => {
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
        setIsThinking(false);
        setIsValidationReviewRunning(false);
        setValidationReviewRequestSource(null);
        const nextMessages = appendValidationReviewResultToConversation(
          chatMessagesRef.current,
          review,
          resolveValidationResultMessage(review),
        );
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
    submitOptions?: TutorSubmitOptions,
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
      onTutorSubmit(submittedContent, newMessages, requestMode, submitOptions)
        .then((response) => {
          if (requestSerialRef.current !== requestId) return;
          if (response === undefined) {
            setIsThinking(false);
            setGeneratedTutorResponse(null);
            scrollToBottom();
            return;
          }
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

  const handleEditOptionsSelect = (msgIndex: number, option: EditOptionChoice) => {
    if (effectiveIsThinking || hasPendingAiChanges) return;

    const answeredMessages = chatMessagesRef.current.map((message, index) => {
      if (index !== msgIndex || !message.editOptions) return message;
      const { editOptions: _removed, ...messageWithoutEditOptions } = message;
      return messageWithoutEditOptions;
    });
    const submittedContent = enrichEditOptionPrompt(option);
    const newUserMessage: ChatMessage = {
      role: "user",
      content: option.label,
    };
    const nextMessages = [...answeredMessages, newUserMessage];

    logTutorEvent("edit options card selection", {
      messageIndex: msgIndex,
      optionId: option.id,
      optionLabel: option.label,
      promptPreview: submittedContent.slice(0, 180),
    });

    setChatInput("");
    setChatMessages(nextMessages);
    setGeneratedTutorResponse(null);
    resetComposerState();
    startTutorRequest(
      submittedContent,
      nextMessages,
      "build",
      "I had trouble applying that direction. Try choosing it again.",
      { skipEditClarification: true },
    );
    setTutorRequestMode(composerModeAfterCardAction());
    scrollToBottom();
  };

  const handleEditOptionsCustomSubmit = (msgIndex: number, customDirection: string) => {
    const editOptions = chatMessagesRef.current[msgIndex]?.editOptions;
    if (!editOptions) return;

    const option = buildCustomEditOptionChoice(
      editOptions.originalMessage,
      customDirection,
    );
    handleEditOptionsSelect(msgIndex, option);
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
    setTutorRequestMode(composerModeAfterCardAction());
    scrollToBottom();
  };

  const waitForPendingUploads = async () => {
    const pendingUploads = [...pendingUploadPromisesRef.current];
    if (pendingUploads.length === 0) return;

    logTutorEvent("waiting for pending uploads before tutor request", {
      pendingUploadCount: pendingUploads.length,
    });
    await Promise.allSettled(pendingUploads);
  };

  const handleSendMessage = () => {
    if (!canSend) return;
    const submittedText = chatInput.trim();
    const { modeForRequest, modeAfterSend } = composerModeForSend(tutorRequestMode, {
      persistNonAutoMode: showModelSelector,
    });
    const baseMessages = chatMessagesRef.current;
    const acceptedSerial = requestSerialRef.current;
    openingSeedGenerationRef.current += 1;
    setIsPreparingInstructionOpening(false);

    setChatInput("");
    setGeneratedTutorResponse(null);
    setIsThinking(true);
    setTutorRequestMode(modeAfterSend);
    scrollToBottom();

    void (async () => {
      await waitForPendingUploads();
      if (requestSerialRef.current !== acceptedSerial) return;

      const sentAttachments = buildAttachmentsForSend({
        attachedFiles: attachedFilesRef.current,
        codeAttachmentTimestamps: codeAttachmentTimestampsRef.current,
        codeAttachmentContexts: codeAttachmentContextsRef.current,
        contextFileByPath,
        uploadedAttachmentContexts: uploadedAttachmentContextsRef.current,
        attachmentMeta: mockTutorConfig?.attachmentMeta,
      });
      const uploadedAttachmentLabels = sentAttachments
        ?.map((attachment) => attachment.fileName)
        .join(", ");
      const userMessage = submittedText ||
        (uploadedAttachmentLabels ? `Attached files: ${uploadedAttachmentLabels}` : "");
      if (!userMessage) {
        setIsThinking(false);
        return;
      }

      const submittedContent = submittedText || userMessage;
      const failedUploadCount = uploadFailureCountSinceLastSendRef.current;
      const attachmentStatus = buildAttachmentStatusContext({
        submittedContent,
        sentAttachments,
        failedUploadCount,
      });
      uploadFailureCountSinceLastSendRef.current = 0;

      logTutorEvent("composer send clicked", {
        requestMode: modeForRequest,
        composerModeAfterSend: modeAfterSend,
        submittedPreview: submittedContent.slice(0, 240),
        attachmentCount: sentAttachments?.length ?? 0,
        failedUploadCount,
        hasAttachmentStatus: Boolean(attachmentStatus),
        inputExperiment,
        isFunctional: Boolean(onTutorSubmit),
      });
      const newUserMsg: ChatMessage = {
        role: "user",
        content: submittedContent,
        attachments: sentAttachments?.map((attachment) =>
          attachment.source === "upload" && onStageTutorUpload
            ? { ...attachment, addedToProject: true }
            : attachment,
        ),
        attachmentStatus,
      };

      let newMessages = [...baseMessages, newUserMsg];

      const followUp = !onStageTutorUpload && sentAttachments
        ? mockTutorConfig?.buildAttachmentFollowUp?.(sentAttachments, inputExperiment)
        : null;
      if (followUp) {
        newMessages.push(followUp);
      }

      const isFirstMessage = baseMessages.length === 0;
      const seededConversation =
        !onTutorSubmit && isFirstMessage && !sentAttachments && !followUp
          ? resolveSeedConversation(mockTutorConfig?.seedConversation, userMessage)
          : null;

      const drawerIsExpandedEnoughToCollapse = drawerHeight > 48 || drawerIsOpen;
      if (
        isCloseOnFirstSendExperiment &&
        isFirstMessage &&
        showInstructionsDrawer &&
        drawerIsExpandedEnoughToCollapse &&
        !hasAutoClosedDrawerOnFirstSendRef.current
      ) {
        hasAutoClosedDrawerOnFirstSendRef.current = true;
        setDrawerCloseSignal((current) => current + 1);
        if (!hasPlayedFirstCollapseTogglePulseRef.current) {
          pendingFirstCollapsePulseRef.current = true;
        }
      }

      setChatMessages(seededConversation ?? newMessages);

      if (onTutorSubmit) {
        startTutorRequest(
          submittedContent,
          newMessages,
          modeForRequest,
          submitFailureMessage,
        );
      } else if (mockTutorConfig?.response) {
        startTutorRequest(
          submittedContent,
          newMessages,
          modeForRequest,
          "I had trouble preparing those edits. Try sending the request again.",
        );
      } else {
        setIsThinking(false);
      }

      resetComposerState();
      scrollToBottom();
    })();
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
            onOpenChange={(isOpen) => {
              setDrawerIsOpen(isOpen);
              if (isOpen) {
                setShowDrawerTogglePulse(false);
              }
            }}
            initialHeightRatio={instructionsDrawerInitialHeightRatio}
            defaultOpen={instructionsDrawerDefaultOpen}
            closeSignal={drawerCloseSignal}
            collapseAnimation={isCloseOnFirstSendExperiment ? "slide" : "none"}
            showTogglePulse={showDrawerTogglePulse}
            onTogglePulseComplete={() => setShowDrawerTogglePulse(false)}
            onSlideCollapseSettled={() => {
              if (
                !pendingFirstCollapsePulseRef.current ||
                hasPlayedFirstCollapseTogglePulseRef.current
              ) {
                pendingFirstCollapsePulseRef.current = false;
                return;
              }
              pendingFirstCollapsePulseRef.current = false;
              hasPlayedFirstCollapseTogglePulseRef.current = true;
              window.requestAnimationFrame(() => {
                setShowDrawerTogglePulse(true);
              });
            }}
            visualCue={instructionsDrawerVisualCue}
            showLabel={instructionGuide || tutorInstructionsDelivery ? "Show Full Instructions" : undefined}
            hideLabel={instructionGuide || tutorInstructionsDelivery ? "Hide Full Instructions" : undefined}
            pinnedStep={instructionPinnedStep}
            tutorDeliveryToggleLayout={Boolean(instructionGuide || tutorInstructionsDelivery)}
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
        animateTopPadding={false}
        chatMessages={chatMessages}
        isThinking={effectiveIsThinking || showInstructionOpeningThinking}
        autoCompleteThinking={!onTutorSubmit && !showInstructionOpeningThinking}
        thinkingLabel={
          showInstructionOpeningThinking
            ? "Preparing instructions"
            : isValidationReviewRunning && validationReviewRequestSource === "composer"
              ? "Evaluating"
              : undefined
        }
        thinkingLabelPrefix={thinkingLabelOverride}
        thinkingAccent={thinkingAccent}
        inputExperiment={inputExperiment}
        enableUploadAddActions={false}
        onThinkingComplete={handleThinkingComplete}
        emptyStateTitle={emptyStateTitle}
        emptyStateText={emptyStateText}
        onMarkAttachmentAdded={handleMarkAttachmentAdded}
        onActionCardUpdate={handleActionCardUpdate}
        onCodeChangeAction={handleCodeChangeAction}
        onNewProjectPlanQuestionnaireSubmit={handleNewProjectPlanQuestionnaireSubmit}
        onEditOptionsSelect={handleEditOptionsSelect}
        onEditOptionsCustomSubmit={handleEditOptionsCustomSubmit}
        interactiveCardsDisabled={effectiveIsThinking || hasPendingAiChanges}
        onValidationReviewRequest={requestCardValidationReview}
        onValidationReviewAction={handleValidationReviewAction}
        onValidationReviewContinue={onValidationReviewContinue}
        validationReviewContinueLabel={validationReviewContinueLabel}
        validationReviewRunning={isValidationReviewRunning}
        onOpenFileChangeInEditor={onOpenFileChangeInEditor}
        onOpenFileChangeInPreview={onOpenFileChangeInPreview}
        onAgentHandOff={onAgentHandOff}
      />

      {agentStrip}

      <div ref={inputRef}>
        <AiTutorComposer
          inputExperiment={inputExperiment}
          chatInput={chatInput}
          setChatInput={setChatInput}
          attachedFiles={attachedFiles}
          attachmentMeta={mockTutorConfig?.attachmentMeta}
          uploadedAttachmentContexts={uploadedAttachmentContexts}
          uploadProgressByPath={uploadProgressByPath}
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
